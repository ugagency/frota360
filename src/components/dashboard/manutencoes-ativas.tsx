import Link from 'next/link'
import { Wrench, CheckCircle2, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDate } from '@/lib/utils'

type ManutencaoAtiva = {
  id: string
  tipo: 'preventiva' | 'corretiva'
  oficina: string | null
  data_entrada: string
  veiculos: { placa: string; modelo: string | null } | null
}

export async function ManutencoesAtivasWidget() {
  const supabase = createClient()

  const { data } = await supabase
    .from('manutencoes')
    .select('id, tipo, oficina, data_entrada, veiculos(placa, modelo)')
    .eq('status', 'em_andamento')
    .order('data_entrada', { ascending: false })
    .returns<ManutencaoAtiva[]>()

  const manutencoes = data ?? []

  return (
    <Card className="bg-app-card overflow-hidden">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-xl font-semibold text-ink">Manutenções em andamento</h2>
          {manutencoes.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-blue-600 text-white text-[11px] font-mono font-medium">
              {manutencoes.length}
            </span>
          )}
        </div>
        <Link href="/manutencao" className="text-xs text-brand hover:text-brand-dark font-medium inline-flex items-center gap-1">
          Ver todas <ChevronRight size={14} />
        </Link>
      </header>

      {manutencoes.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="divide-y">
          {manutencoes.map((m) => (
            <li key={m.id}>
              <Link
                href={`/manutencao/${m.id}`}
                className="flex items-center gap-4 p-4 hover:bg-app-subtle/50 transition-colors cursor-pointer"
              >
                <span className="shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-md bg-brand-surface text-brand-dark">
                  <Wrench size={18} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-ink">{m.veiculos?.placa ?? '—'}</span>
                    {m.veiculos?.modelo && <span className="text-sm text-ink-secondary truncate">— {m.veiculos.modelo}</span>}
                    <StatusBadge status={m.tipo} className="ml-1" />
                  </div>
                  <div className="mt-1 text-xs text-ink-muted">
                    {m.oficina ?? 'Oficina não informada'}
                    <span className="mx-1.5">·</span>
                    <span className="font-mono">Entrada {formatDate(m.data_entrada)}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-ink-muted shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function EmptyState() {
  return (
    <div className="p-10 text-center">
      <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-accent-surface text-accent mb-3">
        <CheckCircle2 size={24} />
      </div>
      <div className="text-sm font-medium text-ink">Nenhuma manutenção em andamento.</div>
    </div>
  )
}

export function ManutencoesAtivasWidgetSkeleton() {
  return (
    <Card className="bg-app-card">
      <div className="flex items-center justify-between p-4 border-b">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="divide-y">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
