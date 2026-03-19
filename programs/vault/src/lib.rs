use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo, Burn};

declare_id!("CNThC8D16VAGh3QtDNf3qfr9REsx9AvGfSQ6pEyiv2Yn");

#[program]
pub mod vault {
    use super::*;

    /// Initialize the vault with configuration
    pub fn initialize(
        ctx: Context<Initialize>,
        over_collateral_ratio: u16, // e.g., 110 = 110%
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key();
        vault.auusd_mint = ctx.accounts.auusd_mint.key();
        vault.oracle = ctx.accounts.oracle.key();
        vault.compliance = ctx.accounts.compliance.key();
        vault.over_collateral_ratio = over_collateral_ratio;
        vault.total_auusd_minted = 0;
        vault.total_collateral_value = 0;
        vault.bump = ctx.bumps.vault;
        
        msg!("Vault initialized with {}% over-collateralization", over_collateral_ratio);
        Ok(())
    }

    /// Initialize user state (required before minting)
    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        let user_state = &mut ctx.accounts.user_state;
        user_state.wallet = ctx.accounts.user.key();
        user_state.kyc_verified = true; // Auto-verify for demo
        user_state.is_frozen = false;
        user_state.total_minted = 0;
        user_state.total_redeemed = 0;
        
        msg!("User state initialized for {}", ctx.accounts.user.key());
        Ok(())
    }

    /// Mint auUSD by depositing tokenized commodities
    pub fn mint_auusd(
        ctx: Context<MintAuUSD>,
        amount: u64,
        collateral_amount: u64,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        
        // 1. Verify user has KYC (CPI to compliance program)
        require!(
            ctx.accounts.user_state.kyc_verified,
            VaultError::KYCRequired
        );
        
        // 2. Calculate collateral value from oracle
        // In production: CPI to oracle program to get current price
        // For MVP: Assume 1 gold token = $2650
        let collateral_value_usd = collateral_amount
            .checked_mul(2650)
            .ok_or(VaultError::MathOverflow)?;
        
        // 3. Check over-collateralization requirement
        let required_collateral = amount
            .checked_mul(vault.over_collateral_ratio as u64)
            .ok_or(VaultError::MathOverflow)?
            .checked_div(100)
            .ok_or(VaultError::MathOverflow)?;
        
        require!(
            collateral_value_usd >= required_collateral,
            VaultError::InsufficientCollateral
        );
        
        // 4. Transfer collateral tokens to vault
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.user_collateral.to_account_info(),
                    to: ctx.accounts.vault_collateral.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            collateral_amount,
        )?;
        
        // 5. Mint auUSD to user
        let seeds = &[
            b"vault",
            vault.authority.as_ref(),
            &[vault.bump],
        ];
        let signer = &[&seeds[..]];
        
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.auusd_mint.to_account_info(),
                    to: ctx.accounts.user_auusd.to_account_info(),
                    authority: vault.to_account_info(),
                },
                signer,
            ),
            amount,
        )?;
        
        // 6. Update vault state
        vault.total_auusd_minted = vault.total_auusd_minted
            .checked_add(amount)
            .ok_or(VaultError::MathOverflow)?;
        vault.total_collateral_value = vault.total_collateral_value
            .checked_add(collateral_value_usd)
            .ok_or(VaultError::MathOverflow)?;
        
        emit!(MintEvent {
            user: ctx.accounts.user.key(),
            amount,
            collateral_amount,
            collateral_value: collateral_value_usd,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }


    /// Redeem auUSD for tokenized commodities
    pub fn redeem_auusd(
        ctx: Context<RedeemAuUSD>,
        amount: u64,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        
        // 1. Calculate collateral to return (proportional to auUSD burned)
        let collateral_to_return = vault.total_collateral_value
            .checked_mul(amount)
            .ok_or(VaultError::MathOverflow)?
            .checked_div(vault.total_auusd_minted)
            .ok_or(VaultError::MathOverflow)?;
        
        // Convert USD value back to token amount (assume $2650/token)
        let token_amount = collateral_to_return
            .checked_div(2650)
            .ok_or(VaultError::MathOverflow)?;
        
        // 2. Burn auUSD from user
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.auusd_mint.to_account_info(),
                    from: ctx.accounts.user_auusd.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount,
        )?;
        
        // 3. Transfer collateral back to user
        let seeds = &[
            b"vault",
            vault.authority.as_ref(),
            &[vault.bump],
        ];
        let signer = &[&seeds[..]];
        
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.vault_collateral.to_account_info(),
                    to: ctx.accounts.user_collateral.to_account_info(),
                    authority: vault.to_account_info(),
                },
                signer,
            ),
            token_amount,
        )?;
        
        // 4. Update vault state
        vault.total_auusd_minted = vault.total_auusd_minted
            .checked_sub(amount)
            .ok_or(VaultError::MathOverflow)?;
        vault.total_collateral_value = vault.total_collateral_value
            .checked_sub(collateral_to_return)
            .ok_or(VaultError::MathOverflow)?;
        
        emit!(RedeemEvent {
            user: ctx.accounts.user.key(),
            amount,
            collateral_returned: token_amount,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }
}

// Accounts

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Vault::INIT_SPACE,
        seeds = [b"vault", authority.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, Vault>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub auusd_mint: Account<'info, Mint>,
    
    /// CHECK: Oracle program account
    pub oracle: UncheckedAccount<'info>,
    
    /// CHECK: Compliance program account
    pub compliance: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + UserState::INIT_SPACE,
        seeds = [b"user_state", user.key().as_ref()],
        bump
    )]
    pub user_state: Account<'info, UserState>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintAuUSD<'info> {
    #[account(
        mut,
        seeds = [b"vault", vault.authority.as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        constraint = user_state.wallet == user.key() @ VaultError::InvalidUserState
    )]
    pub user_state: Account<'info, UserState>,
    
    #[account(
        mut,
        constraint = auusd_mint.key() == vault.auusd_mint @ VaultError::InvalidMint
    )]
    pub auusd_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub user_auusd: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_collateral: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub vault_collateral: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RedeemAuUSD<'info> {
    #[account(
        mut,
        seeds = [b"vault", vault.authority.as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        constraint = auusd_mint.key() == vault.auusd_mint @ VaultError::InvalidMint
    )]
    pub auusd_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub user_auusd: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_collateral: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub vault_collateral: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

// State

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub authority: Pubkey,
    pub auusd_mint: Pubkey,
    pub oracle: Pubkey,
    pub compliance: Pubkey,
    pub over_collateral_ratio: u16,
    pub total_auusd_minted: u64,
    pub total_collateral_value: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserState {
    pub wallet: Pubkey,
    pub kyc_verified: bool,
    pub is_frozen: bool,
    pub total_minted: u64,
    pub total_redeemed: u64,
}

// Events

#[event]
pub struct MintEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub collateral_amount: u64,
    pub collateral_value: u64,
    pub timestamp: i64,
}

#[event]
pub struct RedeemEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub collateral_returned: u64,
    pub timestamp: i64,
}

// Errors

#[error_code]
pub enum VaultError {
    #[msg("KYC verification required")]
    KYCRequired,
    #[msg("Insufficient collateral")]
    InsufficientCollateral,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Invalid user state")]
    InvalidUserState,
    #[msg("Invalid mint")]
    InvalidMint,
}
