/**
 * React hook for fetching lending pool data
 */

import { useEffect, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { AnchorProvider } from '@coral-xyz/anchor'
import {
  fetchLendingPool,
  fetchUserPosition,
  calculateAccruedInterest,
  LendingPoolData,
  UserPositionData,
} from '../transactions/lending'

export function useLendingPool(poolAuthority: PublicKey | null) {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [poolData, setPoolData] = useState<LendingPoolData | null>(null)
  const [userPosition, setUserPosition] = useState<UserPositionData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!poolAuthority) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Create provider
        const provider = new AnchorProvider(
          connection,
          wallet as any,
          { commitment: 'confirmed' }
        )

        // Fetch pool data
        const pool = await fetchLendingPool(provider, poolAuthority)
        setPoolData(pool)

        // Fetch user position if wallet connected
        if (wallet.publicKey && pool) {
          const [poolPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('pool'), poolAuthority.toBuffer()],
            new PublicKey('LendP001XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
          )

          const position = await fetchUserPosition(provider, poolPDA, wallet.publicKey)
          setUserPosition(position)
        }
      } catch (err: any) {
        console.error('Error fetching lending pool data:', err)
        setError(err.message || 'Failed to fetch lending pool data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [poolAuthority, wallet.publicKey, connection])

  // Calculate current accrued interest
  const currentAccruedInterest = userPosition && poolData
    ? calculateAccruedInterest(
        userPosition.depositedAmount,
        userPosition.lastClaimTimestamp,
        poolData.currentApy
      )
    : 0

  const totalBalance = userPosition
    ? userPosition.depositedAmount + userPosition.accruedInterest + currentAccruedInterest
    : 0

  return {
    poolData,
    userPosition,
    currentAccruedInterest,
    totalBalance,
    loading,
    error,
  }
}
