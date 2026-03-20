'use client'

import { useQuery } from '@tanstack/react-query'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { Program, AnchorProvider } from '@coral-xyz/anchor'
import { ComplianceData, UserState } from '../types/programs'
import { deriveUserStatePDA } from '../programs/pdas'
import { PROGRAM_IDS, RISK_SCORE_LOW, RISK_SCORE_MEDIUM } from '../programs/constants'
import complianceIdl from '../idl/compliance.json'

export function useComplianceData() {
  const { connection } = useConnection()
  const { publicKey, wallet } = useWallet()

  return useQuery({
    queryKey: ['compliance', publicKey?.toString()],
    queryFn: async (): Promise<ComplianceData | null> => {
      if (!publicKey || !wallet) return null

      try {
        const [userStatePDA] = deriveUserStatePDA(publicKey)

        const accountInfo = await connection.getAccountInfo(userStatePDA)
        if (!accountInfo) {
          // User state not initialized yet - return default values
          return {
            kycVerified: false,
            kycExpiry: 0,
            isFrozen: false,
            riskScore: 0,
            txCount24h: 0,
            lastTxTimestamp: 0,
            riskLevel: 'low',
          }
        }

        // For demo purposes, return mock verified data if account exists
        return {
          kycVerified: true,
          kycExpiry: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year from now
          isFrozen: false,
          riskScore: 25,
          txCount24h: 0,
          lastTxTimestamp: Date.now(),
          riskLevel: 'low',
        }
      } catch (error) {
        console.error('Error fetching compliance data:', error)
        return null
      }
    },
    enabled: !!publicKey && !!wallet,
    refetchInterval: 5000,
    staleTime: 3000,
  })
}
