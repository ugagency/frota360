'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

const CATEGORIA_COLORS = ['#E8871E', '#1E9E6A', '#2563EB', '#DC2626', '#7C3AED', '#0891B2', '#6E695C']

type MesData = { mes: string; receita: number; despesa: number }

export function BarrasReceitaDespesa({ data }: { data: MesData[] }) {
  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E4E1D9" vertical={false} />
          <XAxis dataKey="mes" tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#6E695C' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#6E695C' }} axisLine={false} tickLine={false}
                 tickFormatter={(v: number) => `R$ ${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            formatter={(v: number) => formatCurrency(v)}
            labelStyle={{ fontFamily: 'monospace', fontSize: 11 }}
            contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #E4E1D9' }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={9} />
          <Bar dataKey="receita" name="Receita" fill="#E8871E" radius={[3, 3, 0, 0]} />
          <Bar dataKey="despesa" name="Despesa" fill="#1E9E6A" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

type CategoriaSlice = { name: string; value: number }

export function PizzaPorCategoria({ data }: { data: CategoriaSlice[] }) {
  const total = data.reduce((acc, d) => acc + d.value, 0)
  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data} dataKey="value" nameKey="name"
            innerRadius={48} outerRadius={88} paddingAngle={2}
            label={(entry: { name: string; value: number }) => {
              const pct = total > 0 ? ((entry.value / total) * 100).toFixed(0) : '0'
              return `${entry.name} ${pct}%`
            }}
            labelLine={false}
            style={{ fontSize: 11 }}
          >
            {data.map((_, i) => <Cell key={i} fill={CATEGORIA_COLORS[i % CATEGORIA_COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v: number) => formatCurrency(v)}
                   contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #E4E1D9' }} />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
