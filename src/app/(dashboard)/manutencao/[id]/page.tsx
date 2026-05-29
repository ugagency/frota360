import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, Truck, Calendar as CalendarIcon, Wallet } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge, type StatusValue } from '@/components/ui/status-badge'
import { ManutencaoFormSheet } from '@/components/manutencao/manutencao-form-sheet'
import { ConcluirManutencaoModal } from '@/components/manutencao/concluir-manutencao-modal'
import { UploadLaudo } from '@/components/manutencao/upload-laudo'
import { formatCurrency, formatDate, formatKm } from '@/lib/utils'
import { TIPO_LABELS, type ManutencaoFormData } from '@/lib/validations/manutencao'
import type { VeiculoOption } from '@/components/manutencao/manutencao-form'

export const dynamic = 'force-dynamic'

type Item = { descricao: string; valor: number }

type ManutencaoDetalhe = {
  id: string
  transportadora_id: string
  tipo: 'preventiva' | 'corretiva'
  descricao: string
  oficina: string | null
  mecanico: string | null
  km_na_manutencao: number | null
  km_proxima: number | null
  data_entrada: string
  data_saida: string | null
  data_proxima: string | null
  status: StatusValue
  itens: Item[] | null
  valor_total: number
  laudo_url: string | null
  veiculos: { id: string; placa: string; modelo: string | null; km_atual: number; status: string } | null
}

export default async function ManutencaoDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: m } = await supabase
    .from('manutencoes')
    .select(`
      id, transportadora_id, tipo, descricao, oficina, mecanico,
      km_na_manutencao, km_proxima, data_entrada, data_saida, data_proxima,
      status, itens, valor_total, laudo_url,
      veiculos(id, placa, modelo, km_atual, status)
    `)
    .eq('id', params.id)
    .returns<ManutencaoDetalhe[]>()
    .maybeSingle()

  if (!m) notFound()

  const itens = m.itens ?? []
  const podeEditar = m.status !== 'concluida'

  const veiculosRes = podeEditar
    ? await supabase.from('veiculos').select('id, placa, modelo, km_atual, status').order('placa').returns<VeiculoOption[]>()
    : { data: [] as VeiculoOption[] }

  const formData: Partial<ManutencaoFormData> & { id: string } = {
    id: m.id,
    veiculo_id: m.veiculos?.id,
    tipo: m.tipo,
    descricao: m.descricao,
    oficina: m.oficina,
    mecanico: m.mecanico,
    km_na_manutencao: m.km_na_manutencao,
    data_entrada: m.data_entrada,
    data_saida: m.data_saida,
    km_proxima: m.km_proxima,
    data_proxima: m.data_proxima,
    itens,
  }

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-xs text-ink-muted">
        <Link href="/manutencao" className="hover:text-ink">Manutenção</Link>
        <ChevronRight size={12} />
        <span className="text-ink font-mono">{m.veiculos?.placa ?? '—'}</span>
      </nav>

      {/* Header */}
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold text-ink leading-none">
              {m.veiculos?.placa ?? 'Veículo removido'}
            </h1>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase border ${
              m.tipo === 'preventiva'
                ? 'bg-brand-surface text-brand-dark border-brand-border'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>{TIPO_LABELS[m.tipo].toUpperCase()}</span>
            <StatusBadge status={m.status} />
          </div>
          <p className="text-sm text-ink-secondary max-w-2xl">{m.descricao}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <UploadLaudo manutencaoId={m.id} transportadoraId={m.transportadora_id} laudoUrl={m.laudo_url} />
          {podeEditar && <ManutencaoFormSheet mode="edit" veiculos={veiculosRes.data ?? []} manutencao={formData} />}
          {m.status === 'em_andamento' && (
            <ConcluirManutencaoModal manutencaoId={m.id} valorAtual={Number(m.valor_total)} />
          )}
        </div>
      </header>

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 bg-app-card">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-3"><Truck size={12} /> Veículo</div>
          {m.veiculos ? (
            <>
              <div className="font-mono font-bold text-xl text-brand-dark leading-none">{m.veiculos.placa}</div>
              {m.veiculos.modelo && <div className="text-sm text-ink-secondary mt-1">{m.veiculos.modelo}</div>}
              <div className="mt-3 text-xs font-mono text-ink-muted">
                KM na entrada: <span className="text-ink">{m.km_na_manutencao != null ? formatKm(m.km_na_manutencao) : '—'}</span>
              </div>
              <Link href={`/frota/${m.veiculos.id}`} className="mt-3 inline-flex items-center gap-1 text-xs text-brand hover:text-brand-dark">
                Ver veículo <ChevronRight size={12} />
              </Link>
            </>
          ) : <p className="text-sm text-ink-muted">Veículo removido.</p>}
        </Card>

        <Card className="p-5 bg-app-card">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-3"><CalendarIcon size={12} /> Período</div>
          <dl className="space-y-1.5 text-sm">
            <Row label="Entrada"        value={formatDate(m.data_entrada)} />
            <Row label="Saída"          value={m.data_saida ? formatDate(m.data_saida) : <span className="text-yellow-700">Em andamento</span>} />
            <Row label="Próx. revisão"  value={m.data_proxima ? formatDate(m.data_proxima) : '—'} />
            <Row label="KM próxima"     value={m.km_proxima != null ? formatKm(m.km_proxima) : '—'} />
          </dl>
        </Card>

        <Card className="p-5 bg-app-card">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-3"><Wallet size={12} /> Custo</div>
          <div className="font-display text-3xl font-bold text-brand-dark tabular-nums">{formatCurrency(Number(m.valor_total))}</div>
          <div className="mt-2 text-xs text-ink-muted">
            {itens.length} {itens.length === 1 ? 'item de serviço' : 'itens de serviço'}
          </div>
          {m.oficina && <div className="mt-3 text-xs text-ink-secondary">Oficina: {m.oficina}</div>}
          {m.mecanico && <div className="text-xs text-ink-secondary">Mecânico: {m.mecanico}</div>}
        </Card>
      </div>

      {/* Itens de serviço */}
      <Card className="bg-app-card overflow-hidden">
        <div className="p-5 pb-2">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">Itens de serviço</h3>
        </div>
        {itens.length === 0 ? (
          <p className="p-5 pt-2 text-sm text-ink-muted">Nenhum item registrado.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-app-subtle/40 hover:bg-app-subtle/40">
                <TableHead className="font-mono text-[11px] uppercase text-ink-muted">Descrição</TableHead>
                <TableHead className="font-mono text-[11px] uppercase text-ink-muted text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens.map((it, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">{it.descricao}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatCurrency(Number(it.valor))}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-app-subtle/60 hover:bg-app-subtle/60">
                <TableCell className="font-display font-semibold text-ink">TOTAL</TableCell>
                <TableCell className="text-right font-mono font-bold text-base text-brand-dark">{formatCurrency(Number(m.valor_total))}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-ink font-mono text-xs">{value}</dd>
    </div>
  )
}
