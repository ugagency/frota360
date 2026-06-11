import { Suspense } from 'react'
import { Truck, Route, Wrench, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { gerarAlertasSeNecessario } from '@/lib/alertas'
import { KpiCard, KpiCardSkeleton } from '@/components/dashboard/kpi-card'
import { AlertasWidget, AlertasWidgetSkeleton } from '@/components/dashboard/alertas-widget'
import { ViagensAtivasWidget, ViagensAtivasWidgetSkeleton } from '@/components/dashboard/viagens-ativas'
import { ManutencoesAtivasWidget, ManutencoesAtivasWidgetSkeleton } from '@/components/dashboard/manutencoes-ativas'
import { AssistenteCard } from '@/components/dashboard/assistente-card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createClient()

  // Saudação usa nome da transportadora — busca rápida em paralelo com a geração de alertas
  const [transp, veicCount, motCount] = await Promise.all([
    supabase
      .from('transportadoras')
      .select('id, nome, config')
      .returns<{ id: string; nome: string; config: Record<string, unknown> | null }[]>()
      .single(),
    supabase.from('veiculos').select('id', { count: 'exact', head: true }),
    supabase.from('motoristas').select('id', { count: 'exact', head: true }),
  ])

  // Geração automática (throttle 1h) — fire-and-forget mas aguardamos para o primeiro render
  if (transp.data) {
    await gerarAlertasSeNecessario(supabase, transp.data.id, transp.data.config)
  }

  const nomeTransp = transp.data?.nome ?? 'sua operação'
  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  const primeiroAcesso = (veicCount.count ?? 0) === 0 && (motCount.count ?? 0) === 0

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl md:text-[28px] font-semibold text-ink leading-none">
          Olá, <span className="text-brand">{nomeTransp}</span>.
        </h1>
        <p className="mt-2 text-sm text-ink-secondary">
          Aqui está o resumo da sua operação de hoje — <span className="capitalize">{hoje}</span>.
        </p>
      </header>

      {primeiroAcesso && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h2 className="font-display font-semibold text-amber-900 text-lg mb-1">
            Bem-vindo ao Frota 360!
          </h2>
          <p className="text-amber-700 text-sm mb-4">
            Comece cadastrando sua frota. Leva menos de 5 minutos.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href="/frota">
              <button className="w-full sm:w-auto px-4 py-2 text-sm font-medium
                                 bg-brand text-white rounded-lg hover:bg-brand-dark
                                 transition-colors">
                1 · Cadastrar caminhões →
              </button>
            </a>
            <a href="/motoristas">
              <button className="w-full sm:w-auto px-4 py-2 text-sm font-medium
                                 bg-white border border-amber-300 text-amber-800
                                 rounded-lg hover:bg-amber-50 transition-colors">
                2 · Cadastrar motoristas
              </button>
            </a>
            <a href="/importar">
              <button className="w-full sm:w-auto px-4 py-2 text-sm font-medium
                                 bg-white border border-amber-300 text-amber-800
                                 rounded-lg hover:bg-amber-50 transition-colors">
                3 · Tenho uma planilha →
              </button>
            </a>
          </div>
        </div>
      )}

      <Suspense fallback={<KpisGridSkeleton />}>
        <KpisGrid />
      </Suspense>

      <Separator className="bg-stone-200" />

      <AssistenteCard />

      <Separator className="bg-stone-200" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7">
          <Suspense fallback={<AlertasWidgetSkeleton />}>
            <AlertasWidget />
          </Suspense>
        </div>
        <div className="lg:col-span-5">
          <Suspense fallback={<ViagensAtivasWidgetSkeleton />}>
            <ViagensAtivasWidget />
          </Suspense>
        </div>
      </div>

      <Separator className="bg-stone-200" />

      <Suspense fallback={<ManutencoesAtivasWidgetSkeleton />}>
        <ManutencoesAtivasWidget />
      </Suspense>
    </div>
  )
}

// =====================================================================
// KPIs — Server Component async (Suspense + skeleton enquanto carrega)
// =====================================================================
async function KpisGrid() {
  const supabase = createClient()
  const { inicioMes, fimMes } = mesAtualISO()

  const [statusFrota, viagensMes, financeiroMes] = await Promise.all([
    supabase
      .from('veiculos')
      .select('status')
      .returns<{ status: string }[]>(),
    supabase
      .from('viagens')
      .select('status')
      .gte('data_saida', inicioMes)
      .lte('data_saida', fimMes)
      .returns<{ status: string }[]>(),
    supabase
      .from('lancamentos_financeiros')
      .select('tipo, valor')
      .gte('data', inicioMes)
      .lte('data', fimMes)
      .returns<{ tipo: 'receita' | 'despesa'; valor: number }[]>(),
  ])

  const veiculos = statusFrota.data ?? []
  const veiculosAtivos        = veiculos.filter((v) => v.status === 'ativo').length
  const veiculosEmViagem      = veiculos.filter((v) => v.status === 'em_viagem').length
  const veiculosEmManutencao  = veiculos.filter((v) => v.status === 'em_manutencao').length

  const viagensConcluidas = (viagensMes.data ?? []).filter((v) => v.status === 'concluida').length

  let receitaMes = 0, despesaMes = 0
  for (const l of financeiroMes.data ?? []) {
    const v = Number(l.valor)
    if (l.tipo === 'receita') receitaMes += v
    else despesaMes += v
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      <KpiCard titulo="Veículos ativos" valor={veiculosAtivos}        icone={Truck}        variante="accent" subtitulo="Frota disponível" />
      <KpiCard titulo="Em viagem agora" valor={veiculosEmViagem}      icone={Route}        variante="brand"  subtitulo="Operações em curso" />
      <KpiCard titulo="Em manutenção"   valor={veiculosEmManutencao}  icone={Wrench}       variante="info"   subtitulo="Parados na oficina" />
      <KpiCard titulo="Viagens no mês"  valor={viagensConcluidas}     icone={CheckCircle2} variante="accent" subtitulo="Concluídas no período" />
      <KpiCard titulo="Receita do mês"  valor={formatCurrency(receitaMes)} icone={TrendingUp}   variante="accent" subtitulo="Fretes faturados" />
      <KpiCard titulo="Custo do mês"    valor={formatCurrency(despesaMes)} icone={TrendingDown} variante="danger" subtitulo="Despesas operacionais" />
    </div>
  )
}

function KpisGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {Array.from({ length: 6 }).map((_, i) => <KpiCardSkeleton key={i} />)}
    </div>
  )
}

// =====================================================================
function mesAtualISO() {
  const agora = new Date()
  const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1)
  const fim    = new Date(agora.getFullYear(), agora.getMonth() + 1, 0)
  return {
    inicioMes: inicio.toISOString().slice(0, 10),
    fimMes:    fim.toISOString().slice(0, 10),
  }
}
