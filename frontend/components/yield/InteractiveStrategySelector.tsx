'use client'

import { TrendingUp, Shield, Zap, Clock } from 'lucide-react'
import { RiskProfile } from '@/lib/types/programs'

interface InteractiveStrategySelectorProps {
  currentStrategy?: RiskProfile
  onSelect: (profile: RiskProfile) => void
  isLoading?: boolean
}

const strategies = [
  {
    profile: RiskProfile.Conservative,
    name: 'Conservative',
    icon: Shield,
    color: 'text-green-400',
    bg: 'bg-green-400/10',
    border: 'border-green-400/30',
    apy: '7-9%',
    lending: 80,
    hedging: 15,
    liquid: 5,
    description: 'Prioritizes capital preservation with stable lending protocols',
  },
  {
    profile: RiskProfile.Moderate,
    name: 'Moderate',
    icon: TrendingUp,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/30',
    apy: '10-12%',
    lending: 60,
    hedging: 25,
    liquid: 15,
    description: 'Balanced approach with diversified yield strategies',
  },
  {
    profile: RiskProfile.Aggressive,
    name: 'Aggressive',
    icon: Zap,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/30',
    apy: '13-15%',
    lending: 40,
    hedging: 40,
    liquid: 20,
    description: 'Maximizes returns through active hedging strategies',
  },
]

export function InteractiveStrategySelector({ currentStrategy, onSelect, isLoading }: InteractiveStrategySelectorProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h3 className="text-xl font-medium text-foreground mb-2">Choose Your Yield Strategy</h3>
        <p className="text-muted-foreground">Select a risk profile to optimize your auUSD returns</p>
      </div>

      <div className="grid gap-4">
        {strategies.map((strategy) => {
          const Icon = strategy.icon
          const isSelected = currentStrategy === strategy.profile
          
          return (
            <button
              key={strategy.profile}
              onClick={() => onSelect(strategy.profile)}
              disabled={isLoading}
              className={`w-full text-left p-6 rounded-xl border-2 transition-all ${
                isSelected
                  ? `${strategy.border} ${strategy.bg} border-opacity-100`
                  : 'border-border/40 glass hover:border-border/60'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer card-hover'}`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${strategy.bg} ${isSelected ? 'glow' : ''}`}>
                  <Icon className={`h-6 w-6 ${strategy.color}`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`text-lg font-semibold ${isSelected ? strategy.color : 'text-foreground'}`}>
                      {strategy.name}
                    </h4>
                    <div className={`px-3 py-1 rounded-lg ${strategy.bg} border ${strategy.border}`}>
                      <span className={`text-sm font-medium ${strategy.color}`}>
                        {strategy.apy} APY
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4">
                    {strategy.description}
                  </p>

                  {/* Allocation Breakdown */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Lending Protocols</span>
                      <span className="text-foreground font-medium">{strategy.lending}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${strategy.bg} ${strategy.border} border-r`}
                        style={{ width: `${strategy.lending}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Hedging Strategies</span>
                      <span className="text-foreground font-medium">{strategy.hedging}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${strategy.bg} ${strategy.border} border-r`}
                        style={{ width: `${strategy.hedging}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Liquid Reserves</span>
                      <span className="text-foreground font-medium">{strategy.liquid}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${strategy.bg} ${strategy.border} border-r`}
                        style={{ width: `${strategy.liquid}%` }}
                      />
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span>Active Strategy</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Rebalancing Info */}
      <div className="glass rounded-xl p-4 flex items-start gap-3">
        <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground mb-1">Automatic Rebalancing</p>
          <p className="text-xs text-muted-foreground">
            Your strategy automatically rebalances based on market volatility, oracle data, and KYT risk scores. 
            Rebalancing occurs every 24 hours or when conditions change significantly.
          </p>
        </div>
      </div>
    </div>
  )
}
