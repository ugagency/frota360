import Link from 'next/link'
import { CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { PriorityBadge, type Priority } from '@/components/ui/priority-badge'
import { resolverAlerta } from '@/app/actions/alertas'
import { CnhRenovacaoInline } from '@/components/alertas/cnh-renovacao-inline'
import { formatDate } from '@/lib/utils'

type Alerta = {
  id: string
  tipo: string
  referencia_id: string
  titulo: string
  descricao: string | null
  data_alerta: string
  prioridade: Priority
}

// peso para ordenação: critico=0 (vem primeiro), baixo=3
const PESO: Record<Priority, number> = { critico: 0, alto: 1, medio: 2, baixo: 3 }

export async function AlertasWidget() {
  const supabase = createClient()

  // Pega todos os pendentes (RLS isola pelo tenant) e ordena no app — o "order by prioridade"
  // do SQL ordena alfabeticamente, não semanticamente.
  const { data, count } = await supabase
    .from('alertas')
    .select('id, tipo, referencia_id, titulo, descricao, data_alerta, prioridade', { count: 'exact' })
    .eq('status', 'pendente')
    .returns<Alerta[]>()

  const alertas = (data ?? []).slice().sort((a, b) => PESO[a.prioridade] - PESO[b.prioridade]).slice(0, 8)

  return (
    <Card className="bg-app-card overflow-hidden">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-xl font-semibold text-ink">Alertas</h2>
          {(count ?? 0) > 0 && (
            <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-600 text-white text-[11px] font-mono font-medium">
              {count}
            </span>
          )}
        </div>
        <Link href="/alertas" className="text-xs text-brand hover:text-brand-dark font-medium inline-flex items-center gap-1">
          Ver todos <ChevronRight size={14} />
        </Link>
        {/* TODO Sprint 4: página dedicada de alertas */}
      </header>

      {alertas.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="divide-y">
          {alertas.map((a) => <AlertaItem key={a.id} alerta={a} />)}
        </ul>
      )}
    </Card>
  )
}

function AlertaItem({ alerta }: { alerta: Alerta }) {
  return (
    <li className="p-4 hover:bg-app-subtle/50 transition-colors">
      <div className="flex items-start gap-3">
        <PriorityBadge prioridade={alerta.prioridade} className="mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-ink leading-tight">{alerta.titulo}</div>
          {alerta.descricao && (
            <div className="mt-1 text-xs text-ink-secondary leading-snug">{alerta.descricao}</div>
          )}
          {alerta.tipo === 'cnh_vencimento' && (
            <CnhRenovacaoInline motoristaId={alerta.referencia_id} alertaId={alerta.id} />
          )}
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] text-ink-muted">{formatDate(alerta.data_alerta)}</span>
            <form action={resolverAlerta}>
              <input type="hidden" name="id" value={alerta.id} />
              <Button type="submit" size="sm" variant="ghost" className="h-7 px-2 text-xs text-ink-secondary hover:text-accent hover:bg-accent-surface">
                Resolver
              </Button>
            </form>
          </div>
        </div>
      </div>
    </li>
  )
}

function EmptyState() {
  return (
    <div className="p-10 text-center">
      <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-accent-surface text-accent mb-3">
        <CheckCircle2 size={24} />
      </div>
      <div className="text-sm font-medium text-ink">Nenhum alerta pendente</div>
      <div className="mt-1 text-xs text-ink-muted">Sua frota está em dia.</div>
    </div>
  )
}

// ---------------------------------------------------------------------
export function AlertasWidgetSkeleton() {
  return (
    <Card className="bg-app-card">
      <div className="flex items-center justify-between p-4 border-b">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="divide-y">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 flex gap-3">
            <Skeleton className="h-5 w-16 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export { AlertTriangle }
