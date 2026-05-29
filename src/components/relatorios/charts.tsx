'use client'

import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

// ---------- Frota: distribuição por tipo ----------
export function BarrasPorTipo({ data }: { data: { tipo: string; total: number }[] }) {
  return (
    <div className="h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E4E1D9" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis dataKey="tipo" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
          <Bar dataKey="total" fill="#E8871E" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ---------- Viagens: linha por semana ----------
export function LinhaPorSemana({ data }: { data: { semana: string; viagens: number }[] }) {
  return (
    <div className="h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E4E1D9" />
          <XAxis dataKey="semana" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
          <Line type="monotone" dataKey="viagens" stroke="#E8871E" strokeWidth={2.5} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ---------- Custos: área empilhada por categoria ----------
type AreaSerie = { key: string; nome: string; cor: string }

export function AreaPorCategoria({
  data, series,
}: {
  data: Array<Record<string, string | number>>
  series: AreaSerie[]
}) {
  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E4E1D9" />
          <XAxis dataKey="mes" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.nome}
              stackId="1"
              stroke={s.cor}
              fill={s.cor}
              fillOpacity={0.6}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
