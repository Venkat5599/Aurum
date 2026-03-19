// Mock data generators for dashboard demo

export interface YieldDataPoint {
  date: string
  yield: number
  apy: number
}

export interface Transaction {
  id: string
  type: 'mint' | 'redeem' | 'yield' | 'transfer'
  amount: number
  timestamp: Date
  status: 'completed' | 'pending' | 'failed'
}

export interface AllocationData {
  name: string
  value: number
  color: string
}

// Generate yield performance data for the last 30 days
export function generateYieldData(days: number = 30): YieldDataPoint[] {
  const data: YieldDataPoint[] = []
  const now = new Date()
  let cumulativeYield = 0

  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    // Simulate realistic yield growth (0.01% to 0.03% per day)
    const dailyYield = Math.random() * 0.02 + 0.01
    cumulativeYield += dailyYield

    // APY fluctuates between 6.5% and 8.5%
    const apy = 7.2 + (Math.random() - 0.5) * 1.5

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      yield: Number(cumulativeYield.toFixed(4)),
      apy: Number(apy.toFixed(2))
    })
  }

  return data
}

// Generate mock transactions
export function generateTransactions(count: number = 10): Transaction[] {
  const types: Transaction['type'][] = ['mint', 'redeem', 'yield', 'transfer']
  const statuses: Transaction['status'][] = ['completed', 'completed', 'completed', 'pending']

  return Array.from({ length: count }, (_, i) => {
    const hoursAgo = Math.floor(Math.random() * 48)
    const timestamp = new Date()
    timestamp.setHours(timestamp.getHours() - hoursAgo)

    return {
      id: `tx-${i + 1}`,
      type: types[Math.floor(Math.random() * types.length)],
      amount: Number((Math.random() * 1000 + 100).toFixed(2)),
      timestamp,
      status: statuses[Math.floor(Math.random() * statuses.length)]
    }
  }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

// Generate collateral allocation data
export function generateAllocationData(): AllocationData[] {
  const goldPercentage = 60 + Math.random() * 10 // 60-70%
  const silverPercentage = 100 - goldPercentage

  return [
    {
      name: 'Gold (XAU)',
      value: Number(goldPercentage.toFixed(1)),
      color: '#FFD700'
    },
    {
      name: 'Silver (XAG)',
      value: Number(silverPercentage.toFixed(1)),
      color: '#C0C0C0'
    }
  ]
}

// Generate strategy performance data
export interface StrategyData {
  name: string
  apy: number
  allocation: number
  risk: 'low' | 'medium' | 'high'
}

export function generateStrategyData(): StrategyData[] {
  return [
    {
      name: 'Permissioned Lending',
      apy: 5.8,
      allocation: 60,
      risk: 'low'
    },
    {
      name: 'Delta-Neutral Hedging',
      apy: 9.2,
      allocation: 40,
      risk: 'medium'
    }
  ]
}

// Format relative time
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}
