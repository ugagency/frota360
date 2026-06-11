import { createClient } from '@/lib/supabase/server'
import { MotoristasFiltros } from '@/components/motoristas/motoristas-filtros'
import { MotoristasTabela, type MotoristaLista } from '@/components/motoristas/motoristas-tabela'
import { MotoristaFormSheet } from '@/components/motoristas/motorista-form-sheet'
import { ImportacaoDialog } from '@/components/importacao/importacao-dialog'

export const dynamic = 'force-dynamic'

type SearchParams = {
  q?: string
  status?: string
  tipo?: string
  vencendo?: string
}

export default async function MotoristasPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient()

  let query = supabase
    .from('motoristas')
    .select('id, nome, cpf, telefone, cnh_numero, cnh_categoria, cnh_validade, mopp_validade, nr_validade, tipo, status', { count: 'exact' })
    .order('nome', { ascending: true })

  if (searchParams.status && searchParams.status !== 'todos') query = query.eq('status', searchParams.status)
  if (searchParams.tipo && searchParams.tipo !== 'todos') query = query.eq('tipo', searchParams.tipo)
  if (searchParams.q?.trim()) {
    const term = `%${searchParams.q.trim()}%`
    query = query.or(`nome.ilike.${term},cpf.ilike.${term}`)
  }
  if (searchParams.vencendo === '1') {
    const limite = new Date()
    limite.setDate(limite.getDate() + 60)
    const lim = limite.toISOString().slice(0, 10)
    // CNH ou MOPP vencendo nos próximos 60 dias (inclui vencidos)
    query = query.or(`cnh_validade.lte.${lim},mopp_validade.lte.${lim}`)
  }

  const { data, count } = await query.returns<MotoristaLista[]>()
  const motoristas = data ?? []

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink leading-none">Motoristas</h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            {count ?? 0} {count === 1 ? 'motorista cadastrado' : 'motoristas cadastrados'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ImportacaoDialog entidade="motoristas" />
          <MotoristaFormSheet mode="create" onSavedNavigate />
        </div>
      </header>

      <MotoristasFiltros />

      <MotoristasTabela motoristas={motoristas} />
    </div>
  )
}
