'use client'

import { AlertTriangle, TrendingUp, Shield } from 'lucide-react'

interface CollateralHealthMeterProps {
  currentRatio: number
  targetRatio: number
  totalCollateralValue: number
  goldValue: number
  silverValue: number
  isLoading?: boolean
}

export function CollateralHealthMeter({
  currentRatio,
  targetRatio,
  totalCollateralValue,
  goldValue,
  silverValue,
  isLoading,
}: CollateralHealthMeterProps) {
  const WARNING_THRESHOLD = 115
  const isHealthy = currentRatio >= targetRatio
  const isWarning = currentRatio < WARNING_THRESHOLD && currentRatio >= targetRatio
  
  const getHealthColor = () => {
    if (currentRatio < targetRatio) return { color: 'text-red-400', bg: 'bg-red-400/20', border: 'border-red-400/30' }
    if (currentRatio < WARNING_THRESHOLD) return { color: 'text-yellow-400', bg: 'bg-yellow-400/20', border: 'border-yellow-400/30' }
    return { color: 'text-green-400', bg: 'bg-green-400/20', border: 'border-green-400/30' }
  }

  const colors = getHealthColor()
  const percentage = Math.min((currentRatio / (targetRatio * 1.5)) * 100, 100)
  const goldPercentage = totalCollateralValue > 0 ? (goldValue / totalCollateralValue) * 100 : 0
  const silverPercentage = totalCollateralValue > 0 ? (silverValue / totalCollateralValue) * 100 : 0

  return (
    <div className="glass-strong rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Collateral Health</h3>
          <p className="text-sm text-muted-foreground">Over-collateralization ratio</p>
        </div>
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          {isHealthy ? (
            <Shield className={`h-5 w-5 ${colors.color}`} />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-400" />
          )}
        </div>
      </div>

      {/* Warning Alert */}
      {!isHealthy && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3 animate-fadeIn">
          <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400 mb-1">Under-Collateralized</p>
            <p className="text-xs text-red-300/80">
              Collateral ratio is below the minimum threshold. Add more collateral to maintain system health.
            </p>
          </div>
        </div>
      )}

      {isWarning && isHealthy && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3 animate-fadeIn">
          <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-400 mb-1">Low Collateral Buffer</p>
            <p className="text-xs text-yellow-300/80">
              Collateral ratio is close to the minimum. Consider adding more collateral for safety.
            </p>
          </div>
        </div>
      )}

      {/* Ratio Gauge */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Current Ratio</span>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${colors.color}`}>
              {isLoading ? '...' : `${currentRatio.toFixed(1)}%`}
            </span>
            <span className="text-sm text-muted-foreground">/ {targetRatio}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.bg} ${colors.border} border-r-2 transition-all duration-1000`}
            style={{ width: `${percentage}%` }}
          />
          {/* Target marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary"
            style={{ left: `${(targetRatio / (targetRatio * 1.5)) * 100}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full" />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span className="text-primary">Target: {targetRatio}%</span>
          <span>{targetRatio * 1.5}%</span>
        </div>
      </div>

      {/* Total Collateral Value */}
      <div className={`${colors.bg} border ${colors.border} rounded-lg p-4`}>
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className={`h-4 w-4 ${colors.color}`} />
          <span className="text-xs text-muted-foreground">Total Collateral Value</span>
        </div>
        <p className={`text-2xl font-bold ${colors.color}`}>
          {isLoading ? '...' : `$${(totalCollateralValue / 1000).toFixed(1)}K`}
        </p>
      </div>

      {/* Collateral Breakdown */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Collateral Breakdown</p>
        
        {/* Gold */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600" />
              <span className="text-xs text-muted-foreground">Tokenized Gold</span>
            </div>
            <span className="text-xs text-foreground font-medium">
              {isLoading ? '...' : `${goldPercentage.toFixed(1)}%`}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-amber-600 transition-all duration-1000"
              style={{ width: `${goldPercentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isLoading ? '...' : `$${(goldValue / 1000).toFixed(1)}K`}
          </p>
        </div>

        {/* Silver */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-gray-300 to-gray-500" />
              <span className="text-xs text-muted-foreground">Tokenized Silver</span>
            </div>
            <span className="text-xs text-foreground font-medium">
              {isLoading ? '...' : `${silverPercentage.toFixed(1)}%`}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gray-300 to-gray-500 transition-all duration-1000"
              style={{ width: `${silverPercentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isLoading ? '...' : `$${(silverValue / 1000).toFixed(1)}K`}
          </p>
        </div>
      </div>
    </div>
  )
}
