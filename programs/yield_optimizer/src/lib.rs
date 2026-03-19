use anchor_lang::prelude::*;

declare_id!("4UP1g7N9ZFvQPvbiSTtXHjPYqFcR32g8BFgHeum4esCS");

#[program]
pub mod yield_optimizer {
    use super::*;

    /// Initialize yield strategy for user
    pub fn initialize_strategy(
        ctx: Context<InitializeStrategy>,
        risk_profile: RiskProfile,
    ) -> Result<()> {
        let strategy = &mut ctx.accounts.strategy;
        strategy.user = ctx.accounts.user.key();
        strategy.risk_profile = risk_profile;
        strategy.total_allocated = 0;
        strategy.lending_allocation = 0;
        strategy.hedging_allocation = 0;
        strategy.liquid_allocation = 0;
        strategy.current_apy = 0;
        strategy.last_rebalance = Clock::get()?.unix_timestamp;
        strategy.bump = ctx.bumps.strategy;
        
        // Set initial allocation based on risk profile
        let (lending, hedging, liquid) = match risk_profile {
            RiskProfile::Conservative => (80, 20, 0),
            RiskProfile::Moderate => (60, 35, 5),
            RiskProfile::Aggressive => (40, 50, 10),
        };
        
        strategy.target_lending_pct = lending;
        strategy.target_hedging_pct = hedging;
        strategy.target_liquid_pct = liquid;
        
        msg!("Strategy initialized with {:?} risk profile", risk_profile);
        Ok(())
    }

    /// Allocate funds to yield strategies
    pub fn allocate(
        ctx: Context<Allocate>,
        amount: u64,
    ) -> Result<()> {
        let strategy = &mut ctx.accounts.strategy;
        
        // Calculate allocation based on target percentages
        let lending_amount = amount
            .checked_mul(strategy.target_lending_pct as u64)
            .ok_or(YieldError::MathOverflow)?
            .checked_div(100)
            .ok_or(YieldError::MathOverflow)?;
        
        let hedging_amount = amount
            .checked_mul(strategy.target_hedging_pct as u64)
            .ok_or(YieldError::MathOverflow)?
            .checked_div(100)
            .ok_or(YieldError::MathOverflow)?;
        
        let liquid_amount = amount - lending_amount - hedging_amount;
        
        // Update strategy state
        strategy.total_allocated = strategy.total_allocated
            .checked_add(amount)
            .ok_or(YieldError::MathOverflow)?;
        strategy.lending_allocation = strategy.lending_allocation
            .checked_add(lending_amount)
            .ok_or(YieldError::MathOverflow)?;
        strategy.hedging_allocation = strategy.hedging_allocation
            .checked_add(hedging_amount)
            .ok_or(YieldError::MathOverflow)?;
        strategy.liquid_allocation = strategy.liquid_allocation
            .checked_add(liquid_amount)
            .ok_or(YieldError::MathOverflow)?;
        
        // In production: CPI to lending/hedging protocols
        // For MVP: Log allocation
        
        emit!(AllocationEvent {
            user: strategy.user,
            total_amount: amount,
            lending: lending_amount,
            hedging: hedging_amount,
            liquid: liquid_amount,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }

    /// Rebalance strategy based on market conditions
    pub fn rebalance(
        ctx: Context<Rebalance>,
        volatility: u16,      // From oracle (basis points)
        kyt_risk: u8,         // From compliance (0-100)
    ) -> Result<()> {
        let strategy = &mut ctx.accounts.strategy;
        let current_time = Clock::get()?.unix_timestamp;
        
        // Only rebalance if > 1 hour since last rebalance
        require!(
            current_time - strategy.last_rebalance > 3600,
            YieldError::RebalanceTooSoon
        );
        
        // Calculate new target allocations based on conditions
        let (new_lending, new_hedging, new_liquid) = calculate_optimal_allocation(
            strategy.risk_profile,
            volatility,
            kyt_risk,
        );
        
        // Check if rebalance is needed (>5% deviation)
        let lending_diff = abs_diff(strategy.target_lending_pct, new_lending);
        let needs_rebalance = lending_diff > 5;
        
        if needs_rebalance {
            strategy.target_lending_pct = new_lending;
            strategy.target_hedging_pct = new_hedging;
            strategy.target_liquid_pct = new_liquid;
            strategy.last_rebalance = current_time;
            
            // Calculate new APY estimate
            strategy.current_apy = estimate_apy(new_lending, new_hedging, volatility);
            
            emit!(RebalanceEvent {
                user: strategy.user,
                lending_pct: new_lending,
                hedging_pct: new_hedging,
                liquid_pct: new_liquid,
                estimated_apy: strategy.current_apy,
                volatility,
                kyt_risk,
                timestamp: current_time,
            });
            
            msg!("Rebalanced: {}% lending, {}% hedging, {}% liquid", 
                new_lending, new_hedging, new_liquid);
        }
        
        Ok(())
    }
}

// Accounts

#[derive(Accounts)]
pub struct InitializeStrategy<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + YieldStrategy::INIT_SPACE,
        seeds = [b"strategy", user.key().as_ref()],
        bump
    )]
    pub strategy: Account<'info, YieldStrategy>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Allocate<'info> {
    #[account(
        mut,
        seeds = [b"strategy", user.key().as_ref()],
        bump = strategy.bump
    )]
    pub strategy: Account<'info, YieldStrategy>,
    
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct Rebalance<'info> {
    #[account(
        mut,
        seeds = [b"strategy", strategy.user.as_ref()],
        bump = strategy.bump
    )]
    pub strategy: Account<'info, YieldStrategy>,
    
    /// CHECK: Oracle account for price data
    pub oracle: UncheckedAccount<'info>,
    
    /// CHECK: Compliance account for KYT data
    pub compliance: UncheckedAccount<'info>,
}

// State

#[account]
#[derive(InitSpace)]
pub struct YieldStrategy {
    pub user: Pubkey,
    pub risk_profile: RiskProfile,
    pub total_allocated: u64,
    pub lending_allocation: u64,
    pub hedging_allocation: u64,
    pub liquid_allocation: u64,
    pub target_lending_pct: u8,
    pub target_hedging_pct: u8,
    pub target_liquid_pct: u8,
    pub current_apy: u16,         // Basis points (e.g., 720 = 7.20%)
    pub last_rebalance: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum RiskProfile {
    Conservative,
    Moderate,
    Aggressive,
}

// Events

#[event]
pub struct AllocationEvent {
    pub user: Pubkey,
    pub total_amount: u64,
    pub lending: u64,
    pub hedging: u64,
    pub liquid: u64,
    pub timestamp: i64,
}

#[event]
pub struct RebalanceEvent {
    pub user: Pubkey,
    pub lending_pct: u8,
    pub hedging_pct: u8,
    pub liquid_pct: u8,
    pub estimated_apy: u16,
    pub volatility: u16,
    pub kyt_risk: u8,
    pub timestamp: i64,
}

// Errors

#[error_code]
pub enum YieldError {
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Rebalance too soon")]
    RebalanceTooSoon,
}

// Helper functions

fn calculate_optimal_allocation(
    risk_profile: RiskProfile,
    volatility: u16,
    kyt_risk: u8,
) -> (u8, u8, u8) {
    // Base allocation from risk profile
    let (mut lending, mut hedging, mut liquid) = match risk_profile {
        RiskProfile::Conservative => (80, 20, 0),
        RiskProfile::Moderate => (60, 35, 5),
        RiskProfile::Aggressive => (40, 50, 10),
    };
    
    // Adjust for high volatility (>5%)
    if volatility > 500 {
        // Shift from lending to hedging
        let shift = 10.min(lending);
        lending -= shift;
        hedging += shift;
    }
    
    // Adjust for high KYT risk
    if kyt_risk > 50 {
        // Increase liquid allocation for safety
        let shift = 10.min(lending);
        lending -= shift;
        liquid += shift;
    }
    
    (lending, hedging, liquid)
}

fn estimate_apy(lending_pct: u8, hedging_pct: u8, volatility: u16) -> u16 {
    // Mock APY calculation
    // Lending: 5-8% base
    // Hedging: 8-15% (higher with volatility)
    
    let lending_apy = 600; // 6.00%
    let hedging_apy = 1000 + (volatility / 10); // 10% + volatility bonus
    
    let weighted_apy = (lending_apy as u32 * lending_pct as u32 
        + hedging_apy as u32 * hedging_pct as u32) / 100;
    
    weighted_apy.min(u16::MAX as u32) as u16
}

fn abs_diff(a: u8, b: u8) -> u8 {
    if a > b { a - b } else { b - a }
}
