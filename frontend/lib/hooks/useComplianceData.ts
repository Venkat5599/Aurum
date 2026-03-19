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
        const provider = new AnchorProvider(connection, wallet as any, { commitment: 'confirmed' })
        const program = new Program(complianceIdl as any, provider)
        const [userStatePDA] = deriveUserStatePDA(publicKey)

        const accountInfo = await connection.getAccountInfo(userStatePDA)
        if (!accountInfo) {
          // User state not initialized yet
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

        const userState = await program.account.userState.fetch(userStatePDA) as unknown as UserState

        const riskScore = userState.riskScore
        const riskLevel = 
          riskScore < RISK_SCORE_LOW ? 'low' :
          riskScore < RISK_SCORE_MEDIUM ? 'medium' : 'high'

        return {
          kycVerified: userState.kycVerified,
          kycExpiry: userState.kycExpiry.toNumber(),
          isFrozen: userState.isFrozen,
          riskScore,
          txCount24h: userState.txCount24h,
          lastTxTimestamp: userState.lastTxTimestamp.toNumber(),
          riskLevel,
        }
      } catch (error) {
        console.error('Error fetching compliance data:', error)
        return null
      }
    },
    enabled: !!publicKey && !!wallet,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    staleTime: 3000,
  })
}
