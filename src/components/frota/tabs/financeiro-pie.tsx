'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatCurrency } from '@/lib/utils'

const COLORS = ['#E8871E', '#1E9E6A', '#2563EB', '#DC2626', '#7C3AED', '#0891B2', '#6E695C']

type Slice = { name: string; value: number }

export function FinanceiroPie({ data }: { data: Slice[] }) {
  return (
    <div className="h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={42}
            outerRadius={75}
            paddingAngle={2}
          >
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip
            formatter={(v: number) => formatCurrency(v)}
            contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #E4E1D9' }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            iconSize={8}
            verticalAlign="bottom"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
