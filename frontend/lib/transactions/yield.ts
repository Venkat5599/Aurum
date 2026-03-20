import { Connection } from '@solana/web3.js'
import { AnchorWallet } from '@solana/wallet-adapter-react'
import { toast } from 'sonner'
import type { RiskProfile } from '../types/programs'

/**
 * Initialize yield strategy for user (Demo mode)
 */
export async function initializeStrategy(
  connection: Connection,
  wallet: AnchorWallet,
  riskProfile: RiskProfile
) {
  try {
    toast.loading('Initializing yield strategy...')

    // Demo mode - just show success
    await new Promise(resolve => setTimeout(resolve, 1000))

    toast.dismiss()
    toast.success('Strategy initialized!', {
      description: `Set to ${riskProfile} risk profile`
    })

    return { success: true, signature: 'demo' }
  } catch (error: any) {
    console.error('Initialize strategy error:', error)
    toast.dismiss()
    toast.error('Failed to initialize strategy', {
      description: error.message || 'Transaction failed'
    })
    throw error
  }
}

/**
 * Rebalance yield strategy (Demo mode)
 */
export async function rebalanceStrategy(
  connection: Connection,
  wallet: AnchorWallet
) {
  try {
    toast.loading('Rebalancing strategy...')

    await new Promise(resolve => setTimeout(resolve, 1000))

    toast.dismiss()
    toast.success('Strategy rebalanced!', {
      description: 'Allocations updated to target percentages'
    })

    return { success: true, signature: 'demo' }
  } catch (error: any) {
    console.error('Rebalance error:', error)
    toast.dismiss()
    toast.error('Rebalance failed', {
      description: error.message || 'Transaction failed'
    })
    throw error
  }
}

/**
 * Claim yield rewards (Demo mode)
 */
export async function claimYield(
  connection: Connection,
  wallet: AnchorWallet
) {
  try {
    toast.loading('Claiming yield...')

    await new Promise(resolve => setTimeout(resolve, 1000))

    toast.dismiss()
    toast.success('Yield claimed!', {
      description: 'Rewards transferred to your wallet'
    })

    return { success: true, signature: 'demo' }
  } catch (error: any) {
    console.error('Claim yield error:', error)
    toast.dismiss()
    toast.error('Claim failed', {
      description: error.message || 'Transaction failed'
    })
    throw error
  }
}
