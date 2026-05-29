import Link from 'next/link'
import { ChevronRight, Route, ArrowRight } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PeriodoPicker } from '@/components/financeiro/periodo-picker'
import { ExportCsvButton, PrintButton } from '@/components/relatorios/export-button'
import { LinhaPorSemana } from '@/components/relatorios/charts'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { StatusBadge, type StatusValue } from '@/components/ui/status-badge'
import { formatCurrency, formatDate, formatKm } from '@/lib/utils'

export const dynamic = 'force-dynamic'

type SearchParams = { de?: string; ate?: string }

function mesAtual() {
  const d = new Date()
  return {
    de: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10),
    ate: new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10),
  }
}

type ViagemRow = {
  id: string
  numero: string
  origem: string
  destino: string
  cliente: string | null
  data_saida: string | null
  data_chegada_real: string | null
  km_saida: number | null
  km_chegada: number | null
  valor_frete: number | null
  status: StatusValue
  veiculos: { placa: string } | null
  motoristas: { nome: string } | null
}

export default async function RelatorioViagensPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient()
  const def = mesAtual()
  const de  = searchParams.de  ?? def.de
  const ate = searchParams.ate ?? def.ate

  const { data: viagens } = await supabase
    .from('viagens')
    .select('id, numero, origem, destino, cliente, data_saida, data_chegada_real, km_saida, km_chegada, valor_frete, status, veiculos(placa), motoristas(nome)')
    .gte('data_saida', de).lte('data_saida', `${ate}T23:59:59`)
    .order('data_saida', { ascending: false })
    .returns<ViagemRow[]>()

  const list = viagens ?? []
  const concluidas = list.filter((v) => v.status === 'concluida')

  // KPIs
  let kmTotal = 0, freteTotal = 0, somaDias = 0, countDias = 0
  for (const v of concluidas) {
    if (v.km_saida != null && v.km_chegada != null) kmTotal += Number(v.km_chegada) - Number(v.km_saida)
    if (v.valor_frete != null) freteTotal += Number(v.valor_frete)
    if (v.data_saida && v.data_chegada_real) {
      const dias = (new Date(v.data_chegada_real).getTime() - new Date(v.data_saida).getTime()) / 86_400_000
      if (dias > 0) { somaDias += dias; countDias++ }
    }
  }
  const ticketMedio = concluidas.length > 0 ? freteTotal / concluidas.length : 0
  const tempoMedio = countDias > 0 ? somaDias / countDias : 0

  // Viagens por semana
  const porSemana = new Map<string, number>()
  for (const v of list) {
    if (!v.data_saida) continue
    const d = new Date(v.data_saida)
    const jan1 = new Date(d.getFullYear(), 0, 1)
    const dias = Math.floor((d.getTime() - jan1.getTime()) / 86_400_000)
    const sem = Math.ceil((dias + jan1.getDay() + 1) / 7)
    const k = `S${String(sem).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`
    porSemana.set(k, (porSemana.get(k) ?? 0) + 1)
  }
  const semanasData = Array.from(porSemana.entries()).map(([k, v]) => ({ semana: k, viagens: v })).reverse()

  // Top 5 rotas
  const rotasMap = new Map<string, number>()
  for (const v of list) {
    const k = `${v.origem} → ${v.destino}`
    rotasMap.set(k, (rotasMap.get(k) ?? 0) + 1)
  }
  const topRotas = Array.from(rotasMap.entries()).map(([k, v]) => ({ rota: k, viagens: v }))
    .sort((a, b) => b.viagens - a.viagens).slice(0, 5)

  // Top 5 clientes
  const clientesMap = new Map<string, number>()
  for (const v of concluidas) {
    if (!v.cliente) continue
    clientesMap.set(v.cliente, (clientesMap.get(v.cliente) ?? 0) + Number(v.valor_frete ?? 0))
  }
  const topClientes = Array.from(clientesMap.entries()).map(([k, v]) => ({ cliente: k, frete: v }))
    .sort((a, b) => b.frete - a.frete).slice(0, 5)

  // Pré-flatten relações pra CSV (funções não cruzam server→client)
  const exportList = list.map((v) => ({
    numero: v.numero,
    origem: v.origem,
    destino: v.destino,
    cliente: v.cliente,
    veiculo: v.veiculos?.placa ?? '',
    motorista: v.motoristas?.nome ?? '',
    data_saida: v.data_saida,
    data_chegada_real: v.data_chegada_real,
    valor_frete: v.valor_frete,
    status: v.status,
  }))

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-xs text-ink-muted print:hidden">
        <Link href="/relatorios" className="hover:text-ink">Relatórios</Link>
        <ChevronRight size={12} />
        <span className="text-ink">Viagens</span>
      </nav>

      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink leading-none">Relatório de Viagens</h1>
          <p className="mt-1.5 text-sm text-ink-muted font-mono">{de} → {ate}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <PeriodoPicker />
          <PrintButton />
          <ExportCsvButton
            data={exportList} filename={`viagens-${de}_${ate}`}
            columns={[
              { header: 'Número', key: 'numero' },
              { header: 'Origem', key: 'origem' },
              { header: 'Destino', key: 'destino' },
              { header: 'Cliente', key: 'cliente' },
              { header: 'Veículo', key: 'veiculo' },
              { header: 'Motorista', key: 'motorista' },
              { header: 'Saída', key: 'data_saida', format: 'date' },
              { header: 'Chegada real', key: 'data_chegada_real', format: 'date' },
              { header: 'Frete', key: 'valor_frete', format: 'currency' },
              { header: 'Status', key: 'status' },
            ]}
          />
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard titulo="Viagens"        valor={list.length}                          icone={Route} variante="brand" />
        <KpiCard titulo="KM total"       valor={formatKm(kmTotal)}                    icone={Route} variante="accent" />
        <KpiCard titulo="Frete total"    valor={formatCurrency(freteTotal)}           icone={Route} variante="accent" />
        <KpiCard titulo="Ticket médio"   valor={formatCurrency(ticketMedio)}          icone={Route} variante="info" />
        <KpiCard titulo="Tempo médio"    valor={tempoMedio > 0 ? `${tempoMedio.toFixed(1)} d` : '—'} icone={Route} variante="neutral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-app-card p-5">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted mb-3">Viagens por semana</h3>
          <LinhaPorSemana data={semanasData} />
        </Card>

        <div className="space-y-4">
          <Card className="bg-app-card p-5">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted mb-3">Top 5 rotas</h3>
            {topRotas.length === 0 ? <p className="text-sm text-ink-muted">Sem rotas no período.</p> : (
              <ul className="space-y-2">
                {topRotas.map((r) => (
                  <li key={r.rota} className="flex items-center justify-between text-sm">
                    <span className="truncate text-ink">{r.rota}</span>
                    <span className="font-mono font-bold text-brand-dark">{r.viagens}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="bg-app-card p-5">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted mb-3">Top 5 clientes</h3>
            {topClientes.length === 0 ? <p className="text-sm text-ink-muted">Sem clientes registrados.</p> : (
              <ul className="space-y-2">
                {topClientes.map((c) => (
                  <li key={c.cliente} className="flex items-center justify-between text-sm">
                    <span className="truncate text-ink">{c.cliente}</span>
                    <span className="font-mono font-bold text-accent">{formatCurrency(c.frete)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card className="bg-app-card overflow-hidden">
        <div className="p-5 pb-2">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">Todas as viagens</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-app-subtle/40 hover:bg-app-subtle/40">
              {['Nº', 'Veículo', 'Motorista', 'Rota', 'Saída', 'Frete', 'Status'].map((h, i) => (
                <TableHead key={i} className={`font-mono text-[11px] uppercase text-ink-muted ${h === 'Frete' ? 'text-right' : ''}`}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.slice(0, 100).map((v) => (
              <TableRow key={v.id} className="hover:bg-app-subtle/40">
                <TableCell><Link href={`/viagens/${v.id}`} className="font-mono font-bold text-brand-dark hover:underline">{v.numero}</Link></TableCell>
                <TableCell className="font-mono text-sm">{v.veiculos?.placa ?? '—'}</TableCell>
                <TableCell className="text-sm">{v.motoristas?.nome ?? '—'}</TableCell>
                <TableCell><div className="flex items-center gap-1.5 text-xs"><span className="truncate max-w-[120px]">{v.origem}</span><ArrowRight size={11} className="text-ink-muted shrink-0" /><span className="truncate max-w-[120px]">{v.destino}</span></div></TableCell>
                <TableCell className="font-mono text-xs">{v.data_saida ? formatDate(v.data_saida) : '—'}</TableCell>
                <TableCell className="text-right font-mono text-sm">{v.valor_frete != null ? formatCurrency(Number(v.valor_frete)) : '—'}</TableCell>
                <TableCell><StatusBadge status={v.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
