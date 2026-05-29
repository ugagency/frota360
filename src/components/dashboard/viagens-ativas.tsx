import Link from 'next/link'
import { MapPin, Route, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'

type ViagemAtiva = {
  id: string
  numero: string
  origem: string
  destino: string
  data_chegada: string | null
  veiculos: { placa: string; modelo: string | null } | null
  motoristas: { nome: string } | null
}

export async function ViagensAtivasWidget() {
  const supabase = createClient()

  const { data } = await supabase
    .from('viagens')
    .select('id, numero, origem, destino, data_chegada, veiculos(placa, modelo), motoristas(nome)')
    .eq('status', 'em_andamento')
    .order('data_saida', { ascending: true })
    .returns<ViagemAtiva[]>()

  const viagens = data ?? []

  return (
    <Card className="bg-app-card overflow-hidden">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-xl font-semibold text-ink">Viagens em andamento</h2>
          {viagens.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-brand text-white text-[11px] font-mono font-medium">
              {viagens.length}
            </span>
          )}
        </div>
        <Link href="/viagens" className="text-xs text-brand hover:text-brand-dark font-medium inline-flex items-center gap-1">
          Ver todas <ChevronRight size={14} />
        </Link>
      </header>

      {viagens.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="divide-y">
          {viagens.map((v) => <ViagemCard key={v.id} viagem={v} />)}
        </ul>
      )}
    </Card>
  )
}

function ViagemCard({ viagem }: { viagem: ViagemAtiva }) {
  return (
    <li className="p-4 bg-app-subtle/30 hover:border-l-brand transition-colors border-l-2 border-l-transparent">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium tracking-wider bg-brand-surface text-brand-dark border border-brand-border">
          <span className="h-1.5 w-1.5 rounded-full bg-brand dot-pulse" />
          EM ANDAMENTO
        </span>
        <span className="font-mono text-[11px] text-ink-muted">{viagem.numero}</span>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="font-mono font-bold text-ink">{viagem.veiculos?.placa ?? '—'}</span>
        {viagem.veiculos?.modelo && <span className="text-ink-secondary truncate">— {viagem.veiculos.modelo}</span>}
      </div>

      {viagem.motoristas?.nome && (
        <div className="mt-0.5 text-xs text-ink-secondary truncate">{viagem.motoristas.nome}</div>
      )}

      <div className="mt-3 flex items-center gap-2 text-xs">
        <MapPin size={12} className="shrink-0 text-accent" />
        <span className="truncate text-ink">{viagem.origem}</span>
        <span className="flex-1 border-t border-dashed border-stone-300" />
        <MapPin size={12} className="shrink-0 text-brand" />
        <span className="truncate text-ink">{viagem.destino}</span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-[11px] text-ink-muted">
          Chegada prevista: {formatDate(viagem.data_chegada)}
        </span>
        <Link
          href={`/viagens/${viagem.id}`}
          className="text-xs text-brand hover:text-brand-dark font-medium inline-flex items-center gap-1"
        >
          Ver detalhes <ChevronRight size={12} />
        </Link>
      </div>
    </li>
  )
}

function EmptyState() {
  return (
    <div className="p-10 text-center">
      <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-stone-100 text-ink-muted mb-3">
        <Route size={24} />
      </div>
      <div className="text-sm font-medium text-ink">Nenhuma viagem em andamento.</div>
    </div>
  )
}

export function ViagensAtivasWidgetSkeleton() {
  return (
    <Card className="bg-app-card">
      <div className="flex items-center justify-between p-4 border-b">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="divide-y">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="p-4 space-y-2.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    </Card>
  )
}
