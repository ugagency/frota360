import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PeriodoPicker } from '@/components/financeiro/periodo-picker'
import { ExportCsvButton, PrintButton } from '@/components/relatorios/export-button'
import { AreaPorCategoria } from '@/components/relatorios/charts'
import { formatCurrency, formatKm } from '@/lib/utils'
import { CATEGORIA_LABEL } from '@/lib/validations/financeiro'

export const dynamic = 'force-dynamic'

type SearchParams = { de?: string; ate?: string }

function mesAtual() {
  const d = new Date()
  return {
    de: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10),
    ate: new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10),
  }
}

const CATEGORIA_COLORS: Record<string, string> = {
  combustivel: '#E8871E',
  manutencao:  '#1E9E6A',
  pedagio:     '#2563EB',
  multa:       '#DC2626',
  adiantamento:'#7C3AED',
  outros:      '#6E695C',
}

const NOMES_MES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// Benchmark do setor (TCU/CNT 2024) - texto fixo
const CUSTO_KM_SETOR = 4.85

export default async function RelatorioCustosPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient()
  const def = mesAtual()
  const de = searchParams.de ?? def.de
  const ate = searchParams.ate ?? def.ate

  // Janela de 6 meses pra gráfico de área (mesmo se período menor)
  const seisMeses = new Date()
  seisMeses.setMonth(seisMeses.getMonth() - 5)
  seisMeses.setDate(1)
  const inicio6m = seisMeses.toISOString().slice(0, 10)

  const [periodo, hist, viagensRes] = await Promise.all([
    supabase.from('lancamentos_financeiros').select('tipo, categoria, valor').gte('data', de).lte('data', ate)
      .returns<{ tipo: 'receita' | 'despesa'; categoria: string; valor: number }[]>(),
    supabase.from('lancamentos_financeiros').select('tipo, categoria, valor, data').gte('data', inicio6m)
      .returns<{ tipo: 'receita' | 'despesa'; categoria: string; valor: number; data: string }[]>(),
    supabase.from('viagens').select('km_saida, km_chegada').eq('status', 'concluida')
      .gte('data_chegada_real', de).lte('data_chegada_real', `${ate}T23:59:59`)
      .returns<{ km_saida: number | null; km_chegada: number | null }[]>(),
  ])

  // DRE
  let receitas = 0, despesas = 0
  for (const l of periodo.data ?? []) {
    if (l.tipo === 'receita') receitas += Number(l.valor)
    else despesas += Number(l.valor)
  }
  const resultado = receitas - despesas
  const margem = receitas > 0 ? (resultado / receitas) * 100 : 0

  // Breakdown
  const breakdownMap = new Map<string, number>()
  for (const l of periodo.data ?? []) {
    if (l.tipo !== 'despesa') continue
    breakdownMap.set(l.categoria, (breakdownMap.get(l.categoria) ?? 0) + Number(l.valor))
  }
  const breakdown = Array.from(breakdownMap.entries())
    .map(([k, v]) => ({
      categoria: CATEGORIA_LABEL[k as keyof typeof CATEGORIA_LABEL] ?? k,
      categoriaKey: k,
      valor: v,
      pct: despesas > 0 ? (v / despesas) * 100 : 0,
    }))
    .sort((a, b) => b.valor - a.valor)

  // Evolução mensal por categoria (6m)
  type MesBucket = { mes: string } & Record<string, number | string>
  const mesesBucket = new Map<string, MesBucket>()
  const cursor = new Date(seisMeses)
  for (let i = 0; i < 6; i++) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}`
    mesesBucket.set(key, { mes: `${NOMES_MES[cursor.getMonth()]}/${String(cursor.getFullYear()).slice(-2)}` })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  for (const l of hist.data ?? []) {
    if (l.tipo !== 'despesa') continue
    const d = new Date(l.data)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const cur = mesesBucket.get(key)
    if (!cur) continue
    cur[l.categoria] = ((cur[l.categoria] as number) ?? 0) + Number(l.valor)
  }
  const areaData = Array.from(mesesBucket.values())

  // KM total → custo/km
  let kmTotal = 0
  for (const v of viagensRes.data ?? []) {
    if (v.km_saida != null && v.km_chegada != null) kmTotal += Number(v.km_chegada) - Number(v.km_saida)
  }
  const custoPorKm = kmTotal > 0 ? despesas / kmTotal : 0

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-xs text-ink-muted print:hidden">
        <Link href="/relatorios" className="hover:text-ink">Relatórios</Link>
        <ChevronRight size={12} />
        <span className="text-ink">Custos</span>
      </nav>

      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink leading-none">Relatório de Custos</h1>
          <p className="mt-1.5 text-sm text-ink-muted font-mono">{de} → {ate}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <PeriodoPicker />
          <PrintButton />
          <ExportCsvButton
            data={breakdown.map((b) => ({ ...b, pctStr: `${b.pct.toFixed(1)}%` }))}
            filename={`custos-categoria-${de}_${ate}`}
            columns={[
              { header: 'Categoria',  key: 'categoria' },
              { header: 'Valor',      key: 'valor', format: 'currency' },
              { header: '% do total', key: 'pctStr' },
            ]}
          />
        </div>
      </header>

      {/* DRE simplificado */}
      <Card className="bg-app-card p-6">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted mb-4">DRE Simplificado</h3>
        <dl className="space-y-2">
          <DreRow label="Receitas totais" value={receitas} tone="accent" />
          <DreRow label="(-) Despesas totais" value={despesas} tone="danger" />
          <div className="border-t pt-2">
            <DreRow label="(=) Resultado operacional" value={resultado} tone={resultado >= 0 ? 'accent' : 'danger'} bold />
          </div>
          <div className="flex justify-between text-sm pt-1">
            <dt className="text-ink-secondary">Margem</dt>
            <dd className={`font-mono font-bold ${margem >= 0 ? 'text-accent' : 'text-red-700'}`}>{margem.toFixed(1)}%</dd>
          </div>
        </dl>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-app-card overflow-hidden">
          <div className="p-5 pb-2">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">Breakdown de despesas</h3>
          </div>
          {breakdown.length === 0 ? (
            <p className="p-5 pt-2 text-sm text-ink-muted">Sem despesas no período.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-app-subtle/40 hover:bg-app-subtle/40">
                  <TableHead className="font-mono text-[11px] uppercase text-ink-muted">Categoria</TableHead>
                  <TableHead className="font-mono text-[11px] uppercase text-ink-muted text-right">Valor</TableHead>
                  <TableHead className="font-mono text-[11px] uppercase text-ink-muted text-right">% do total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {breakdown.map((b) => (
                  <TableRow key={b.categoriaKey}>
                    <TableCell>
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORIA_COLORS[b.categoriaKey] ?? '#6E695C' }} />
                        {b.categoria}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(b.valor)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{b.pct.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="bg-app-card p-5">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted mb-3">Evolução por categoria — 6 meses</h3>
          <AreaPorCategoria
            data={areaData}
            series={breakdown.map((b) => ({
              key: b.categoriaKey,
              nome: b.categoria,
              cor: CATEGORIA_COLORS[b.categoriaKey] ?? '#6E695C',
            }))}
          />
        </Card>
      </div>

      {/* Custo / KM */}
      <Card className="bg-app-card p-6">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted mb-3">Custo / KM da frota</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Stat label="KM rodados" value={formatKm(kmTotal)} />
          <Stat label="Despesas totais" value={formatCurrency(despesas)} />
          <Stat
            label="Custo / KM"
            value={kmTotal > 0 ? formatCurrency(custoPorKm) : '—'}
            highlight={kmTotal > 0 ? (custoPorKm <= CUSTO_KM_SETOR ? 'accent' : 'danger') : 'neutral'}
          />
        </div>
        <p className="mt-4 text-xs text-ink-muted border-t pt-3">
          Benchmark de referência do setor: <span className="font-mono">{formatCurrency(CUSTO_KM_SETOR)}/km</span> (variável conforme tipo de operação e perfil de frota).
        </p>
      </Card>
    </div>
  )
}

function DreRow({ label, value, tone, bold = false }: { label: string; value: number; tone: 'accent' | 'danger'; bold?: boolean }) {
  return (
    <div className="flex justify-between items-baseline">
      <dt className={`text-sm ${bold ? 'font-medium text-ink' : 'text-ink-secondary'}`}>{label}</dt>
      <dd className={`font-display tabular-nums ${bold ? 'text-2xl font-bold' : 'text-lg font-semibold'} ${tone === 'accent' ? 'text-accent' : 'text-red-700'}`}>
        {formatCurrency(value)}
      </dd>
    </div>
  )
}

function Stat({ label, value, highlight = 'neutral' }: { label: string; value: string; highlight?: 'neutral' | 'accent' | 'danger' }) {
  const color = highlight === 'accent' ? 'text-accent' : highlight === 'danger' ? 'text-red-700' : 'text-ink'
  return (
    <div>
      <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">{label}</div>
      <div className={`mt-1.5 font-display text-2xl font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  )
}
