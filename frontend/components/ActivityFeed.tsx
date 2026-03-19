'use client'

import { generateTransactions, formatRelativeTime } from '@/lib/mockData'
import { ArrowUpRight, ArrowDownRight, TrendingUp, Send } from 'lucide-react'
import { useMemo } from 'react'

export function ActivityFeed() {
  const transactions = useMemo(() => generateTransactions(8), [])

  const getIcon = (type: string) => {
    switch (type) {
      case 'mint':
        return <ArrowUpRight className="h-4 w-4" />
      case 'redeem':
        return <ArrowDownRight className="h-4 w-4" />
      case 'yield':
        return <TrendingUp className="h-4 w-4" />
      case 'transfer':
        return <Send className="h-4 w-4" />
      default:
        return null
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'mint':
        return 'text-green-600 bg-green-50'
      case 'redeem':
        return 'text-orange-600 bg-orange-50'
      case 'yield':
        return 'text-blue-600 bg-blue-50'
      case 'transfer':
        return 'text-purple-600 bg-purple-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Completed</span>
      case 'pending':
        return <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">Pending</span>
      case 'failed':
        return <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Failed</span>
      default:
        return null
    }
  }

  return (
    <div className="bg-card border border-border/40 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-foreground mb-1">Recent Activity</h3>
        <p className="text-sm text-muted-foreground">Your latest transactions</p>
      </div>

      <div className="space-y-3">
        {transactions.map((tx, index) => (
          <div
            key={tx.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors animate-slideIn"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={`p-2 rounded-lg ${getTypeColor(tx.type)}`}>
              {getIcon(tx.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-foreground capitalize">{tx.type}</p>
                {getStatusBadge(tx.status)}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">${tx.amount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{formatRelativeTime(tx.timestamp)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
