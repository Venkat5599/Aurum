'use client'

import { TrendingUp, TrendingDown, AlertTriangle, Clock, Activity } from 'lucide-react'
import { OraclePrices } from '@/lib/types/programs'

interface PriceTickerWithAlertsProps {
  prices: OraclePrices | null
  isLoading?: boolean
}

export function PriceTickerWithAlerts({ prices, isLoading }: PriceTickerWithAlertsProps) {
  const HIGH_VOLATILITY_THRESHOLD = 5 // 5% change

  const isHighVolatility = prices && (
    Math.abs(prices.goldChange24h) > HIGH_VOLATILITY_THRESHOLD ||
    Math.abs(prices.silverChange24h) > HIGH_VOLATILITY_THRESHOLD
  )

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now() / 1000
    const diff = now - timestamp
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
  }

  return (
    <div className="glass-strong rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Live Oracle Prices</h3>
          <p className="text-sm text-muted-foreground">SIX precious metals data</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-xs text-foreground font-medium">Live</span>
        </div>
      </div>

      {/* Staleness Alert */}
      {prices?.isStale && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3 animate-fadeIn">
          <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400 mb-1">Stale Oracle Data</p>
            <p className="text-xs text-red-300/80">
              Price data is more than 5 minutes old. Transactions are disabled until oracle updates.
            </p>
          </div>
        </div>
      )}

      {/* High Volatility Alert */}
      {isHighVolatility && !prices?.isStale && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3 animate-fadeIn">
          <Activity className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-400 mb-1">High Volatility Detected</p>
            <p className="text-xs text-yellow-300/80">
              Significant price movement in the last 24 hours. Exercise caution with large transactions.
            </p>
          </div>
        </div>
      )}

      {/* Price Cards */}
      <div className="space-y-3">
        {/* Gold Price */}
        <div className="glass rounded-xl p-4 card-hover">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center">
                <span className="text-lg font-bold text-white">Au</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Gold (XAU)</p>
                <p className="text-xs text-muted-foreground">Per troy ounce</p>
              </div>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
              (prices?.goldChange24h || 0) >= 0 ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'
            }`}>
              {(prices?.goldChange24h || 0) >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              <span className="text-xs font-medium">
                {isLoading ? '...' : `${Math.abs(prices?.goldChange24h || 0).toFixed(1)}%`}
              </span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold gradient-text">
              {isLoading ? '...' : `$${prices?.goldPrice.toFixed(2)}`}
            </span>
            <span className="text-sm text-muted-foreground">USD</span>
          </div>
        </div>

        {/* Silver Price */}
        <div className="glass rounded-xl p-4 card-hover">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center">
                <span className="text-lg font-bold text-white">Ag</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Silver (XAG)</p>
                <p className="text-xs text-muted-foreground">Per troy ounce</p>
              </div>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
              (prices?.silverChange24h || 0) >= 0 ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'
            }`}>
              {(prices?.silverChange24h || 0) >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              <span className="text-xs font-medium">
                {isLoading ? '...' : `${Math.abs(prices?.silverChange24h || 0).toFixed(1)}%`}
              </span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold gradient-text">
              {isLoading ? '...' : `$${prices?.silverPrice.toFixed(2)}`}
            </span>
            <span className="text-sm text-muted-foreground">USD</span>
          </div>
        </div>
      </div>

      {/* Oracle Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">Last Update</span>
          </div>
          <p className="text-sm font-medium text-foreground">
            {isLoading ? '...' : formatTimestamp(prices?.lastUpdate || 0)}
          </p>
        </div>
        <div className="glass rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">Updates</span>
          </div>
          <p className="text-sm font-medium text-foreground">
            {isLoading ? '...' : prices?.updateCount.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}
