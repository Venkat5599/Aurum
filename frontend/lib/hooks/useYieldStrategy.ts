'use client'

import { useQuery } from '@tanstack/react-query'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Program } from '@coral-xyz/anchor'
import { YieldData, YieldStrategy, RiskProfile } from '../types/programs'
import { deriveStrategyPDA } from '../programs/pdas'
import { PROGRAM_IDS } from '../programs/constants'
import yieldOptimizerIdl from '../idl/yield_optimizer.json'

export function useYieldStrategy() {
  const { connection } = useConnection()
  const { publicKey, wallet } = useWallet()

  return useQuery({
    queryKey: ['yieldStrategy', publicKey?.toString()],
    queryFn: async (): Promise<YieldData | null> => {
      if (!publicKey || !wallet) return null

      try {
        const program = new Program(yieldOptimizerIdl as any, PROGRAM_IDS.yieldOptimizer)
        const [strategyPDA] = deriveStrategyPDA(publicKey)

        const accountInfo = await connection.getAccountInfo(strategyPDA)
        if (!accountInfo) {
          // Strategy not initialized yet
          return {
            riskProfile: RiskProfile.Conservative,
            totalAllocated: 0,
            lendingPct: 0,
            hedgingPct: 0,
            liquidPct: 0,
            currentApy: 0,
            lastRebalance: 0,
            hoursSinceRebalance: 0,
          }
        }

        const strategy = await program.account.yieldStrategy.fetch(strategyPDA) as unknown as YieldStrategy

        const totalAllocated = strategy.totalAllocated.toNumber() / 1_000_000 // Convert from lamports
        const lendingAllocation = strategy.lendingAllocation.toNumber() / 1_000_000
        const hedgingAllocation = strategy.hedgingAllocation.toNumber() / 1_000_000
        const liquidAllocation = strategy.liquidAllocation.toNumber() / 1_000_000

        const lendingPct = totalAllocated > 0 ? (lendingAllocation / totalAllocated) * 100 : strategy.targetLendingPct
        const hedgingPct = totalAllocated > 0 ? (hedgingAllocation / totalAllocated) * 100 : strategy.targetHedgingPct
        const liquidPct = totalAllocated > 0 ? (liquidAllocation / totalAllocated) * 100 : strategy.targetLiquidPct

        // Convert APY from basis points (e.g., 720 = 7.20%)
        const currentApy = strategy.currentApy / 100

        const lastRebalance = strategy.lastRebalance.toNumber()
        const currentTime = Date.now() / 1000
        const hoursSinceRebalance = (currentTime - lastRebalance) / 3600

        // Map enum variant to RiskProfile
        const riskProfileKey = Object.keys(strategy.riskProfile)[0] as keyof typeof RiskProfile
        const riskProfile = RiskProfile[riskProfileKey]

        return {
          riskProfile,
          totalAllocated,
          lendingPct,
          hedgingPct,
          liquidPct,
          currentApy,
          lastRebalance,
          hoursSinceRebalance,
        }
      } catch (error) {
        console.error('Error fetching yield strategy:', error)
        return null
      }
    },
    enabled: !!publicKey && !!wallet,
    refetchInterval: 15000, // Refetch every 15 seconds
    staleTime: 12000,
  })
}
