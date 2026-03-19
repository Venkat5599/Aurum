use anchor_lang::prelude::*;

declare_id!("zcqKh45k7YMcD17VPFdf4kg7K26nkNFojdzQdL8gahz");

#[program]
pub mod compliance {
    use super::*;

    /// Initialize user compliance state
    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        let user_state = &mut ctx.accounts.user_state;
        user_state.wallet = ctx.accounts.user.key();
        user_state.kyc_verified = false;
        user_state.is_frozen = false;
        user_state.kyc_expiry = 0;
        user_state.risk_score = 0;
        user_state.tx_count_24h = 0;
        user_state.last_tx_timestamp = 0;
        
        Ok(())
    }

    /// Verify KYC with zero-knowledge proof
    pub fn verify_kyc(
        ctx: Context<VerifyKYC>,
        proof_data: Vec<u8>,
        expiry: i64,
    ) -> Result<()> {
        let user_state = &mut ctx.accounts.user_state;
        
        // In production: Verify ZK proof using halo2/groth16
        // For MVP: Simple signature verification
        require!(
            proof_data.len() >= 32,
            ComplianceError::InvalidProof
        );
        
        require!(
            expiry > Clock::get()?.unix_timestamp,
            ComplianceError::ProofExpired
        );
        
        user_state.kyc_verified = true;
        user_state.kyc_expiry = expiry;
        
        emit!(KYCVerifiedEvent {
            wallet: ctx.accounts.user.key(),
            expiry,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }

    /// KYT check before transaction
    pub fn kyt_check(
        ctx: Context<KYTCheck>,
        amount: u64,
        recipient: Pubkey,
    ) -> Result<()> {
        let user_state = &mut ctx.accounts.user_state;
        let current_time = Clock::get()?.unix_timestamp;
        
        // Reset 24h counter if needed
        if current_time - user_state.last_tx_timestamp > 86400 {
            user_state.tx_count_24h = 0;
        }
        
        // Calculate risk score (0-100)
        let mut risk_score = 0u8;
        
        // Velocity risk (max 50 points)
        if user_state.tx_count_24h > 10 {
            risk_score += 50;
        } else {
            risk_score += (user_state.tx_count_24h * 5) as u8;
        }
        
        // Amount risk (max 30 points)
        if amount > 100_000 * 1_000_000 { // >$100K
            risk_score += 30;
        } else if amount > 50_000 * 1_000_000 {
            risk_score += 20;
        } else if amount > 10_000 * 1_000_000 {
            risk_score += 10;
        }
        
        // Check if recipient is blacklisted (max 50 points)
        // In production: Check against on-chain blacklist
        // For MVP: Placeholder
        
        user_state.risk_score = risk_score;
        
        // Block high-risk transactions
        require!(
            risk_score < 70,
            ComplianceError::HighRiskTransaction
        );
        
        // Update state
        user_state.tx_count_24h += 1;
        user_state.last_tx_timestamp = current_time;
        
        emit!(KYTCheckEvent {
            wallet: ctx.accounts.user.key(),
            recipient,
            amount,
            risk_score,
            timestamp: current_time,
        });
        
        Ok(())
    }

    /// Freeze address (AML enforcement)
    pub fn freeze_address(
        ctx: Context<FreezeAddress>,
        reason: String,
    ) -> Result<()> {
        require!(
            ctx.accounts.authority.key() == ctx.accounts.compliance_authority.authority,
            ComplianceError::Unauthorized
        );
        
        let user_state = &mut ctx.accounts.user_state;
        user_state.is_frozen = true;
        
        emit!(AddressFrozenEvent {
            wallet: user_state.wallet,
            reason,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }

    /// Travel Rule payload generation (called by transfer hook)
    pub fn generate_travel_rule_payload(
        ctx: Context<TravelRule>,
        amount: u64,
    ) -> Result<()> {
        // Only for transfers > $3K
        require!(
            amount > 3_000 * 1_000_000,
            ComplianceError::BelowTravelRuleThreshold
        );
        
        let sender_state = &ctx.accounts.sender_state;
        let recipient_state = &ctx.accounts.recipient_state;
        
        require!(
            sender_state.kyc_verified && recipient_state.kyc_verified,
            ComplianceError::KYCRequired
        );
        
        // In production: Encrypt payload with recipient's public key
        // For MVP: Log event with hash
        let payload_hash = hash_travel_rule_data(
            sender_state.wallet,
            recipient_state.wallet,
            amount,
        );
        
        // Convert hash to base58 string for logging
        let hash_str = format!("{:?}", payload_hash);
        msg!("TRAVEL_RULE_V1:{}", hash_str);
        
        emit!(TravelRuleEvent {
            sender: sender_state.wallet,
            recipient: recipient_state.wallet,
            amount,
            payload_hash,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }
}

// Accounts

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
pub struct VerifyKYC<'info> {
    #[account(
        mut,
        seeds = [b"user_state", user.key().as_ref()],
        bump
    )]
    pub user_state: Account<'info, UserState>,
    
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct KYTCheck<'info> {
    #[account(
        mut,
        seeds = [b"user_state", user.key().as_ref()],
        bump
    )]
    pub user_state: Account<'info, UserState>,
    
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct FreezeAddress<'info> {
    #[account(mut)]
    pub user_state: Account<'info, UserState>,
    
    pub compliance_authority: Account<'info, ComplianceAuthority>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct TravelRule<'info> {
    pub sender_state: Account<'info, UserState>,
    pub recipient_state: Account<'info, UserState>,
    pub sender: Signer<'info>,
}

// State

#[account]
#[derive(InitSpace)]
pub struct UserState {
    pub wallet: Pubkey,
    pub kyc_verified: bool,
    pub is_frozen: bool,
    pub kyc_expiry: i64,
    pub risk_score: u8,
    pub tx_count_24h: u16,
    pub last_tx_timestamp: i64,
}

#[account]
#[derive(InitSpace)]
pub struct ComplianceAuthority {
    pub authority: Pubkey,
}

// Events

#[event]
pub struct KYCVerifiedEvent {
    pub wallet: Pubkey,
    pub expiry: i64,
    pub timestamp: i64,
}

#[event]
pub struct KYTCheckEvent {
    pub wallet: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub risk_score: u8,
    pub timestamp: i64,
}

#[event]
pub struct AddressFrozenEvent {
    pub wallet: Pubkey,
    pub reason: String,
    pub timestamp: i64,
}

#[event]
pub struct TravelRuleEvent {
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub payload_hash: [u8; 32],
    pub timestamp: i64,
}

// Errors

#[error_code]
pub enum ComplianceError {
    #[msg("Invalid ZK proof")]
    InvalidProof,
    #[msg("Proof expired")]
    ProofExpired,
    #[msg("High risk transaction blocked")]
    HighRiskTransaction,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Below Travel Rule threshold")]
    BelowTravelRuleThreshold,
    #[msg("KYC verification required")]
    KYCRequired,
}

// Helper functions

fn hash_travel_rule_data(sender: Pubkey, recipient: Pubkey, amount: u64) -> [u8; 32] {
    // Simple hash: XOR the pubkeys and amount into a 32-byte array
    let mut hash = [0u8; 32];
    let sender_bytes = sender.to_bytes();
    let recipient_bytes = recipient.to_bytes();
    let amount_bytes = amount.to_le_bytes();
    
    for i in 0..32 {
        hash[i] = sender_bytes[i] ^ recipient_bytes[i];
    }
    for i in 0..8 {
        hash[i] ^= amount_bytes[i];
    }
    
    hash
}
