import { createClient } from '@/lib/supabase/server'
import { FrotaFiltros } from '@/components/frota/frota-filtros'
import { FrotaTabela, type VeiculoLista } from '@/components/frota/frota-tabela'
import { VeiculoFormSheet } from '@/components/frota/veiculo-form-sheet'
import { ImportacaoDialog } from '@/components/importacao/importacao-dialog'

export const dynamic = 'force-dynamic'

type SearchParams = {
  q?: string
  status?: string
  tipo?: string
  proprietario?: string
}

export default async function FrotaPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient()
  let query = supabase
    .from('veiculos')
    .select('id, placa, tipo, marca, modelo, ano, km_atual, data_proxima_revisao, status, proprietario', { count: 'exact' })
    .order('placa', { ascending: true })

  // Filtros (RLS isola por tenant)
  if (searchParams.status && searchParams.status !== 'todos') {
    query = query.eq('status', searchParams.status)
  }
  if (searchParams.tipo && searchParams.tipo !== 'todos') {
    query = query.eq('tipo', searchParams.tipo)
  }
  if (searchParams.proprietario && searchParams.proprietario !== 'todos') {
    query = query.eq('proprietario', searchParams.proprietario)
  }
  if (searchParams.q?.trim()) {
    const term = `%${searchParams.q.trim()}%`
    query = query.or(`placa.ilike.${term},marca.ilike.${term},modelo.ilike.${term}`)
  }

  const { data, count } = await query.returns<VeiculoLista[]>()
  const veiculos = data ?? []

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink leading-none">Frota</h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            {count ?? 0} {count === 1 ? 'veículo cadastrado' : 'veículos cadastrados'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ImportacaoDialog entidade="veiculos" />
          <VeiculoFormSheet mode="create" onSavedNavigate />
        </div>
      </header>

      <FrotaFiltros />

      <FrotaTabela veiculos={veiculos} />
    </div>
  )
}
