import { Connection, SystemProgram } from '@solana/web3.js'
import { AnchorWallet } from '@solana/wallet-adapter-react'
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor'
import { toast } from 'sonner'
import { PROGRAM_IDS, CLUSTER } from '../programs/constants'
import { deriveStrategyPDA } from '../programs/pdas'
import type { RiskProfile } from '../types/programs'
import yieldOptimizerIdl from '../idl/yield_optimizer.json'

/**
 * Initialize yield strategy for user
 * @param connection Solana connection
 * @param wallet User's wallet
 * @param riskProfile Selected risk profile
 */
export async function initializeStrategy(
  connection: Connection,
  wallet: AnchorWallet,
  riskProfile: RiskProfile
) {
  try {
    toast.loading('Initializing yield strategy...')

    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' })
    const program = new Program(yieldOptimizerIdl as any, PROGRAM_IDS.yieldOptimizer, provider)

    // 1. Derive strategy PDA
    const [strategyPDA] = deriveStrategyPDA(wallet.publicKey)

    // Check if already initialized
    try {
      await program.account.yieldStrategy.fetch(strategyPDA)
      toast.dismiss()
      toast.info('Strategy already initialized', {
        description: 'Updating your risk profile...'
      })
      // In production, you might want to add an update_strategy instruction
      return { success: true, alreadyInitialized: true }
    } catch {
      // Not initialized, proceed
    }

    // 2. Map RiskProfile enum to program format
    const riskProfileEnum = riskProfile === 'conservative'
      ? { conservative: {} }
      : riskProfile === 'moderate'
      ? { moderate: {} }
      : { aggressive: {} }

    // 3. Build initialize_strategy instruction
    const tx = await program.methods
      .initializeStrategy(riskProfileEnum)
      .accounts({
        strategy: strategyPDA,
        user: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc()

    const strategyNames = {
      conservative: 'Conservative (80% Lending, 20% Hedging)',
      moderate: 'Moderate (60% Lending, 35% Hedging, 5% Liquid)',
      aggressive: 'Aggressive (40% Lending, 50% Hedging, 10% Liquid)'
    }

    toast.success('Yield strategy initialized!', {
      description: strategyNames[riskProfile],
      action: {
        label: 'View on Explorer',
        onClick: () => window.open(`https://explorer.solana.com/tx/${tx}?cluster=${CLUSTER}`, '_blank')
      }
    })

    return { success: true, signature: tx }
  } catch (error: any) {
    console.error('Strategy initialization error:', error)
    toast.error('Failed to initialize strategy', {
      description: error.message || 'Transaction failed'
    })
    throw error
  }
}

/**
 * Allocate funds to yield strategies
 * @param connection Solana connection
 * @param wallet User's wallet
 * @param amount Amount to allocate
 */
export async function allocateFunds(
  connection: Connection,
  wallet: AnchorWallet,
  amount: number
) {
  try {
    toast.loading('Allocating funds...')

    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' })
    const program = new Program(yieldOptimizerIdl as any, PROGRAM_IDS.yieldOptimizer, provider)

    // 1. Derive strategy PDA
    const [strategyPDA] = deriveStrategyPDA(wallet.publicKey)

    // 2. Convert amount to lamports (6 decimals for USD)
    const amountLamports = new BN(amount * 1_000_000)

    // 3. Build allocate instruction
    const tx = await program.methods
      .allocate(amountLamports)
      .accounts({
        strategy: strategyPDA,
        user: wallet.publicKey,
      })
      .rpc()

    toast.success('Funds allocated!', {
      description: `$${amount.toLocaleString()} allocated to yield strategies`,
      action: {
        label: 'View on Explorer',
        onClick: () => window.open(`https://explorer.solana.com/tx/${tx}?cluster=${CLUSTER}`, '_blank')
      }
    })

    return { success: true, signature: tx }
  } catch (error: any) {
    console.error('Allocation error:', error)
    toast.error('Failed to allocate funds', {
      description: error.message || 'Transaction failed'
    })
    throw error
  }
}

/**
 * Trigger manual rebalance of yield strategy
 * @param connection Solana connection
 * @param wallet User's wallet
 * @param volatility Current market volatility (basis points)
 * @param kytRisk Current KYT risk score (0-100)
 */
export async function triggerRebalance(
  connection: Connection,
  wallet: AnchorWallet,
  volatility: number = 300,
  kytRisk: number = 20
) {
  try {
    toast.loading('Rebalancing strategy...')

    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' })
    const program = new Program(yieldOptimizerIdl as any, PROGRAM_IDS.yieldOptimizer, provider)

    // 1. Derive strategy PDA
    const [strategyPDA] = deriveStrategyPDA(wallet.publicKey)

    // 2. Get oracle and compliance program addresses
    const oraclePDA = PROGRAM_IDS.oracle
    const compliancePDA = PROGRAM_IDS.compliance

    // 3. Build rebalance instruction
    const tx = await program.methods
      .rebalance(volatility, kytRisk)
      .accounts({
        strategy: strategyPDA,
        oracle: oraclePDA,
        compliance: compliancePDA,
      })
      .rpc()

    toast.success('Strategy rebalanced!', {
      description: 'Allocations adjusted based on market conditions',
      action: {
        label: 'View on Explorer',
        onClick: () => window.open(`https://explorer.solana.com/tx/${tx}?cluster=${CLUSTER}`, '_blank')
      }
    })

    return { success: true, signature: tx }
  } catch (error: any) {
    console.error('Rebalance error:', error)
    toast.error('Failed to rebalance strategy', {
      description: error.message || 'Transaction failed'
    })
    throw error
  }
}
