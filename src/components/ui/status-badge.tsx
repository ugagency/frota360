import { cn } from '@/lib/utils'

export type StatusValue =
  | 'ativo' | 'em_viagem' | 'em_manutencao' | 'inativo'
  | 'concluida' | 'cancelada' | 'em_andamento' | 'planejada'
  | 'preventiva' | 'corretiva'
  | 'agendada'

const MAP: Record<StatusValue, { label: string; cls: string }> = {
  ativo:          { label: 'ATIVO',          cls: 'bg-accent-surface text-accent border-accent-border' },
  concluida:      { label: 'CONCLUÍDA',      cls: 'bg-accent-surface text-accent border-accent-border' },

  em_viagem:      { label: 'EM VIAGEM',      cls: 'bg-brand-surface text-brand-dark border-brand-border' },
  em_andamento:   { label: 'EM ANDAMENTO',   cls: 'bg-brand-surface text-brand-dark border-brand-border' },
  preventiva:     { label: 'PREVENTIVA',     cls: 'bg-brand-surface text-brand-dark border-brand-border' },

  em_manutencao:  { label: 'EM MANUTENÇÃO',  cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  planejada:      { label: 'PLANEJADA',      cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  agendada:       { label: 'AGENDADA',       cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  corretiva:      { label: 'CORRETIVA',      cls: 'bg-red-50  text-red-700  border-red-200' },

  inativo:        { label: 'INATIVO',        cls: 'bg-stone-100 text-stone-500 border-stone-200' },
  cancelada:      { label: 'CANCELADA',      cls: 'bg-stone-100 text-stone-500 border-stone-200' },
}

export function StatusBadge({ status, className }: { status: StatusValue; className?: string }) {
  const { label, cls } = MAP[status]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium font-mono tracking-wide border',
        cls,
        className,
      )}
    >
      {label}
    </span>
  )
}
