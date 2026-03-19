import { PublicKey } from '@solana/web3.js'
import { PROGRAM_IDS, SEEDS } from './constants'

/**
 * Derive PDA for user compliance state
 */
export function deriveUserStatePDA(wallet: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.userState), wallet.toBuffer()],
    PROGRAM_IDS.compliance
  )
}

/**
 * Derive PDA for user yield strategy
 */
export function deriveStrategyPDA(wallet: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.strategy), wallet.toBuffer()],
    PROGRAM_IDS.yieldOptimizer
  )
}

/**
 * Derive PDA for vault state
 */
export function deriveVaultPDA(authority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.vault), authority.toBuffer()],
    PROGRAM_IDS.vault
  )
}

/**
 * Derive PDA for oracle data
 */
export function deriveOraclePDA(authority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.oracle), authority.toBuffer()],
    PROGRAM_IDS.oracle
  )
}
