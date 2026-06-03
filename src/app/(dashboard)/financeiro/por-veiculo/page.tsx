import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PeriodoPicker } from '@/components/financeiro/periodo-picker'
import { CustoPorVeiculoTabela, type CustoVeiculoRow } from '@/components/financeiro/custo-por-veiculo-tabela'
import { BenchmarkBar, BenchmarkDisclaimer } from '@/components/financeiro/benchmark-bar'
import { formatCurrency } from '@/lib/utils'
import type { Plano } from '@/lib/plano'
import type { CategoriaVeiculo } from '@/lib/constants/benchmarks'

export const dynamic = 'force-dynamic'

type SearchParams = { de?: string; ate?: string }

function mesAtual() {
  const d = new Date()
  return {
    de:  new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10),
    ate: new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10),
  }
}

export default async function CustoPorVeiculoPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vinculo } = await supabase
    .from('usuarios_transportadoras').select('transportadora_id').eq('user_id', user.id)
    .returns<{ transportadora_id: string }[]>().maybeSingle()

  const { data: transp } = await supabase
    .from('transportadoras').select('plano')
    .eq('id', vinculo?.transportadora_id ?? '').returns<{ plano: Plano }[]>().maybeSingle()

  const isPro = transp?.plano === 'profissional'

  const def = mesAtual()
  const de  = searchParams.de  ?? def.de
  const ate = searchParams.ate ?? def.ate

  const [veiculos, lancsRes, viagensRes] = await Promise.all([
    supabase.from('veiculos')
      .select('id, placa, modelo, categoria_veiculo')
      .order('placa')
      .returns<{ id: string; placa: string; modelo: string | null; categoria_veiculo: string | null }[]>(),
    supabase.from('lancamentos_financeiros').select('veiculo_id, tipo, categoria, valor').gte('data', de).lte('data', ate)
      .returns<{ veiculo_id: string | null; tipo: 'receita' | 'despesa'; categoria: string; valor: number }[]>(),
    supabase.from('viagens').select('veiculo_id, km_saida, km_chegada').eq('status', 'concluida')
      .gte('data_chegada_real', de).lte('data_chegada_real', `${ate}T23:59:59`)
      .returns<{ veiculo_id: string; km_saida: number | null; km_chegada: number | null }[]>(),
  ])

  const agg = new Map<string, Omit<CustoVeiculoRow, 'veiculo_id' | 'placa' | 'modelo' | 'kmRodados' | 'custoPorKm'>>()
  for (const l of lancsRes.data ?? []) {
    if (l.tipo !== 'despesa' || !l.veiculo_id) continue
    const cur = agg.get(l.veiculo_id) ?? { combustivel: 0, manutencao: 0, pedagio: 0, multa: 0, outros: 0, total: 0 }
    const v = Number(l.valor)
    cur.total += v
    if      (l.categoria === 'combustivel') cur.combustivel += v
    else if (l.categoria === 'manutencao')  cur.manutencao  += v
    else if (l.categoria === 'pedagio')     cur.pedagio     += v
    else if (l.categoria === 'multa')       cur.multa       += v
    else cur.outros += v
    agg.set(l.veiculo_id, cur)
  }

  const kmPorVeic = new Map<string, number>()
  for (const v of viagensRes.data ?? []) {
    if (v.km_saida == null || v.km_chegada == null) continue
    kmPorVeic.set(v.veiculo_id, (kmPorVeic.get(v.veiculo_id) ?? 0) + (Number(v.km_chegada) - Number(v.km_saida)))
  }

  const catMap = new Map<string, CategoriaVeiculo>()
  for (const v of veiculos.data ?? []) {
    catMap.set(v.id, (v.categoria_veiculo as CategoriaVeiculo) ?? 'pesado')
  }

  const rows: CustoVeiculoRow[] = (veiculos.data ?? [])
    .filter((v) => agg.has(v.id))
    .map((v) => {
      const a  = agg.get(v.id)!
      const km = kmPorVeic.get(v.id) ?? 0
      return {
        veiculo_id: v.id, placa: v.placa, modelo: v.modelo,
        ...a, kmRodados: km, custoPorKm: km > 0 ? a.total / km : 0,
      }
    })

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-xs text-ink-muted">
        <Link href="/financeiro" className="hover:text-ink">Financeiro</Link>
        <ChevronRight size={12} />
        <span className="text-ink">Custo por veículo</span>
      </nav>

      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink leading-none">Custo por veículo</h1>
          <p className="mt-1.5 text-sm text-ink-muted">Despesas detalhadas por categoria, ordenáveis. Exportável em CSV.</p>
        </div>
        <PeriodoPicker />
      </header>

      <CustoPorVeiculoTabela rows={rows} periodo={`${de}_${ate}`} />

      {/* Benchmark de custo/km — apenas plano Pro */}
      {isPro && rows.filter((r) => r.custoPorKm > 0).length > 0 && (
        <div className="bg-app-card border rounded-xl p-5 space-y-4">
          <div>
            <h2 className="font-display font-semibold text-ink mb-0.5">Custo/km vs. Benchmark de mercado</h2>
            <BenchmarkDisclaimer />
          </div>

          <div className="space-y-5 divide-y">
            {rows
              .filter((r) => r.custoPorKm > 0)
              .map((r) => (
                <div key={r.veiculo_id} className="pt-4 first:pt-0">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="font-mono font-semibold text-sm text-ink">{r.placa}</span>
                    <span className="font-mono text-sm text-ink-secondary">
                      {formatCurrency(r.custoPorKm)}/km
                    </span>
                  </div>
                  <BenchmarkBar
                    custoPorKm={r.custoPorKm}
                    categoria={catMap.get(r.veiculo_id) ?? 'pesado'}
                  />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
