use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("D9StNM3VEdCopzf9nTuBqFZKDh8kSNPA4tTC68UneHJs");

#[program]
pub mod lending_pool {
    use super::*;

    /// Initialize lending pool
    pub fn initialize(
        ctx: Context<Initialize>,
        base_apy: u16, // Base APY in basis points (e.g., 800 = 8%)
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.authority = ctx.accounts.authority.key();
        pool.token_mint = ctx.accounts.token_mint.key();
        pool.pool_vault = ctx.accounts.pool_vault.key();
        pool.total_deposits = 0;
        pool.total_borrowed = 0;
        pool.base_apy = base_apy;
        pool.utilization_rate = 0;
        pool.current_apy = base_apy;
        pool.last_update = Clock::get()?.unix_timestamp;
        pool.bump = ctx.bumps.pool;

        msg!("Lending pool initialized with {}% base APY", base_apy as f64 / 100.0);
        Ok(())
    }

    /// Deposit tokens into the pool
    pub fn deposit(
        ctx: Context<Deposit>,
        amount: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let user_position = &mut ctx.accounts.user_position;

        // Update pool interest before deposit
        update_pool_interest(pool)?;

        // Transfer tokens from user to pool vault
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token_account.to_account_info(),
                    to: ctx.accounts.pool_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount,
        )?;

        // Update user position
        if user_position.deposited_amount == 0 {
            user_position.user = ctx.accounts.user.key();
            user_position.pool = pool.key();
            user_position.deposit_timestamp = Clock::get()?.unix_timestamp;
        }

        // Calculate accrued interest on existing deposit
        let accrued_interest = calculate_accrued_interest(
            user_position.deposited_amount,
            user_position.last_claim_timestamp,
            pool.current_apy,
        )?;

        user_position.deposited_amount = user_position.deposited_amount
            .checked_add(amount)
            .ok_or(LendingError::MathOverflow)?;
        user_position.accrued_interest = user_position.accrued_interest
            .checked_add(accrued_interest)
            .ok_or(LendingError::MathOverflow)?;
        user_position.last_claim_timestamp = Clock::get()?.unix_timestamp;

        // Update pool totals
        pool.total_deposits = pool.total_deposits
            .checked_add(amount)
            .ok_or(LendingError::MathOverflow)?;

        emit!(DepositEvent {
            user: ctx.accounts.user.key(),
            amount,
            total_deposited: user_position.deposited_amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Withdraw tokens from the pool
    pub fn withdraw(
        ctx: Context<Withdraw>,
        amount: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let user_position = &mut ctx.accounts.user_position;

        // Update pool interest
        update_pool_interest(pool)?;

        // Calculate total available (deposit + interest)
        let accrued_interest = calculate_accrued_interest(
            user_position.deposited_amount,
            user_position.last_claim_timestamp,
            pool.current_apy,
        )?;

        let total_available = user_position.deposited_amount
            .checked_add(user_position.accrued_interest)
            .ok_or(LendingError::MathOverflow)?
            .checked_add(accrued_interest)
            .ok_or(LendingError::MathOverflow)?;

        require!(
            amount <= total_available,
            LendingError::InsufficientBalance
        );

        // Transfer tokens from pool vault to user
        let seeds = &[
            b"pool",
            pool.authority.as_ref(),
            &[pool.bump],
        ];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.pool_vault.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: pool.to_account_info(),
                },
                signer,
            ),
            amount,
        )?;

        // Update user position
        user_position.deposited_amount = total_available
            .checked_sub(amount)
            .ok_or(LendingError::MathOverflow)?;
        user_position.accrued_interest = 0;
        user_position.last_claim_timestamp = Clock::get()?.unix_timestamp;

        // Update pool totals
        pool.total_deposits = pool.total_deposits
            .checked_sub(amount)
            .ok_or(LendingError::MathOverflow)?;

        emit!(WithdrawEvent {
            user: ctx.accounts.user.key(),
            amount,
            remaining: user_position.deposited_amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Claim accrued interest
    pub fn claim_interest(ctx: Context<ClaimInterest>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let user_position = &mut ctx.accounts.user_position;

        // Update pool interest
        update_pool_interest(pool)?;

        // Calculate accrued interest
        let accrued_interest = calculate_accrued_interest(
            user_position.deposited_amount,
            user_position.last_claim_timestamp,
            pool.current_apy,
        )?;

        let total_interest = user_position.accrued_interest
            .checked_add(accrued_interest)
            .ok_or(LendingError::MathOverflow)?;

        require!(total_interest > 0, LendingError::NoInterestToClaim);

        // Transfer interest to user
        let seeds = &[
            b"pool",
            pool.authority.as_ref(),
            &[pool.bump],
        ];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.pool_vault.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: pool.to_account_info(),
                },
                signer,
            ),
            total_interest,
        )?;

        // Reset accrued interest
        user_position.accrued_interest = 0;
        user_position.last_claim_timestamp = Clock::get()?.unix_timestamp;

        emit!(ClaimInterestEvent {
            user: ctx.accounts.user.key(),
            amount: total_interest,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

// Helper functions

fn update_pool_interest(pool: &mut Pool) -> Result<()> {
    let current_time = Clock::get()?.unix_timestamp;
    let time_elapsed = current_time - pool.last_update;

    if time_elapsed > 0 {
        // Update utilization rate
        pool.utilization_rate = if pool.total_deposits > 0 {
            ((pool.total_borrowed as u128 * 10000) / pool.total_deposits as u128) as u16
        } else {
            0
        };

        // Adjust APY based on utilization (higher utilization = higher APY)
        // APY = base_apy * (1 + utilization_rate / 100)
        pool.current_apy = pool.base_apy
            .checked_add(pool.base_apy * pool.utilization_rate / 10000)
            .unwrap_or(pool.base_apy);

        pool.last_update = current_time;
    }

    Ok(())
}

fn calculate_accrued_interest(
    principal: u64,
    last_claim: i64,
    apy: u16,
) -> Result<u64> {
    let current_time = Clock::get()?.unix_timestamp;
    let time_elapsed = current_time - last_claim;

    if time_elapsed <= 0 || principal == 0 {
        return Ok(0);
    }

    // Calculate interest: principal * apy * time_elapsed / (365 * 24 * 60 * 60 * 10000)
    // APY is in basis points (e.g., 800 = 8%)
    let seconds_per_year = 365 * 24 * 60 * 60u64;

    let interest = (principal as u128)
        .checked_mul(apy as u128)
        .ok_or(LendingError::MathOverflow)?
        .checked_mul(time_elapsed as u128)
        .ok_or(LendingError::MathOverflow)?
        .checked_div(seconds_per_year as u128)
        .ok_or(LendingError::MathOverflow)?
        .checked_div(10000)
        .ok_or(LendingError::MathOverflow)?;

    Ok(interest as u64)
}

// Accounts

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Pool::INIT_SPACE,
        seeds = [b"pool", authority.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Token mint for the pool
    pub token_mint: AccountInfo<'info>,

    #[account(mut)]
    pub pool_vault: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [b"pool", pool.authority.as_ref()],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserPosition::INIT_SPACE,
        seeds = [b"position", pool.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_position: Account<'info, UserPosition>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub pool_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [b"pool", pool.authority.as_ref()],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        mut,
        seeds = [b"position", pool.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_position: Account<'info, UserPosition>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub pool_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimInterest<'info> {
    #[account(
        mut,
        seeds = [b"pool", pool.authority.as_ref()],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        mut,
        seeds = [b"position", pool.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_position: Account<'info, UserPosition>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub pool_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// State

#[account]
#[derive(InitSpace)]
pub struct Pool {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub pool_vault: Pubkey,
    pub total_deposits: u64,
    pub total_borrowed: u64,
    pub base_apy: u16,           // Basis points
    pub utilization_rate: u16,   // Basis points
    pub current_apy: u16,        // Basis points
    pub last_update: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserPosition {
    pub user: Pubkey,
    pub pool: Pubkey,
    pub deposited_amount: u64,
    pub accrued_interest: u64,
    pub deposit_timestamp: i64,
    pub last_claim_timestamp: i64,
}

// Events

#[event]
pub struct DepositEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub total_deposited: u64,
    pub timestamp: i64,
}

#[event]
pub struct WithdrawEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub remaining: u64,
    pub timestamp: i64,
}

#[event]
pub struct ClaimInterestEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

// Errors

#[error_code]
pub enum LendingError {
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("No interest to claim")]
    NoInterestToClaim,
}
