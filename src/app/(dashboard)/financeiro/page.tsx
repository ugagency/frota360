import Link from 'next/link'
import { TrendingUp, TrendingDown, Equal, ChevronRight, type LucideIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PeriodoPicker } from '@/components/financeiro/periodo-picker'
import { BarrasReceitaDespesa, PizzaPorCategoria } from '@/components/financeiro/financeiro-charts'
import { FinanceiroFiltros } from '@/components/financeiro/financeiro-filtros'
import { LancamentosTabela, type LancamentoRow } from '@/components/financeiro/lancamentos-tabela'
import { LancamentoFormSheet } from '@/components/financeiro/lancamento-form-sheet'
import { formatCurrency, formatKm, cn } from '@/lib/utils'
import { CATEGORIA_LABEL } from '@/lib/validations/financeiro'

export const dynamic = 'force-dynamic'

type SearchParams = {
  de?: string; ate?: string
  q?: string; tipo?: string; categoria?: string; veiculo?: string
}

function mesAtualISO() {
  const d = new Date()
  return {
    de:  new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10),
    ate: new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10),
  }
}

const NOMES_MES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export default async function FinanceiroPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient()
  const def = mesAtualISO()
  const de  = searchParams.de  ?? def.de
  const ate = searchParams.ate ?? def.ate

  // Lançamentos do período
  let lancQuery = supabase
    .from('lancamentos_financeiros')
    .select('id, tipo, categoria, descricao, valor, data, veiculo_id, viagem_id, comprovante_url, veiculos(placa)')
    .gte('data', de).lte('data', ate)
    .order('data', { ascending: false })

  if (searchParams.tipo && searchParams.tipo !== 'todos') lancQuery = lancQuery.eq('tipo', searchParams.tipo)
  if (searchParams.categoria && searchParams.categoria !== 'todos') lancQuery = lancQuery.eq('categoria', searchParams.categoria)
  if (searchParams.veiculo && searchParams.veiculo !== 'todos') lancQuery = lancQuery.eq('veiculo_id', searchParams.veiculo)
  if (searchParams.q?.trim()) lancQuery = lancQuery.ilike('descricao', `%${searchParams.q.trim()}%`)

  // Últimos 6 meses para o gráfico
  const seisMesesAtras = new Date()
  seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 5)
  seisMesesAtras.setDate(1)
  const inicio6m = seisMesesAtras.toISOString().slice(0, 10)

  const [lanc, hist, todosLancsPeriodo, veiculosOpt, viagensOpt, todosVeiculos] = await Promise.all([
    lancQuery.returns<LancamentoRow[]>(),
    supabase.from('lancamentos_financeiros').select('tipo, valor, data').gte('data', inicio6m)
      .returns<{ tipo: 'receita' | 'despesa'; valor: number; data: string }[]>(),
    supabase.from('lancamentos_financeiros').select('tipo, valor, categoria, veiculo_id').gte('data', de).lte('data', ate)
      .returns<{ tipo: 'receita' | 'despesa'; valor: number; categoria: string; veiculo_id: string | null }[]>(),
    supabase.from('veiculos').select('id, placa').order('placa').returns<{ id: string; placa: string }[]>(),
    supabase.from('viagens').select('id, numero, veiculo_id').order('numero', { ascending: false })
      .returns<{ id: string; numero: string; veiculo_id: string }[]>(),
    supabase.from('veiculos').select('id, placa, modelo').order('placa')
      .returns<{ id: string; placa: string; modelo: string | null }[]>(),
  ])

  // Cards de resumo
  let receita = 0, despesa = 0
  for (const l of todosLancsPeriodo.data ?? []) {
    if (l.tipo === 'receita') receita += Number(l.valor)
    else despesa += Number(l.valor)
  }
  const resultado = receita - despesa
  const margem = receita > 0 ? (resultado / receita) * 100 : 0

  // Gráfico 6 meses
  const acumPorMes = new Map<string, { receita: number; despesa: number }>()
  for (const l of hist.data ?? []) {
    const d = new Date(l.data)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const cur = acumPorMes.get(key) ?? { receita: 0, despesa: 0 }
    if (l.tipo === 'receita') cur.receita += Number(l.valor)
    else cur.despesa += Number(l.valor)
    acumPorMes.set(key, cur)
  }
  const meses6: { mes: string; receita: number; despesa: number }[] = []
  const cursor = new Date(seisMesesAtras)
  for (let i = 0; i < 6; i++) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}`
    const v = acumPorMes.get(key) ?? { receita: 0, despesa: 0 }
    meses6.push({
      mes: `${NOMES_MES[cursor.getMonth()]}/${String(cursor.getFullYear()).slice(-2)}`,
      receita: Math.round(v.receita),
      despesa: Math.round(v.despesa),
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  // Pizza por categoria (só despesas do período)
  const despPorCat = new Map<string, number>()
  for (const l of todosLancsPeriodo.data ?? []) {
    if (l.tipo !== 'despesa') continue
    despPorCat.set(l.categoria, (despPorCat.get(l.categoria) ?? 0) + Number(l.valor))
  }
  const pieData = Array.from(despPorCat.entries()).map(([k, v]) => ({
    name: CATEGORIA_LABEL[k as keyof typeof CATEGORIA_LABEL] ?? k, value: Math.round(v),
  }))

  // Top 5 veículos com maior custo
  const custosPorVeic = new Map<string, { total: number; cats: Map<string, number> }>()
  for (const l of todosLancsPeriodo.data ?? []) {
    if (l.tipo !== 'despesa' || !l.veiculo_id) continue
    const cur = custosPorVeic.get(l.veiculo_id) ?? { total: 0, cats: new Map<string, number>() }
    cur.total += Number(l.valor)
    cur.cats.set(l.categoria, (cur.cats.get(l.categoria) ?? 0) + Number(l.valor))
    custosPorVeic.set(l.veiculo_id, cur)
  }

  // KM rodados por veículo (das viagens concluídas do período)
  const { data: viagensConcluidas } = await supabase
    .from('viagens')
    .select('veiculo_id, km_saida, km_chegada')
    .eq('status', 'concluida')
    .gte('data_chegada_real', de)
    .lte('data_chegada_real', `${ate}T23:59:59`)
    .returns<{ veiculo_id: string; km_saida: number | null; km_chegada: number | null }[]>()

  const kmPorVeic = new Map<string, number>()
  for (const v of viagensConcluidas ?? []) {
    if (v.km_saida == null || v.km_chegada == null) continue
    kmPorVeic.set(v.veiculo_id, (kmPorVeic.get(v.veiculo_id) ?? 0) + (Number(v.km_chegada) - Number(v.km_saida)))
  }

  const top5 = Array.from(custosPorVeic.entries())
    .map(([id, data]) => {
      const vei = (todosVeiculos.data ?? []).find((v) => v.id === id)
      const principalCat = Array.from(data.cats.entries()).sort((a, b) => b[1] - a[1])[0]
      const km = kmPorVeic.get(id) ?? 0
      return {
        id,
        placa: vei?.placa ?? '—',
        modelo: vei?.modelo ?? '',
        total: data.total,
        principalCat: principalCat ? CATEGORIA_LABEL[principalCat[0] as keyof typeof CATEGORIA_LABEL] ?? principalCat[0] : '—',
        custoPorKm: km > 0 ? data.total / km : 0,
      }
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  const veiculosOpts = (veiculosOpt.data ?? []).map((v) => ({ id: v.id, label: v.placa }))
  const viagensOpts = (viagensOpt.data ?? []).map((v) => ({ id: v.id, label: v.numero, veiculo_id: v.veiculo_id }))

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink leading-none">Financeiro</h1>
          <p className="mt-1.5 text-sm text-ink-muted font-mono">Período: {formatPeriodo(de, ate)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodoPicker />
          <LancamentoFormSheet mode="create" veiculos={veiculosOpts} viagens={viagensOpts} />
        </div>
      </header>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResumoCard label="Receita total" value={receita}  tone="brand"   icon={TrendingUp} />
        <ResumoCard label="Despesa total" value={despesa}  tone="accent"  icon={TrendingDown} />
        <ResumoCard
          label="Resultado"
          value={resultado}
          tone={resultado >= 0 ? 'success' : 'danger'}
          icon={resultado >= 0 ? TrendingUp : TrendingDown}
          extra={receita > 0 ? `Margem ${margem.toFixed(1)}%` : undefined}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="bg-app-card p-5 lg:col-span-3">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted mb-3">
            Receita × Despesa — últimos 6 meses
          </h3>
          <BarrasReceitaDespesa data={meses6} />
        </Card>
        <Card className="bg-app-card p-5 lg:col-span-2">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted mb-3">
            Despesas por categoria — período
          </h3>
          {pieData.length === 0 ? (
            <p className="text-sm text-ink-muted">Sem despesas no período.</p>
          ) : <PizzaPorCategoria data={pieData} />}
        </Card>
      </div>

      {/* Top 5 veículos */}
      <Card className="bg-app-card overflow-hidden">
        <div className="p-5 pb-2">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">
            Top 5 veículos com maior custo
          </h3>
        </div>
        {top5.length === 0 ? (
          <p className="p-5 pt-2 text-sm text-ink-muted">Sem custos por veículo no período.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-app-subtle/40 hover:bg-app-subtle/40">
                <TableHead className="font-mono text-[11px] uppercase text-ink-muted">Placa</TableHead>
                <TableHead className="font-mono text-[11px] uppercase text-ink-muted">Modelo</TableHead>
                <TableHead className="font-mono text-[11px] uppercase text-ink-muted text-right">Despesas</TableHead>
                <TableHead className="font-mono text-[11px] uppercase text-ink-muted">Principal categoria</TableHead>
                <TableHead className="font-mono text-[11px] uppercase text-ink-muted text-right">Custo/KM</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top5.map((v) => (
                <TableRow key={v.id} className="hover:bg-app-subtle/40">
                  <TableCell>
                    <Link href={`/frota/${v.id}`} className="font-mono font-bold text-brand-dark hover:underline">{v.placa}</Link>
                  </TableCell>
                  <TableCell className="text-sm text-ink-secondary">{v.modelo || '—'}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatCurrency(v.total)}</TableCell>
                  <TableCell className="text-sm">{v.principalCat}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{v.custoPorKm > 0 ? formatCurrency(v.custoPorKm) : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="p-3 border-t bg-app-subtle/20 text-right">
          <Link href="/financeiro/por-veiculo" className="text-xs text-brand hover:text-brand-dark inline-flex items-center gap-1">
            Relatório completo por veículo <ChevronRight size={12} />
          </Link>
        </div>
      </Card>

      {/* Lista de lançamentos */}
      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-ink">Lançamentos do período</h2>
        <FinanceiroFiltros veiculos={veiculosOpts} />
        <LancamentosTabela
          lancamentos={lanc.data ?? []}
          veiculos={veiculosOpts}
          viagens={viagensOpts}
        />
      </section>
    </div>
  )
}

function ResumoCard({ label, value, tone, icon: Icon, extra }: {
  label: string
  value: number
  tone: 'brand' | 'accent' | 'success' | 'danger'
  icon: LucideIcon
  extra?: string
}) {
  const colorMap = {
    brand:   'text-brand-dark',
    accent:  'text-accent',
    success: 'text-accent',
    danger:  'text-red-700',
  }
  const bgMap = {
    brand:   'bg-brand text-white',
    accent:  'bg-accent text-white',
    success: 'bg-accent text-white',
    danger:  'bg-red-600 text-white',
  }
  return (
    <Card className="p-6 bg-app-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-mono uppercase tracking-wider text-ink-muted">{label}</div>
          <div className={cn('mt-2 font-display text-4xl font-bold tabular-nums leading-none', colorMap[tone])}>
            {formatCurrency(value)}
          </div>
          {extra && <div className="mt-2 text-xs font-mono text-ink-secondary">{extra}</div>}
        </div>
        <span className={cn('shrink-0 inline-flex items-center justify-center rounded-md h-10 w-10', bgMap[tone])}>
          <Icon size={20} />
        </span>
      </div>
    </Card>
  )
}

function formatPeriodo(de: string, ate: string) {
  const d = new Date(de), a = new Date(ate)
  return `${d.toLocaleDateString('pt-BR')} — ${a.toLocaleDateString('pt-BR')}`
}

// suprime warning de ícone não usado quando resultado=0
void Equal
