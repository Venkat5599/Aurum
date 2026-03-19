/**
 * YieldDisplay Component
 * Shows real-time lending pool statistics and user position
 */

'use client'

import { useLendingPool } from '@/lib/hooks/useLendingPool'
import { PublicKey } from '@solana/web3.js'
import { useEffect, useState } from 'react'

interface YieldDisplayProps {
  poolAuthority?: string
}

export function YieldDisplay({ poolAuthority }: YieldDisplayProps) {
  const [authority, setAuthority] = useState<PublicKey | null>(null)

  useEffect(() => {
    // Load pool authority from config
    const loadConfig = async () => {
      try {
        const response = await fetch('/.aurum-config.json')
        const config = await response.json()
        if (config.lendingPool?.authority) {
          setAuthority(new PublicKey(config.lendingPool.authority))
        } else if (poolAuthority) {
          setAuthority(new PublicKey(poolAuthority))
        }
      } catch (error) {
        console.error('Error loading pool authority:', error)
        if (poolAuthority) {
          setAuthority(new PublicKey(poolAuthority))
        }
      }
    }

    loadConfig()
  }, [poolAuthority])

  const { poolData, userPosition, currentAccruedInterest, totalBalance, loading, error } =
    useLendingPool(authority)

  if (loading && !poolData) {
    return (
      <div className="bg-card border border-border/40 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-8 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-card border border-border/40 rounded-lg p-6">
        <p className="text-sm text-destructive">Error loading yield data: {error}</p>
      </div>
    )
  }

  if (!poolData) {
    return (
      <div className="bg-card border border-border/40 rounded-lg p-6">
        <p className="text-sm text-muted-foreground">Lending pool not initialized</p>
      </div>
    )
  }

  const formatAmount = (amount: number) => {
    return (amount / 1_000_000).toFixed(2)
  }

  const formatApy = (apy: number) => {
    return (apy / 100).toFixed(2)
  }

  return (
    <div className="space-y-4">
      {/* Pool Statistics */}
      <div className="bg-card border border-border/40 rounded-lg p-6">
        <h3 className="text-lg font-medium text-foreground mb-4">Lending Pool Statistics</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Current APY</p>
            <p className="text-2xl font-bold text-[#FFD700]">{formatApy(poolData.currentApy)}%</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Base APY</p>
            <p className="text-2xl font-bold text-foreground">{formatApy(poolData.baseApy)}%</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Deposits</p>
            <p className="text-2xl font-bold text-foreground">
              {formatAmount(poolData.totalDeposits)} auUSD
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Utilization</p>
            <p className="text-2xl font-bold text-foreground">
              {formatApy(poolData.utilizationRate)}%
            </p>
          </div>
        </div>
      </div>

      {/* User Position */}
      {userPosition && (
        <div className="bg-card border border-border/40 rounded-lg p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">Your Position</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Deposited</p>
              <p className="text-2xl font-bold text-foreground">
                {formatAmount(userPosition.depositedAmount)} auUSD
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Accrued Interest</p>
              <p className="text-2xl font-bold text-green-500">
                +{formatAmount(userPosition.accruedInterest + currentAccruedInterest)} auUSD
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
              <p className="text-2xl font-bold text-[#FFD700]">
                {formatAmount(totalBalance)} auUSD
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border/40">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Deposited: {new Date(userPosition.depositTimestamp * 1000).toLocaleDateString()}
              </span>
              <span className="text-muted-foreground">
                Last Claim: {new Date(userPosition.lastClaimTimestamp * 1000).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Info Message */}
      {!userPosition && (
        <div className="bg-card border border-border/40 rounded-lg p-6">
          <p className="text-sm text-muted-foreground text-center">
            Connect your wallet and deposit funds to start earning yield
          </p>
        </div>
      )}
    </div>
  )
}
