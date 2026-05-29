import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { cn, getDaysUntil, formatDate } from '@/lib/utils'

type Status = 'valido' | 'vencendo' | 'vencido' | 'sem_data'

function statusFromDate(date: string | null | undefined): { status: Status; dias: number | null } {
  if (!date) return { status: 'sem_data', dias: null }
  const dias = getDaysUntil(date)
  if (dias < 0) return { status: 'vencido', dias }
  if (dias <= 30) return { status: 'vencendo', dias }
  return { status: 'valido', dias }
}

type Props = {
  validade: string | null | undefined
  /** se true, mostra apenas o badge sem a data ao lado */
  compact?: boolean
  className?: string
}

export function DocumentoValidadeBadge({ validade, compact = false, className }: Props) {
  const { status, dias } = statusFromDate(validade)

  if (status === 'sem_data') {
    return <span className={cn('text-ink-muted font-mono text-xs', className)}>—</span>
  }

  const config = {
    valido:   { cls: 'bg-accent-surface text-accent border-accent-border',  Icon: CheckCircle2,  label: 'VÁLIDO' },
    vencendo: { cls: 'bg-yellow-100 text-yellow-800 border-yellow-200',     Icon: AlertTriangle, label: 'VENCENDO' },
    vencido:  { cls: 'bg-red-50 text-red-700 border-red-200',               Icon: XCircle,       label: 'VENCIDO' },
  }[status]

  const Icon = config.Icon

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium tracking-wider border',
        config.cls,
      )}>
        <Icon size={10} strokeWidth={2.5} />
        {config.label}
      </span>
      {!compact && (
        <span className="font-mono text-xs text-ink-secondary">
          {formatDate(validade!)}
          {status === 'vencendo' && dias != null && <span className="ml-1 text-ink-muted">· {dias}d</span>}
          {status === 'vencido' && dias != null && <span className="ml-1 text-red-600">· {Math.abs(dias)}d atrás</span>}
        </span>
      )}
    </span>
  )
}
