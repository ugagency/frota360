import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge, type StatusValue } from '@/components/ui/status-badge'

import { VeiculoFormSheet } from '@/components/frota/veiculo-form-sheet'
import { AtualizarKmModal } from '@/components/frota/atualizar-km-modal'
import { VisaoGeralTab } from '@/components/frota/tabs/visao-geral'
import { ViagensVeiculoTab } from '@/components/frota/tabs/viagens-veiculo'
import { ManutencoesVeiculoTab } from '@/components/frota/tabs/manutencoes-veiculo'
import { FinanceiroVeiculoTab } from '@/components/frota/tabs/financeiro-veiculo'

import { formatKm } from '@/lib/utils'
import { TIPO_LABELS, PROPRIETARIO_LABELS, type VeiculoFormData } from '@/lib/validations/veiculo'

export const dynamic = 'force-dynamic'

type VeiculoCompleto = {
  id: string
  placa: string
  tipo: keyof typeof TIPO_LABELS
  proprietario: 'proprio' | 'agregado'
  marca: string | null
  modelo: string | null
  ano: number | null
  cor: string | null
  renavam: string | null
  chassi: string | null
  km_atual: number
  km_proxima_revisao: number | null
  data_proxima_revisao: string | null
  data_licenciamento: string | null
  status: StatusValue
  observacoes: string | null
}

export default async function VeiculoDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: veiculo } = await supabase
    .from('veiculos')
    .select('id, placa, tipo, proprietario, marca, modelo, ano, cor, renavam, chassi, km_atual, km_proxima_revisao, data_proxima_revisao, data_licenciamento, status, observacoes')
    .eq('id', params.id)
    .returns<VeiculoCompleto[]>()
    .maybeSingle()

  if (!veiculo) notFound()

  // Dados para o form de edição (subset compatível com VeiculoFormData)
  const veiculoFormData: Partial<VeiculoFormData> & { id: string } = {
    id: veiculo.id,
    placa: veiculo.placa,
    tipo: veiculo.tipo,
    proprietario: veiculo.proprietario,
    marca: veiculo.marca,
    modelo: veiculo.modelo,
    ano: veiculo.ano,
    cor: veiculo.cor,
    renavam: veiculo.renavam,
    chassi: veiculo.chassi,
    km_atual: veiculo.km_atual,
    km_proxima_revisao: veiculo.km_proxima_revisao,
    data_proxima_revisao: veiculo.data_proxima_revisao,
    data_licenciamento: veiculo.data_licenciamento,
    observacoes: veiculo.observacoes,
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-ink-muted">
        <Link href="/frota" className="hover:text-ink">Frota</Link>
        <ChevronRight size={12} />
        <span className="text-ink font-mono">{veiculo.placa}</span>
      </nav>

      {/* Header */}
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <h1 className="font-display text-4xl font-bold text-brand-dark leading-none tracking-tight">
            {veiculo.placa}
          </h1>
          <p className="text-sm text-ink-secondary">
            {[veiculo.marca, veiculo.modelo, veiculo.ano].filter(Boolean).join(' · ') || '—'}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <StatusBadge status={veiculo.status} />
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase border bg-stone-100 text-stone-700 border-stone-200">
              {TIPO_LABELS[veiculo.tipo]}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase border ${
              veiculo.proprietario === 'proprio'
                ? 'bg-accent-surface text-accent border-accent-border'
                : 'bg-stone-100 text-stone-600 border-stone-200'
            }`}>
              {PROPRIETARIO_LABELS[veiculo.proprietario]}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="text-right">
            <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">KM atual</div>
            <div className="font-display text-2xl font-bold tabular-nums text-ink leading-none mt-1">
              {formatKm(veiculo.km_atual)}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <AtualizarKmModal veiculoId={veiculo.id} placa={veiculo.placa} kmAtual={veiculo.km_atual} />
            <VeiculoFormSheet mode="edit" veiculo={veiculoFormData} />
          </div>
        </div>
      </header>

      {/* Tabs */}
      <Tabs defaultValue="visao-geral" className="space-y-4">
        <TabsList className="bg-app-subtle">
          <TabsTrigger value="visao-geral">Visão geral</TabsTrigger>
          <TabsTrigger value="viagens">Viagens</TabsTrigger>
          <TabsTrigger value="manutencoes">Manutenções</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral">
          <Suspense fallback={<CardSkeleton h={280} />}>
            <VisaoGeralTab veiculo={veiculo} />
          </Suspense>
        </TabsContent>

        <TabsContent value="viagens">
          <Suspense fallback={<TableSkeleton />}>
            <ViagensVeiculoTab veiculoId={veiculo.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="manutencoes">
          <Suspense fallback={<TableSkeleton />}>
            <ManutencoesVeiculoTab veiculoId={veiculo.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="financeiro">
          <Suspense fallback={<CardSkeleton h={300} />}>
            <FinanceiroVeiculoTab veiculoId={veiculo.id} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CardSkeleton({ h = 200 }: { h?: number }) {
  return <Card className="p-5 bg-app-card"><Skeleton style={{ height: h }} /></Card>
}

function TableSkeleton() {
  return (
    <Card className="p-5 bg-app-card space-y-2">
      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
    </Card>
  )
}
