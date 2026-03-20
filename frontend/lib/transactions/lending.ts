/**
 * Lending Pool Transaction Functions
 * Handles deposits, withdrawals, and interest claims
 * DEMO MODE: Simplified for build compatibility
 */

import { AnchorProvider } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { PROGRAM_IDS } from '../programs/constants'

const LENDING_POOL_PROGRAM_ID = PROGRAM_IDS.lendingPool

export interface LendingPoolData {
  authority: PublicKey
  tokenMint: PublicKey
  poolVault: PublicKey
  totalDeposits: number
  totalBorrowed: number
  baseApy: number
  utilizationRate: number
  currentApy: number
  lastUpdate: number
}

export interface UserPositionData {
  user: PublicKey
  pool: PublicKey
  depositedAmount: number
  accruedInterest: number
  depositTimestamp: number
  lastClaimTimestamp: number
}

/**
 * Get lending pool PDA
 */
export function getLendingPoolPDA(authority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('pool'), authority.toBuffer()],
    LENDING_POOL_PROGRAM_ID
  )
}

/**
 * Get user position PDA
 */
export function getUserPositionPDA(
  poolAddress: PublicKey,
  userAddress: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('position'), poolAddress.toBuffer(), userAddress.toBuffer()],
    LENDING_POOL_PROGRAM_ID
  )
}

/**
 * Fetch lending pool data
 * DEMO MODE: Returns mock data
 */
export async function fetchLendingPool(
  provider: AnchorProvider,
  poolAuthority: PublicKey
): Promise<LendingPoolData | null> {
  // Demo mode - return mock data
  return {
    authority: poolAuthority,
    tokenMint: PROGRAM_IDS.auusdMint,
    poolVault: PublicKey.default,
    totalDeposits: 1000000,
    totalBorrowed: 500000,
    baseApy: 500,
    utilizationRate: 5000,
    currentApy: 750,
    lastUpdate: Math.floor(Date.now() / 1000),
  }
}

/**
 * Fetch user position data
 * DEMO MODE: Returns mock data
 */
export async function fetchUserPosition(
  provider: AnchorProvider,
  poolAddress: PublicKey,
  userAddress: PublicKey
): Promise<UserPositionData | null> {
  // Demo mode - return mock data
  return {
    user: userAddress,
    pool: poolAddress,
    depositedAmount: 10000,
    accruedInterest: 75,
    depositTimestamp: Math.floor(Date.now() / 1000) - 86400,
    lastClaimTimestamp: Math.floor(Date.now() / 1000) - 86400,
  }
}

/**
 * Calculate current accrued interest for a position
 */
export function calculateAccruedInterest(
  principal: number,
  lastClaimTimestamp: number,
  currentApy: number
): number {
  const currentTime = Math.floor(Date.now() / 1000)
  const timeElapsed = currentTime - lastClaimTimestamp

  if (timeElapsed <= 0 || principal === 0) {
    return 0
  }

  const secondsPerYear = 365 * 24 * 60 * 60
  const interest = (principal * currentApy * timeElapsed) / (secondsPerYear * 10000)

  return Math.floor(interest)
}

/**
 * Deposit tokens into lending pool
 * DEMO MODE: Not implemented
 */
export async function depositToLendingPool(
  provider: AnchorProvider,
  poolAuthority: PublicKey,
  userTokenAccount: PublicKey,
  poolVault: PublicKey,
  amount: number
): Promise<string> {
  throw new Error('Lending pool deposits not yet implemented')
}

/**
 * Withdraw tokens from lending pool
 * DEMO MODE: Not implemented
 */
export async function withdrawFromLendingPool(
  provider: AnchorProvider,
  poolAuthority: PublicKey,
  userTokenAccount: PublicKey,
  poolVault: PublicKey,
  amount: number
): Promise<string> {
  throw new Error('Lending pool withdrawals not yet implemented')
}

/**
 * Claim accrued interest from lending pool
 * DEMO MODE: Not implemented
 */
export async function claimInterest(
  provider: AnchorProvider,
  poolAuthority: PublicKey,
  userTokenAccount: PublicKey,
  poolVault: PublicKey
): Promise<string> {
  throw new Error('Interest claims not yet implemented')
}
