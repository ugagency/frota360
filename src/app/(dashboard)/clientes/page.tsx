import Link from 'next/link'
import { Building2, TrendingUp, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { ClientesTabela, type ClienteLista } from '@/components/clientes/clientes-tabela'
import { ClienteFormSheet } from '@/components/clientes/cliente-form-sheet'
import { ImportacaoDialog } from '@/components/importacao/importacao-dialog'

export const dynamic = 'force-dynamic'

type SearchParams = { status?: string; q?: string }

export default async function ClientesPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient()

  const hoje = new Date().toISOString().slice(0, 10)

  let query = supabase
    .from('clientes')
    .select('id, razao_social, cnpj, cidade, estado, status, segmento, proxima_acao, prazo_pagamento', { count: 'exact' })
    .order('razao_social', { ascending: true })

  if (searchParams.status && searchParams.status !== 'todos') {
    query = query.eq('status', searchParams.status)
  } else {
    query = query.neq('status', 'inativo')
  }

  if (searchParams.q?.trim()) {
    const term = `%${searchParams.q.trim()}%`
    query = query.or(`razao_social.ilike.${term},cnpj.ilike.${term}`)
  }

  const { data, count } = await query.returns<ClienteLista[]>()
  const clientes = data ?? []

  // KPIs
  const { data: todos } = await supabase
    .from('clientes')
    .select('id, status, proxima_acao')
    .returns<{ id: string; status: string; proxima_acao: string | null }[]>()

  const todosData = todos ?? []
  const totalAtivos    = todosData.filter((c) => c.status === 'ativo').length
  const totalProspects = todosData.filter((c) => c.status === 'prospect').length
  const followUps      = todosData.filter((c) => c.proxima_acao && c.proxima_acao <= hoje).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink leading-none">Clientes</h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            {count ?? 0} {count === 1 ? 'cliente encontrado' : 'clientes encontrados'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/clientes/rentabilidade"
            className="inline-flex items-center gap-1.5 text-sm text-brand hover:text-brand-dark font-medium"
          >
            <TrendingUp size={16} /> Rentabilidade
          </Link>
          <ImportacaoDialog entidade="clientes" />
          <ClienteFormSheet mode="create" onSavedNavigate />
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Ativos" value={totalAtivos} icon="ativo" />
        <KpiCard label="Prospects" value={totalProspects} icon="prospect" />
        <KpiCard label="Follow-ups" value={followUps} icon="followup" urgent={followUps > 0} />
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {['todos','prospect','ativo','suspenso','inativo'].map((s) => (
          <Link
            key={s}
            href={`/clientes${s !== 'todos' ? `?status=${s}` : ''}`}
            className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
              (searchParams.status ?? 'todos') === s
                ? 'bg-brand text-white border-brand'
                : 'bg-app-card text-ink-secondary border hover:border-brand hover:text-brand'
            }`}
          >
            {s === 'todos' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </div>

      <ClientesTabela clientes={clientes} />
    </div>
  )
}

function KpiCard({
  label, value, icon, urgent,
}: { label: string; value: number; icon: string; urgent?: boolean }) {
  return (
    <Card className="p-4 bg-app-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">{label}</div>
          <div className={`mt-1 font-display text-2xl font-bold ${urgent ? 'text-red-600' : 'text-ink'}`}>
            {value}
          </div>
        </div>
        <div className={`p-2 rounded-lg ${icon === 'followup' && urgent ? 'bg-red-50 text-red-600' : 'bg-brand-surface text-brand'}`}>
          {icon === 'followup' ? <Clock size={18} /> : <Building2 size={18} />}
        </div>
      </div>
    </Card>
  )
}
