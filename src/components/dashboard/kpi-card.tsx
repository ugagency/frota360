import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export type KpiVariante = 'brand' | 'accent' | 'danger' | 'info' | 'neutral'

export type KpiCardProps = {
  titulo: string
  valor: string | number
  subtitulo?: string
  icone: LucideIcon
  variante?: KpiVariante
  tendencia?: {
    direcao: 'up' | 'down' | 'neutral'
    label: string
  }
}

const ICON_BG: Record<KpiVariante, string> = {
  brand:   'bg-brand',
  accent:  'bg-accent',
  danger:  'bg-red-600',
  info:    'bg-blue-600',
  neutral: 'bg-stone-400',
}

const TREND_COLOR = {
  up:      'text-accent',
  down:    'text-red-600',
  neutral: 'text-ink-muted',
} as const

const TREND_ICON = {
  up:      ArrowUpRight,
  down:    ArrowDownRight,
  neutral: Minus,
} as const

export function KpiCard({ titulo, valor, subtitulo, icone: Icon, variante = 'neutral', tendencia }: KpiCardProps) {
  const TrendIcon = tendencia ? TREND_ICON[tendencia.direcao] : null

  return (
    <Card className="p-5 bg-app-card shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[13px] text-ink-secondary leading-tight">{titulo}</div>
          <div className="mt-2 font-display text-[32px] font-bold tabular-nums leading-none text-ink">
            {valor}
          </div>
          {subtitulo && (
            <div className="mt-2 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
              {subtitulo}
            </div>
          )}
          {tendencia && TrendIcon && (
            <div className={cn('mt-2 inline-flex items-center gap-1 text-xs font-medium', TREND_COLOR[tendencia.direcao])}>
              <TrendIcon size={14} strokeWidth={2.5} />
              {tendencia.label}
            </div>
          )}
        </div>
        <span className={cn(
          'shrink-0 inline-flex items-center justify-center text-white rounded-md',
          'h-10 w-10',
          ICON_BG[variante],
        )}>
          <Icon size={20} strokeWidth={2.25} />
        </span>
      </div>
    </Card>
  )
}

export function KpiCardSkeleton() {
  return (
    <Card className="p-5 bg-app-card shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-10 w-10 rounded-md" />
      </div>
    </Card>
  )
}
