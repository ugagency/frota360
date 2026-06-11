import Link from 'next/link'
import { CheckCircle2, Bell } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PriorityBadge, type Priority } from '@/components/ui/priority-badge'
import { AlertasFiltros } from '@/components/alertas/alertas-filtros'
import { CnhRenovacaoInline } from '@/components/alertas/cnh-renovacao-inline'
import { resolverAlerta, marcarAlertaVisualizado } from '@/app/actions/alertas'
import { formatDate, cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

type AlertaCompleto = {
  id: string
  tipo: 'manutencao_km' | 'manutencao_data' | 'cnh_vencimento' | 'mopp_vencimento' | 'licenciamento'
  referencia_id: string
  referencia_tipo: 'veiculo' | 'motorista'
  titulo: string
  descricao: string | null
  data_alerta: string
  status: 'pendente' | 'visualizado' | 'resolvido'
  prioridade: Priority
  created_at: string
}

const PESO: Record<Priority, number> = { critico: 0, alto: 1, medio: 2, baixo: 3 }

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente', visualizado: 'Visualizado', resolvido: 'Resolvido',
}

const STATUS_CLS: Record<string, string> = {
  pendente:    'bg-red-50 text-red-700 border-red-200',
  visualizado: 'bg-blue-50 text-blue-700 border-blue-200',
  resolvido:   'bg-accent-surface text-accent border-accent-border',
}

type SearchParams = { status?: string; tipo?: string; prio?: string }

export default async function AlertasPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient()

  const status = searchParams.status ?? 'pendente'
  const tipo   = searchParams.tipo   ?? 'todos'
  const prio   = searchParams.prio   ?? 'todos'

  let query = supabase
    .from('alertas')
    .select('id, tipo, referencia_id, referencia_tipo, titulo, descricao, data_alerta, status, prioridade, created_at', { count: 'exact' })
    .order('data_alerta', { ascending: true })

  if (status !== 'todos') query = query.eq('status', status)
  if (tipo   !== 'todos') query = query.eq('tipo', tipo)
  if (prio   !== 'todos') query = query.eq('prioridade', prio)

  const { data, count } = await query.returns<AlertaCompleto[]>()

  // Ordena por peso (críticos primeiro) mantendo data_alerta como desempate
  const alertas = (data ?? []).slice().sort((a, b) => {
    const dp = PESO[a.prioridade] - PESO[b.prioridade]
    if (dp !== 0) return dp
    return new Date(a.data_alerta).getTime() - new Date(b.data_alerta).getTime()
  })

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink leading-none">Alertas</h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            {count ?? 0} {count === 1 ? 'alerta encontrado' : 'alertas encontrados'} com os filtros atuais.
          </p>
        </div>
      </header>

      <AlertasFiltros />

      {alertas.length === 0 ? (
        <EmptyState />
      ) : (
        <Card className="bg-app-card overflow-hidden">
          <ul className="divide-y">
            {alertas.map((a) => (
              <li key={a.id} className={cn('p-4 hover:bg-app-subtle/40', a.status === 'resolvido' && 'opacity-60')}>
                <div className="flex items-start gap-3">
                  <PriorityBadge prioridade={a.prioridade} className="mt-0.5 shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-ink leading-tight">{a.titulo}</span>
                      <span className={cn(
                        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium uppercase border',
                        STATUS_CLS[a.status],
                      )}>{STATUS_LABEL[a.status]}</span>
                    </div>
                    {a.descricao && <div className="mt-1 text-xs text-ink-secondary leading-snug">{a.descricao}</div>}
                    {a.tipo === 'cnh_vencimento' && a.status !== 'resolvido' && (
                      <CnhRenovacaoInline motoristaId={a.referencia_id} alertaId={a.id} />
                    )}
                    <div className="mt-2 flex items-center gap-3">
                      <span className="font-mono text-[11px] text-ink-muted">{formatDate(a.data_alerta)}</span>
                      <Link
                        href={a.referencia_tipo === 'veiculo' ? `/frota/${a.referencia_id}` : `/motoristas/${a.referencia_id}`}
                        className="text-[11px] text-brand hover:text-brand-dark font-medium"
                      >
                        Ver {a.referencia_tipo} →
                      </Link>
                    </div>
                  </div>

                  {a.status !== 'resolvido' && (
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 shrink-0">
                      {a.status === 'pendente' && (
                        <form action={marcarAlertaVisualizado}>
                          <input type="hidden" name="id" value={a.id} />
                          <Button type="submit" size="sm" variant="ghost" className="h-7 px-2 text-xs">
                            Visto
                          </Button>
                        </form>
                      )}
                      <form action={resolverAlerta}>
                        <input type="hidden" name="id" value={a.id} />
                        <Button type="submit" size="sm" variant="ghost" className="h-7 px-2 text-xs text-accent hover:bg-accent-surface">
                          Resolver
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <Card className="p-12 text-center bg-app-card">
      <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-accent-surface text-accent mb-3">
        <CheckCircle2 size={28} />
      </div>
      <div className="font-display text-lg font-semibold text-ink">Nenhum alerta encontrado.</div>
      <div className="mt-1 text-sm text-ink-secondary">
        <Bell size={14} className="inline mr-1" /> Alertas são gerados automaticamente para CNH, MOPP, licenciamento e manutenções.
      </div>
    </Card>
  )
}
