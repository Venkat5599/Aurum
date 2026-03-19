'use client'

import { AlertTriangle, Activity, Clock } from 'lucide-react'

interface RiskScoreGaugeProps {
  riskScore: number
  txCount24h: number
  lastCheck: number
  isLoading?: boolean
}

export function RiskScoreGauge({ riskScore, txCount24h, lastCheck, isLoading }: RiskScoreGaugeProps) {
  const getRiskColor = (score: number) => {
    if (score < 30) return { color: 'text-green-400', bg: 'bg-green-400/20', border: 'border-green-400/30' }
    if (score < 60) return { color: 'text-yellow-400', bg: 'bg-yellow-400/20', border: 'border-yellow-400/30' }
    return { color: 'text-red-400', bg: 'bg-red-400/20', border: 'border-red-400/30' }
  }

  const getRiskLevel = (score: number) => {
    if (score < 30) return 'Low Risk'
    if (score < 60) return 'Medium Risk'
    return 'High Risk'
  }

  const colors = getRiskColor(riskScore)
  const riskLevel = getRiskLevel(riskScore)
  const percentage = Math.min(riskScore, 100)
  const circumference = 2 * Math.PI * 70
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const timeSinceCheck = lastCheck > 0 ? Math.floor((Date.now() / 1000 - lastCheck) / 60) : 0

  return (
    <div className="glass-strong rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Live KYT Risk Score</h3>
          <p className="text-sm text-muted-foreground">Real-time transaction monitoring</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-xs text-foreground font-medium">Live</span>
        </div>
      </div>

      {/* High Risk Alert */}
      {riskScore >= 60 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3 animate-fadeIn">
          <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400 mb-1">High Risk Alert</p>
            <p className="text-xs text-red-300/80">
              Elevated transaction velocity detected. Additional verification may be required.
            </p>
          </div>
        </div>
      )}

      {/* Circular Gauge */}
      <div className="flex items-center justify-center">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="96"
              cy="96"
              r="70"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-muted/20"
            />
            {/* Progress circle */}
            <circle
              cx="96"
              cy="96"
              r="70"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`${colors.color} transition-all duration-1000 ease-out`}
              strokeLinecap="round"
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isLoading ? (
              <div className="text-2xl text-muted-foreground">...</div>
            ) : (
              <>
                <div className={`text-5xl font-bold ${colors.color} mb-1`}>
                  {riskScore}
                </div>
                <div className="text-xs text-muted-foreground">/ 100</div>
                <div className={`text-sm font-medium ${colors.color} mt-2`}>
                  {riskLevel}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`${colors.bg} border ${colors.border} rounded-lg p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <Activity className={`h-4 w-4 ${colors.color}`} />
            <span className="text-xs text-muted-foreground">24h Transactions</span>
          </div>
          <p className={`text-2xl font-bold ${colors.color}`}>
            {isLoading ? '...' : txCount24h}
          </p>
        </div>

        <div className={`${colors.bg} border ${colors.border} rounded-lg p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <Clock className={`h-4 w-4 ${colors.color}`} />
            <span className="text-xs text-muted-foreground">Last Check</span>
          </div>
          <p className={`text-2xl font-bold ${colors.color}`}>
            {isLoading ? '...' : timeSinceCheck < 1 ? 'Now' : `${timeSinceCheck}m`}
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
        <p className="text-xs text-foreground/80">
          <strong>How it works:</strong> Our KYT system analyzes transaction patterns in real-time, 
          assigning risk scores based on velocity, amount, and counterparty analysis. Scores update 
          every 5 seconds.
        </p>
      </div>
    </div>
  )
}
