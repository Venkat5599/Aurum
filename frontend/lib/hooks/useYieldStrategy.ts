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
        const [strategyPDA] = deriveStrategyPDA(publicKey)

        const accountInfo = await connection.getAccountInfo(strategyPDA)
        if (!accountInfo) {
          // Strategy not initialized yet - return default conservative strategy
          return {
            riskProfile: RiskProfile.Conservative,
            totalAllocated: 0,
            lendingPct: 60,
            hedgingPct: 30,
            liquidPct: 10,
            currentApy: 7.2,
            lastRebalance: Date.now() / 1000,
            hoursSinceRebalance: 0,
          }
        }

        // For demo, return mock data based on conservative strategy
        return {
          riskProfile: RiskProfile.Conservative,
          totalAllocated: 0,
          lendingPct: 60,
          hedgingPct: 30,
          liquidPct: 10,
          currentApy: 7.2,
          lastRebalance: Date.now() / 1000,
          hoursSinceRebalance: 0,
        }
      } catch (error) {
        console.error('Error fetching yield strategy:', error)
        return null
      }
    },
    enabled: !!publicKey && !!wallet,
    refetchInterval: 15000,
    staleTime: 12000,
  })
}
