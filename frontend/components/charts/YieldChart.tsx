'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { generateYieldData } from '@/lib/mockData'
import { useMemo } from 'react'

export function YieldChart() {
  const data = useMemo(() => generateYieldData(30), [])

  return (
    <div className="bg-card border border-border/40 rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-foreground mb-1">Yield Performance</h3>
        <p className="text-sm text-muted-foreground">Cumulative yield over the last 30 days</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="yieldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#FFD700" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              padding: '8px 12px'
            }}
            labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}
            formatter={(value: number) => [`${value}%`, 'Yield']}
          />
          <Area
            type="monotone"
            dataKey="yield"
            stroke="#FFD700"
            strokeWidth={2}
            fill="url(#yieldGradient)"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
