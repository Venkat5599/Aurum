'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { generateAllocationData } from '@/lib/mockData'
import { useMemo } from 'react'

export function AllocationChart() {
  const data = useMemo(() => generateAllocationData(), [])

  return (
    <div className="bg-card border border-border/40 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-foreground mb-1">Collateral Allocation</h3>
        <p className="text-sm text-muted-foreground">Distribution of your holdings</p>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
            animationDuration={1000}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              padding: '8px 12px'
            }}
            formatter={(value: number) => `${value}%`}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
