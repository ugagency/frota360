import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ViagensFiltros } from '@/components/viagens/viagens-filtros'
import { ViagensTabela, type ViagemLista } from '@/components/viagens/viagens-tabela'

export const dynamic = 'force-dynamic'

type SearchParams = {
  q?: string
  status?: string
  motorista?: string
  veiculo?: string
  de?: string
  ate?: string
}

export default async function ViagensPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient()

  // Filtros para os Selects (apenas ativos)
  const [motOpts, veiOpts] = await Promise.all([
    supabase.from('motoristas').select('id, nome').eq('status', 'ativo').order('nome')
      .returns<{ id: string; nome: string }[]>(),
    supabase.from('veiculos').select('id, placa').order('placa')
      .returns<{ id: string; placa: string }[]>(),
  ])

  // Query da lista
  let query = supabase
    .from('viagens')
    .select('id, numero, origem, destino, data_saida, data_chegada, valor_frete, km_saida, status, veiculos(placa, modelo), motoristas(nome)', { count: 'exact' })
    .order('data_saida', { ascending: false, nullsFirst: false })

  if (searchParams.status && searchParams.status !== 'todos') query = query.eq('status', searchParams.status)
  if (searchParams.motorista && searchParams.motorista !== 'todos') query = query.eq('motorista_id', searchParams.motorista)
  if (searchParams.veiculo && searchParams.veiculo !== 'todos') query = query.eq('veiculo_id', searchParams.veiculo)
  if (searchParams.de)  query = query.gte('data_saida', searchParams.de)
  if (searchParams.ate) query = query.lte('data_saida', `${searchParams.ate}T23:59:59`)
  if (searchParams.q?.trim()) {
    const term = `%${searchParams.q.trim()}%`
    query = query.or(`numero.ilike.${term},origem.ilike.${term},destino.ilike.${term},cliente.ilike.${term}`)
  }

  const { data, count } = await query.returns<ViagemLista[]>()
  const viagens = data ?? []

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink leading-none">Viagens</h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            {count ?? 0} {count === 1 ? 'viagem registrada' : 'viagens registradas'}
          </p>
        </div>
        <Button asChild className="bg-brand hover:bg-brand-dark text-white">
          <Link href="/viagens/nova"><Plus className="mr-1.5 h-4 w-4" /> Nova viagem</Link>
        </Button>
      </header>

      <ViagensFiltros
        motoristas={(motOpts.data ?? []).map((m) => ({ id: m.id, label: m.nome }))}
        veiculos={(veiOpts.data ?? []).map((v) => ({ id: v.id, label: v.placa }))}
      />

      <ViagensTabela viagens={viagens} />
    </div>
  )
}
