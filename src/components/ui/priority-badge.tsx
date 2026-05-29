import { cn } from '@/lib/utils'

export type Priority = 'critico' | 'alto' | 'medio' | 'baixo'

const MAP: Record<Priority, { label: string; cls: string; dot: string }> = {
  critico: { label: 'CRÍTICO', cls: 'bg-red-50 text-red-700 border-red-200',          dot: 'bg-red-600' },
  alto:    { label: 'ALTO',    cls: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  medio:   { label: 'MÉDIO',   cls: 'bg-brand-surface text-brand-dark border-brand-border', dot: 'bg-brand' },
  baixo:   { label: 'BAIXO',   cls: 'bg-stone-100 text-stone-500 border-stone-200',   dot: 'bg-stone-400' },
}

export function PriorityBadge({ prioridade, className }: { prioridade: Priority; className?: string }) {
  const { label, cls, dot } = MAP[prioridade]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium font-mono tracking-wide border',
        cls,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dot, prioridade === 'critico' && 'dot-pulse')} />
      {label}
    </span>
  )
}
