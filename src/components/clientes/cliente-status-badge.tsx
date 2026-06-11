import { cn } from '@/lib/utils'
import { STATUS_LABELS, type STATUS_CLIENTE } from '@/lib/validations/cliente'

type ClienteStatus = typeof STATUS_CLIENTE[number]

const CLS: Record<ClienteStatus, string> = {
  prospect: 'bg-blue-50 text-blue-700 border-blue-200',
  ativo:    'bg-accent-surface text-accent border-accent-border',
  suspenso: 'bg-yellow-50 text-yellow-700 border-yellow-300',
  inativo:  'bg-stone-100 text-stone-500 border-stone-200',
}

export function ClienteStatusBadge({ status, className }: { status: string; className?: string }) {
  const s = (status ?? 'ativo') as ClienteStatus
  const cls = CLS[s] ?? CLS.ativo
  const label = STATUS_LABELS[s] ?? status
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium font-mono tracking-wide border',
      cls, className,
    )}>
      {label.toUpperCase()}
    </span>
  )
}
