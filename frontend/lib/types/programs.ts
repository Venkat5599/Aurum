import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'

// Compliance Program Types
export interface UserState {
  wallet: PublicKey
  kycVerified: boolean
  isFrozen: boolean
  kycExpiry: BN
  riskScore: number
  txCount24h: number
  lastTxTimestamp: BN
}

// Oracle Program Types
export interface OracleData {
  authority: PublicKey
  goldPriceUsd: BN
  silverPriceUsd: BN
  eurUsdRate: BN
  lastUpdate: BN
  updateCount: BN
  bump: number
}

// Yield Optimizer Program Types
export enum RiskProfile {
  Conservative = 'Conservative',
  Moderate = 'Moderate',
  Aggressive = 'Aggressive',
}

export interface YieldStrategy {
  user: PublicKey
  riskProfile: RiskProfile
  totalAllocated: BN
  lendingAllocation: BN
  hedgingAllocation: BN
  liquidAllocation: BN
  targetLendingPct: number
  targetHedgingPct: number
  targetLiquidPct: number
  currentApy: number
  lastRebalance: BN
  bump: number
}

// Vault Program Types
export interface Vault {
  authority: PublicKey
  auusdMint: PublicKey
  oracle: PublicKey
  compliance: PublicKey
  overCollateralRatio: number
  totalAuusdMinted: BN
  totalCollateralValue: BN
  bump: number
}

// Helper types for frontend
export interface ComplianceData {
  kycVerified: boolean
  kycExpiry: number
  isFrozen: boolean
  riskScore: number
  txCount24h: number
  lastTxTimestamp: number
  riskLevel: 'low' | 'medium' | 'high'
}

export interface OraclePrices {
  goldPrice: number
  silverPrice: number
  eurUsdRate: number
  lastUpdate: number
  updateCount: number
  isStale: boolean
  goldChange24h: number
  silverChange24h: number
}

export interface YieldData {
  riskProfile: RiskProfile
  totalAllocated: number
  lendingPct: number
  hedgingPct: number
  liquidPct: number
  currentApy: number
  lastRebalance: number
  hoursSinceRebalance: number
}

export interface VaultData {
  totalAuusdMinted: number
  totalCollateralValue: number
  overCollateralRatio: number
  currentCollateralRatio: number
  isHealthy: boolean
  userAuusdBalance: number
}
