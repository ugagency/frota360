import Link from 'next/link'
import { ChevronRight, Truck } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PeriodoPicker } from '@/components/financeiro/periodo-picker'
import { ExportCsvButton, PrintButton } from '@/components/relatorios/export-button'
import { BarrasPorTipo } from '@/components/relatorios/charts'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { TIPO_LABELS } from '@/lib/validations/veiculo'
import { formatKm } from '@/lib/utils'

export const dynamic = 'force-dynamic'

type SearchParams = { de?: string; ate?: string }

function mesAtual() {
  const d = new Date()
  return {
    de: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10),
    ate: new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10),
  }
}

const DIAS_SEM_MOVIMENTO = 15

export default async function RelatorioFrotaPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient()
  const def = mesAtual()
  const de  = searchParams.de  ?? def.de
  const ate = searchParams.ate ?? def.ate
  const diasPeriodo = Math.max(1, Math.ceil((new Date(ate).getTime() - new Date(de).getTime()) / 86_400_000) + 1)

  const [veiculos, viagens, manutencoes] = await Promise.all([
    supabase.from('veiculos').select('id, placa, modelo, tipo, status').order('placa')
      .returns<{ id: string; placa: string; modelo: string | null; tipo: keyof typeof TIPO_LABELS; status: string }[]>(),
    supabase.from('viagens')
      .select('veiculo_id, status, km_saida, km_chegada, data_saida, data_chegada_real')
      .gte('data_saida', de).lte('data_saida', `${ate}T23:59:59`)
      .returns<{ veiculo_id: string; status: string; km_saida: number | null; km_chegada: number | null; data_saida: string | null; data_chegada_real: string | null }[]>(),
    supabase.from('manutencoes')
      .select('veiculo_id, data_entrada, data_saida')
      .gte('data_entrada', de).lte('data_entrada', ate)
      .returns<{ veiculo_id: string; data_entrada: string; data_saida: string | null }[]>(),
  ])

  const allVeiculos = veiculos.data ?? []

  // KPIs
  const counts = { total: allVeiculos.length, ativo: 0, em_viagem: 0, em_manutencao: 0, inativo: 0 }
  for (const v of allVeiculos) counts[v.status as keyof typeof counts] = (counts[v.status as keyof typeof counts] as number) + 1

  // Distribuição por tipo
  const porTipo = new Map<string, number>()
  for (const v of allVeiculos) porTipo.set(v.tipo, (porTipo.get(v.tipo) ?? 0) + 1)
  const tipoData = Array.from(porTipo.entries()).map(([k, v]) => ({ tipo: TIPO_LABELS[k as keyof typeof TIPO_LABELS] ?? k, total: v }))

  // Utilização por veículo
  const utilizacao = allVeiculos.map((v) => {
    const viagensV = (viagens.data ?? []).filter((x) => x.veiculo_id === v.id)
    const kmRodados = viagensV.reduce((acc, x) =>
      (x.km_saida != null && x.km_chegada != null) ? acc + (Number(x.km_chegada) - Number(x.km_saida)) : acc, 0)
    const diasViagem = new Set<string>()
    for (const x of viagensV) {
      if (!x.data_saida) continue
      const inicio = new Date(x.data_saida)
      const fim = x.data_chegada_real ? new Date(x.data_chegada_real) : new Date()
      for (let d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
        diasViagem.add(d.toISOString().slice(0, 10))
      }
    }
    const manutV = (manutencoes.data ?? []).filter((m) => m.veiculo_id === v.id)
    const diasManut = new Set<string>()
    for (const m of manutV) {
      const inicio = new Date(m.data_entrada)
      const fim = m.data_saida ? new Date(m.data_saida) : new Date()
      for (let d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
        diasManut.add(d.toISOString().slice(0, 10))
      }
    }
    const diasUtilizado = diasViagem.size
    const diasParado = Math.max(0, diasPeriodo - diasUtilizado - diasManut.size)
    const pctUtil = (diasUtilizado / diasPeriodo) * 100
    return {
      veiculo_id: v.id, placa: v.placa, modelo: v.modelo,
      kmRodados, diasViagem: diasUtilizado, diasManutencao: diasManut.size, diasParado,
      pctUtil,
    }
  })

  // Sem movimento (X dias)
  const hoje = new Date()
  const limite = new Date(hoje.getTime() - DIAS_SEM_MOVIMENTO * 86_400_000)
  const semMovIds = new Set(allVeiculos.map((v) => v.id))
  for (const v of viagens.data ?? []) {
    if (v.status === 'concluida' && v.data_chegada_real && new Date(v.data_chegada_real) >= limite) {
      semMovIds.delete(v.veiculo_id)
    }
  }
  const semMovimento = allVeiculos.filter((v) => semMovIds.has(v.id) && v.status !== 'inativo')

  // Pré-formata pra exportação CSV (funções não atravessam server→client)
  const exportUtilizacao = utilizacao.map((u) => ({
    ...u,
    pctUtilStr: `${u.pctUtil.toFixed(1)}%`,
  }))

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-xs text-ink-muted print:hidden">
        <Link href="/relatorios" className="hover:text-ink">Relatórios</Link>
        <ChevronRight size={12} />
        <span className="text-ink">Frota</span>
      </nav>

      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink leading-none">Relatório de Frota</h1>
          <p className="mt-1.5 text-sm text-ink-muted font-mono">{de} → {ate} · {diasPeriodo} dias</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <PeriodoPicker />
          <PrintButton />
          <ExportCsvButton
            data={exportUtilizacao} filename={`utilizacao-frota-${de}_${ate}`}
            columns={[
              { header: 'Placa', key: 'placa' },
              { header: 'Modelo', key: 'modelo' },
              { header: 'KM Rodados', key: 'kmRodados', format: 'number' },
              { header: 'Dias em Viagem', key: 'diasViagem', format: 'number' },
              { header: 'Dias em Manutenção', key: 'diasManutencao', format: 'number' },
              { header: 'Dias Parado', key: 'diasParado', format: 'number' },
              { header: '% Utilização', key: 'pctUtilStr' },
            ]}
          />
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard titulo="Total" valor={counts.total} icone={Truck} variante="neutral" />
        <KpiCard titulo="Ativos" valor={counts.ativo} icone={Truck} variante="accent" />
        <KpiCard titulo="Em viagem" valor={counts.em_viagem} icone={Truck} variante="brand" />
        <KpiCard titulo="Em manutenção" valor={counts.em_manutencao} icone={Truck} variante="info" />
        <KpiCard titulo="Inativos" valor={counts.inativo} icone={Truck} variante="danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-app-card p-5 lg:col-span-1">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted mb-3">Por tipo de veículo</h3>
          <BarrasPorTipo data={tipoData} />
        </Card>

        <Card className="bg-app-card p-5 lg:col-span-2">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted mb-3">
            Sem movimento nos últimos {DIAS_SEM_MOVIMENTO} dias
          </h3>
          {semMovimento.length === 0 ? (
            <p className="text-sm text-ink-muted">Toda a frota teve viagem concluída no período.</p>
          ) : (
            <ul className="space-y-1.5">
              {semMovimento.map((v) => (
                <li key={v.id} className="flex items-center justify-between text-sm border-b pb-1.5">
                  <Link href={`/frota/${v.id}`} className="font-mono font-bold text-brand-dark hover:underline">{v.placa}</Link>
                  <span className="text-ink-secondary">{v.modelo ?? '—'}</span>
                  <span className="text-xs text-ink-muted">{v.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="bg-app-card overflow-hidden">
        <div className="p-5 pb-2">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">Utilização por veículo</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-app-subtle/40 hover:bg-app-subtle/40">
              {['Placa', 'Modelo', 'KM rodados', 'Dias em viagem', 'Dias em manutenção', 'Dias parado', '% Util.'].map((h, i) => (
                <TableHead key={i} className={`font-mono text-[11px] uppercase text-ink-muted ${i >= 2 ? 'text-right' : ''}`}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {utilizacao.map((u) => (
              <TableRow key={u.veiculo_id} className="hover:bg-app-subtle/40">
                <TableCell><Link href={`/frota/${u.veiculo_id}`} className="font-mono font-bold text-brand-dark hover:underline">{u.placa}</Link></TableCell>
                <TableCell className="text-sm text-ink-secondary">{u.modelo ?? '—'}</TableCell>
                <TableCell className="text-right font-mono text-sm">{u.kmRodados > 0 ? formatKm(u.kmRodados) : '—'}</TableCell>
                <TableCell className="text-right font-mono text-sm">{u.diasViagem}</TableCell>
                <TableCell className="text-right font-mono text-sm">{u.diasManutencao}</TableCell>
                <TableCell className="text-right font-mono text-sm">{u.diasParado}</TableCell>
                <TableCell className="text-right font-mono text-sm font-bold">{u.pctUtil.toFixed(1)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
