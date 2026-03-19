use anchor_lang::prelude::*;

declare_id!("FC952j5bGogrdLzuxxtAEiHRaWhC2v984nRHHvFrcsNp");

const PRICE_DECIMALS: u8 = 8; // 8 decimal places for prices

#[program]
pub mod oracle {
    use super::*;

    /// Initialize oracle feed
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let oracle_data = &mut ctx.accounts.oracle_data;
        oracle_data.authority = ctx.accounts.authority.key();
        oracle_data.gold_price_usd = 0;
        oracle_data.silver_price_usd = 0;
        oracle_data.eur_usd_rate = 0;
        oracle_data.last_update = 0;
        oracle_data.update_count = 0;
        oracle_data.bump = ctx.bumps.oracle_data;
        
        msg!("Oracle initialized");
        Ok(())
    }

    /// Update prices (called by authorized SIX data pusher)
    pub fn update_prices(
        ctx: Context<UpdatePrices>,
        gold_price: u64,      // Price in USD with 8 decimals (e.g., 265000000000 = $2650.00)
        silver_price: u64,    // Price in USD with 8 decimals
        eur_usd_rate: u64,    // EUR/USD rate with 8 decimals
    ) -> Result<()> {
        let oracle_data = &mut ctx.accounts.oracle_data;
        
        require!(
            ctx.accounts.authority.key() == oracle_data.authority,
            OracleError::Unauthorized
        );
        
        // Validate prices (sanity checks)
        require!(
            gold_price > 100_000_000_000 && gold_price < 1_000_000_000_000, // $1K - $10K
            OracleError::InvalidPrice
        );
        
        require!(
            silver_price > 1_000_000_000 && silver_price < 100_000_000_000, // $10 - $1K
            OracleError::InvalidPrice
        );
        
        let current_time = Clock::get()?.unix_timestamp;
        
        // Calculate volatility (simple: % change from last update)
        let gold_volatility = if oracle_data.gold_price_usd > 0 {
            calculate_volatility(oracle_data.gold_price_usd, gold_price)
        } else {
            0
        };
        
        // Update oracle data
        oracle_data.gold_price_usd = gold_price;
        oracle_data.silver_price_usd = silver_price;
        oracle_data.eur_usd_rate = eur_usd_rate;
        oracle_data.last_update = current_time;
        oracle_data.update_count += 1;
        
        emit!(PriceUpdateEvent {
            gold_price,
            silver_price,
            eur_usd_rate,
            volatility: gold_volatility,
            timestamp: current_time,
        });
        
        // Trigger rebalance if high volatility (>5%)
        if gold_volatility > 500 { // 5.00%
            msg!("HIGH_VOLATILITY_ALERT: {}%", gold_volatility as f64 / 100.0);
        }
        
        Ok(())
    }

    /// Get current collateral value
    pub fn get_collateral_value(
        ctx: Context<GetCollateralValue>,
        gold_amount: u64,
        silver_amount: u64,
    ) -> Result<u64> {
        let oracle_data = &ctx.accounts.oracle_data;
        
        // Ensure data is fresh (< 5 minutes old)
        let current_time = Clock::get()?.unix_timestamp;
        require!(
            current_time - oracle_data.last_update < 300,
            OracleError::StaleData
        );
        
        let gold_value = gold_amount
            .checked_mul(oracle_data.gold_price_usd)
            .ok_or(OracleError::MathOverflow)?
            .checked_div(10u64.pow(PRICE_DECIMALS as u32))
            .ok_or(OracleError::MathOverflow)?;
        
        let silver_value = silver_amount
            .checked_mul(oracle_data.silver_price_usd)
            .ok_or(OracleError::MathOverflow)?
            .checked_div(10u64.pow(PRICE_DECIMALS as u32))
            .ok_or(OracleError::MathOverflow)?;
        
        let total_value = gold_value
            .checked_add(silver_value)
            .ok_or(OracleError::MathOverflow)?;
        
        Ok(total_value)
    }
}

// Accounts

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + OracleData::INIT_SPACE,
        seeds = [b"oracle", authority.key().as_ref()],
        bump
    )]
    pub oracle_data: Account<'info, OracleData>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePrices<'info> {
    #[account(
        mut,
        seeds = [b"oracle", oracle_data.authority.as_ref()],
        bump = oracle_data.bump
    )]
    pub oracle_data: Account<'info, OracleData>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct GetCollateralValue<'info> {
    pub oracle_data: Account<'info, OracleData>,
}

// State

#[account]
#[derive(InitSpace)]
pub struct OracleData {
    pub authority: Pubkey,
    pub gold_price_usd: u64,      // 8 decimals
    pub silver_price_usd: u64,    // 8 decimals
    pub eur_usd_rate: u64,        // 8 decimals
    pub last_update: i64,
    pub update_count: u64,
    pub bump: u8,
}

// Events

#[event]
pub struct PriceUpdateEvent {
    pub gold_price: u64,
    pub silver_price: u64,
    pub eur_usd_rate: u64,
    pub volatility: u16,  // Basis points (e.g., 500 = 5%)
    pub timestamp: i64,
}

// Errors

#[error_code]
pub enum OracleError {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid price")]
    InvalidPrice,
    #[msg("Stale data")]
    StaleData,
    #[msg("Math overflow")]
    MathOverflow,
}

// Helper functions

fn calculate_volatility(old_price: u64, new_price: u64) -> u16 {
    if old_price == 0 {
        return 0;
    }
    
    let diff = if new_price > old_price {
        new_price - old_price
    } else {
        old_price - new_price
    };
    
    // Calculate percentage change in basis points
    let volatility = (diff as u128)
        .checked_mul(10000)
        .unwrap_or(0)
        .checked_div(old_price as u128)
        .unwrap_or(0);
    
    volatility.min(u16::MAX as u128) as u16
}
