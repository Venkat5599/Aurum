import { PublicKey } from '@solana/web3.js'

// Program IDs from deployed Solana programs
export const PROGRAM_IDS = {
  vault: new PublicKey(process.env.NEXT_PUBLIC_VAULT_PROGRAM_ID || 'CNThC8D16VAGh3QtDNf3qfr9REsx9AvGfSQ6pEyiv2Yn'),
  compliance: new PublicKey(process.env.NEXT_PUBLIC_COMPLIANCE_PROGRAM_ID || 'zcqKh45k7YMcD17VPFdf4kg7K26nkNFojdzQdL8gahz'),
  oracle: new PublicKey(process.env.NEXT_PUBLIC_ORACLE_PROGRAM_ID || 'FC952j5bGogrdLzuxxtAEiHRaWhC2v984nRHHvFrcsNp'),
  yieldOptimizer: new PublicKey(process.env.NEXT_PUBLIC_YIELD_PROGRAM_ID || '4UP1g7N9ZFvQPvbiSTtXHjPYqFcR32g8BFgHeum4esCS'),
  auusdMint: new PublicKey(process.env.NEXT_PUBLIC_AUUSD_MINT || '11111111111111111111111111111111'),
}

// RPC Configuration
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com'
export const CLUSTER = (process.env.NEXT_PUBLIC_CLUSTER || 'devnet') as 'devnet' | 'mainnet-beta' | 'testnet'

// PDA seeds from Rust programs
export const SEEDS = {
  userState: 'user_state',
  strategy: 'strategy',
  vault: 'vault',
  oracle: 'oracle',
}

// Constants from Rust programs
export const PRICE_DECIMALS = 8 // Oracle uses 8 decimal precision
export const TRAVEL_RULE_THRESHOLD = 3_000_000_000 // $3,000 in micro-lamports (6 decimals)
export const STALENESS_THRESHOLD = 300 // 5 minutes in seconds
export const HIGH_VOLATILITY_THRESHOLD = 500 // 5% in basis points

// Risk score thresholds
export const RISK_SCORE_LOW = 30
export const RISK_SCORE_MEDIUM = 60

// Collateral ratio thresholds
export const MIN_COLLATERAL_RATIO = 110 // 110%
export const WARNING_COLLATERAL_RATIO = 115 // 115%
