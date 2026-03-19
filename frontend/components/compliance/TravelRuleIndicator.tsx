'use client'

import { CheckCircle2, Loader2, Shield } from 'lucide-react'
import { useState, useEffect } from 'react'

interface TravelRuleIndicatorProps {
  amount: number // Amount in lamports (6 decimals)
}

export function TravelRuleIndicator({ amount }: TravelRuleIndicatorProps) {
  const [isGenerating, setIsGenerating] = useState(true)
  const TRAVEL_RULE_THRESHOLD = 3_000_000_000 // $3,000 in micro-lamports

  useEffect(() => {
    // Simulate payload generation
    const timer = setTimeout(() => {
      setIsGenerating(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [amount])

  if (amount < TRAVEL_RULE_THRESHOLD) {
    return null
  }

  const amountUsd = amount / 1_000_000

  return (
    <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 space-y-3 animate-fadeIn">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/20 rounded-lg">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-foreground">Travel Rule Compliance</h4>
            {isGenerating ? (
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-400" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Transaction amount: <span className="text-foreground font-medium">${amountUsd.toLocaleString()}</span>
          </p>
          
          {isGenerating ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
              <span className="text-xs text-muted-foreground">Generating encrypted payload...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-green-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Encrypted payload generated</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Compliance data will be automatically attached to this transaction via SPL Token-2022 transfer hooks.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-background/50 rounded-lg p-3 space-y-1.5">
        <p className="text-xs font-medium text-foreground">What is the Travel Rule?</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The Travel Rule requires financial institutions to share sender and recipient information 
          for transactions over $3,000. Our protocol automatically generates encrypted compliance 
          payloads without exposing personal data on-chain.
        </p>
      </div>
    </div>
  )
}
