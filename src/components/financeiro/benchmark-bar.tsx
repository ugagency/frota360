'use client'

import { BENCHMARK_CUSTO_KM, BENCHMARK_DISCLAIMER, getZonaBenchmark, type CategoriaVeiculo } from '@/lib/constants/benchmarks'
import { formatCurrency } from '@/lib/utils'

interface BenchmarkBarProps {
  custoPorKm: number
  categoria: CategoriaVeiculo
  className?: string
}

const ZONA_COLORS = {
  economico: { bar: 'bg-accent', dot: 'bg-accent', label: 'text-accent',  texto: 'Abaixo da média' },
  na_media:  { bar: 'bg-amber-400', dot: 'bg-amber-500', label: 'text-amber-600', texto: 'Na média' },
  acima:     { bar: 'bg-red-400',   dot: 'bg-red-500',   label: 'text-red-600',   texto: 'Acima da média' },
}

export function BenchmarkBar({ custoPorKm, categoria, className }: BenchmarkBarProps) {
  const bench = BENCHMARK_CUSTO_KM[categoria]
  const zona  = getZonaBenchmark(custoPorKm, categoria)
  const colors = ZONA_COLORS[zona]

  // Posição do marcador (clamped 0–100%)
  const range = bench.max - bench.min
  const pos   = range > 0 ? Math.min(100, Math.max(0, ((custoPorKm - bench.min) / range) * 100)) : 50

  return (
    <div className={className}>
      {/* Barra */}
      <div className="relative h-2.5 rounded-full bg-border overflow-visible">
        {/* Zona colorida até a posição do marcador */}
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all ${colors.bar} opacity-30`}
          style={{ width: `${pos}%` }}
        />
        {/* Linha central (média) */}
        <div
          className="absolute top-0 h-full w-px bg-ink-muted/30"
          style={{ left: `${((bench.medio - bench.min) / (bench.max - bench.min)) * 100}%` }}
        />
        {/* Marcador */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-sm ${colors.dot}`}
          style={{ left: `calc(${pos}% - 6px)` }}
        />
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] font-mono text-ink-muted">R${bench.min.toFixed(2)}/km</span>
        <span className={`text-[10px] font-semibold ${colors.label}`}>{colors.texto}</span>
        <span className="text-[10px] font-mono text-ink-muted">R${bench.max.toFixed(2)}/km</span>
      </div>
    </div>
  )
}

export function BenchmarkDisclaimer() {
  return (
    <p className="text-[11px] text-ink-muted italic mt-1">{BENCHMARK_DISCLAIMER}</p>
  )
}

export function BenchmarkIcone({ custoPorKm, categoria }: { custoPorKm: number; categoria: CategoriaVeiculo }) {
  const zona = getZonaBenchmark(custoPorKm, categoria)
  if (zona === 'economico') return <span className="text-accent text-xs">↓</span>
  if (zona === 'na_media')  return <span className="text-amber-500 text-xs">→</span>
  return <span className="text-red-500 text-xs">↑</span>
}
