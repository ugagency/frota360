import { createClient } from '@/lib/supabase/server'
import { ManutencaoFiltros } from '@/components/manutencao/manutencao-filtros'
import { ManutencoesTabela, type ManutencaoLista } from '@/components/manutencao/manutencoes-tabela'
import { ManutencaoFormSheet } from '@/components/manutencao/manutencao-form-sheet'
import { ModuloBloqueado } from '@/components/plano/modulo-bloqueado'
import { getPlanoTransportadora } from '@/lib/get-plano'
import { moduloDisponivel } from '@/lib/plano'
import type { VeiculoOption } from '@/components/manutencao/manutencao-form'

export const dynamic = 'force-dynamic'

type SearchParams = { q?: string; tipo?: string; status?: string; de?: string; ate?: string }

export default async function ManutencaoPage({ searchParams }: { searchParams: SearchParams }) {
  const plano = await getPlanoTransportadora()
  if (!moduloDisponivel(plano, 'manutencao')) {
    return (
      <ModuloBloqueado
        nomeModulo="Manutenção"
        descricao="Agenda preventiva por KM e data, registro de corretivas, laudos e controle de custos por veículo."
      />
    )
  }

  const supabase = createClient()

  let query = supabase
    .from('manutencoes')
    .select('id, tipo, descricao, oficina, data_entrada, data_saida, valor_total, status, veiculos(placa, modelo)', { count: 'exact' })
    .order('data_entrada', { ascending: false })

  if (searchParams.tipo && searchParams.tipo !== 'todos') query = query.eq('tipo', searchParams.tipo)
  if (searchParams.status && searchParams.status !== 'todos') query = query.eq('status', searchParams.status)
  if (searchParams.de) query = query.gte('data_entrada', searchParams.de)
  if (searchParams.ate) query = query.lte('data_entrada', searchParams.ate)
  if (searchParams.q?.trim()) {
    const term = `%${searchParams.q.trim()}%`
    query = query.or(`oficina.ilike.${term},descricao.ilike.${term}`)
  }

  const [{ data, count }, veiculosRes] = await Promise.all([
    query.returns<ManutencaoLista[]>(),
    supabase.from('veiculos').select('id, placa, modelo, km_atual, status').order('placa').returns<VeiculoOption[]>(),
  ])

  const manutencoes = data ?? []

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink leading-none">Manutenção</h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            {count ?? 0} {count === 1 ? 'manutenção registrada' : 'manutenções registradas'}
          </p>
        </div>
        <ManutencaoFormSheet mode="create" veiculos={veiculosRes.data ?? []} onSavedNavigate />
      </header>

      <ManutencaoFiltros />
      <ManutencoesTabela manutencoes={manutencoes} />
    </div>
  )
}
