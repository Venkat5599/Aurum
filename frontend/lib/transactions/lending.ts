/**
 * Lending Pool Transaction Functions
 * Handles deposits, withdrawals, and interest claims
 */

import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import lendingPoolIdl from '../../../target/idl/lending_pool.json'

const LENDING_POOL_PROGRAM_ID = new PublicKey('LendP001XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')

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
 */
export async function fetchLendingPool(
  provider: AnchorProvider,
  poolAuthority: PublicKey
): Promise<LendingPoolData | null> {
  try {
    const program = new Program(lendingPoolIdl as any, LENDING_POOL_PROGRAM_ID, provider)
    const [poolPDA] = getLendingPoolPDA(poolAuthority)

    const poolAccount = await program.account.pool.fetch(poolPDA)

    return {
      authority: poolAccount.authority,
      tokenMint: poolAccount.tokenMint,
      poolVault: poolAccount.poolVault,
      totalDeposits: poolAccount.totalDeposits.toNumber(),
      totalBorrowed: poolAccount.totalBorrowed.toNumber(),
      baseApy: poolAccount.baseApy,
      utilizationRate: poolAccount.utilizationRate,
      currentApy: poolAccount.currentApy,
      lastUpdate: poolAccount.lastUpdate.toNumber(),
    }
  } catch (error) {
    console.error('Error fetching lending pool:', error)
    return null
  }
}

/**
 * Fetch user position data
 */
export async function fetchUserPosition(
  provider: AnchorProvider,
  poolAddress: PublicKey,
  userAddress: PublicKey
): Promise<UserPositionData | null> {
  try {
    const program = new Program(lendingPoolIdl as any, LENDING_POOL_PROGRAM_ID, provider)
    const [positionPDA] = getUserPositionPDA(poolAddress, userAddress)

    const positionAccount = await program.account.userPosition.fetch(positionPDA)

    return {
      user: positionAccount.user,
      pool: positionAccount.pool,
      depositedAmount: positionAccount.depositedAmount.toNumber(),
      accruedInterest: positionAccount.accruedInterest.toNumber(),
      depositTimestamp: positionAccount.depositTimestamp.toNumber(),
      lastClaimTimestamp: positionAccount.lastClaimTimestamp.toNumber(),
    }
  } catch (error) {
    console.error('Error fetching user position:', error)
    return null
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
 */
export async function depositToLendingPool(
  provider: AnchorProvider,
  poolAuthority: PublicKey,
  userTokenAccount: PublicKey,
  poolVault: PublicKey,
  amount: number
): Promise<string> {
  const program = new Program(lendingPoolIdl as any, LENDING_POOL_PROGRAM_ID, provider)
  const [poolPDA] = getLendingPoolPDA(poolAuthority)
  const [userPositionPDA] = getUserPositionPDA(poolPDA, provider.wallet.publicKey)

  const tx = await program.methods
    .deposit(amount)
    .accounts({
      pool: poolPDA,
      userPosition: userPositionPDA,
      user: provider.wallet.publicKey,
      userTokenAccount: userTokenAccount,
      poolVault: poolVault,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return tx
}

/**
 * Withdraw tokens from lending pool
 */
export async function withdrawFromLendingPool(
  provider: AnchorProvider,
  poolAuthority: PublicKey,
  userTokenAccount: PublicKey,
  poolVault: PublicKey,
  amount: number
): Promise<string> {
  const program = new Program(lendingPoolIdl as any, LENDING_POOL_PROGRAM_ID, provider)
  const [poolPDA] = getLendingPoolPDA(poolAuthority)
  const [userPositionPDA] = getUserPositionPDA(poolPDA, provider.wallet.publicKey)

  const tx = await program.methods
    .withdraw(amount)
    .accounts({
      pool: poolPDA,
      userPosition: userPositionPDA,
      user: provider.wallet.publicKey,
      userTokenAccount: userTokenAccount,
      poolVault: poolVault,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc()

  return tx
}

/**
 * Claim accrued interest from lending pool
 */
export async function claimInterest(
  provider: AnchorProvider,
  poolAuthority: PublicKey,
  userTokenAccount: PublicKey,
  poolVault: PublicKey
): Promise<string> {
  const program = new Program(lendingPoolIdl as any, LENDING_POOL_PROGRAM_ID, provider)
  const [poolPDA] = getLendingPoolPDA(poolAuthority)
  const [userPositionPDA] = getUserPositionPDA(poolPDA, provider.wallet.publicKey)

  const tx = await program.methods
    .claimInterest()
    .accounts({
      pool: poolPDA,
      userPosition: userPositionPDA,
      user: provider.wallet.publicKey,
      userTokenAccount: userTokenAccount,
      poolVault: poolVault,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc()

  return tx
}
