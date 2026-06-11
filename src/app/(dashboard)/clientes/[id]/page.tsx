import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, Phone, Mail } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { ClienteStatusBadge } from '@/components/clientes/cliente-status-badge'
import { ClienteFormSheet } from '@/components/clientes/cliente-form-sheet'
import { VisaoGeralTab } from '@/components/clientes/tabs/visao-geral-tab'
import { ViagensClienteTab } from '@/components/clientes/tabs/viagens-cliente-tab'
import { InteracoesTab } from '@/components/clientes/tabs/interacoes-tab'
import { ContratosTab } from '@/components/clientes/tabs/contratos-tab'

import type { ClienteFormData } from '@/lib/validations/cliente'

export const dynamic = 'force-dynamic'

type ClienteDetalhe = {
  id: string; razao_social: string; cnpj: string | null; telefone: string | null; email: string | null
  cidade: string | null; estado: string | null; status: string; segmento: string | null
  proxima_acao: string | null; valor_mensal_est: number | null; prazo_pagamento: number; notas_internas: string | null
}
type InteracaoRow = {
  id: string; tipo: string; titulo: string; descricao: string | null
  data_interacao: string; proximo_contato: string | null
}
type ContratoRow = {
  id: string; titulo: string; status: string; data_inicio: string | null; data_fim: string | null
  prazo_pagamento: number; valor_por_km: number | null; valor_minimo_frete: number | null
  rotas_cobertas: string | null; observacoes: string | null
}

export default async function ClienteDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: c } = await supabase
    .from('clientes')
    .select('id, razao_social, cnpj, telefone, email, cidade, estado, status, segmento, proxima_acao, valor_mensal_est, prazo_pagamento, notas_internas')
    .eq('id', params.id)
    .returns<ClienteDetalhe[]>()
    .maybeSingle()

  if (!c) notFound()

  const [{ data: interacoes }, { data: contratos }] = await Promise.all([
    supabase
      .from('crm_interacoes')
      .select('id, tipo, titulo, descricao, data_interacao, proximo_contato')
      .eq('cliente_id', params.id)
      .order('data_interacao', { ascending: false })
      .returns<InteracaoRow[]>(),
    supabase
      .from('crm_contratos')
      .select('id, titulo, status, data_inicio, data_fim, prazo_pagamento, valor_por_km, valor_minimo_frete, rotas_cobertas, observacoes')
      .eq('cliente_id', params.id)
      .order('created_at', { ascending: false })
      .returns<ContratoRow[]>(),
  ])

  const formData: Partial<ClienteFormData> & { id: string } = {
    id: c.id,
    razao_social:     c.razao_social,
    cnpj:             c.cnpj,
    telefone:         c.telefone,
    email:            c.email,
    cidade:           c.cidade,
    estado:           c.estado,
    status:           c.status as ClienteFormData['status'],
    segmento:         c.segmento,
    proxima_acao:     c.proxima_acao,
    valor_mensal_est: c.valor_mensal_est,
    prazo_pagamento:  c.prazo_pagamento,
    notas_internas:   c.notas_internas,
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-ink-muted">
        <Link href="/clientes" className="hover:text-ink">Clientes</Link>
        <ChevronRight size={12} />
        <span className="text-ink">{c.razao_social}</span>
      </nav>

      {/* Header */}
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold text-ink leading-none">{c.razao_social}</h1>
          {c.cnpj && <div className="font-mono text-sm text-ink-secondary">{c.cnpj}</div>}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <ClienteStatusBadge status={c.status} />
            {c.segmento && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase bg-brand-surface text-brand-dark border border-brand-border">
                {c.segmento}
              </span>
            )}
            {c.telefone && (
              <a href={`tel:${c.telefone.replace(/\D/g, '')}`} className="inline-flex items-center gap-1 text-xs text-brand hover:text-brand-dark">
                <Phone size={12} /> {c.telefone}
              </a>
            )}
            {c.email && (
              <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 text-xs text-brand hover:text-brand-dark">
                <Mail size={12} /> {c.email}
              </a>
            )}
          </div>
        </div>

        <ClienteFormSheet mode="edit" cliente={formData} />
      </header>

      {/* Tabs */}
      <Tabs defaultValue="geral" className="space-y-4">
        <TabsList className="bg-app-subtle">
          <TabsTrigger value="geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="viagens">Viagens</TabsTrigger>
          <TabsTrigger value="interacoes">
            Interações {(interacoes?.length ?? 0) > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-brand-surface text-brand text-[10px] font-mono">
                {interacoes!.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="contratos">
            Contratos {(contratos?.length ?? 0) > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent-surface text-accent text-[10px] font-mono">
                {contratos!.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geral">
          <Suspense fallback={<CardSkeleton h={200} />}>
            <VisaoGeralTab cliente={c} />
          </Suspense>
        </TabsContent>

        <TabsContent value="viagens">
          <Suspense fallback={<TableSkeleton />}>
            <ViagensClienteTab razaoSocial={c.razao_social} />
          </Suspense>
        </TabsContent>

        <TabsContent value="interacoes">
          <InteracoesTab clienteId={c.id} interacoes={interacoes ?? []} />
        </TabsContent>

        <TabsContent value="contratos">
          <ContratosTab clienteId={c.id} contratos={contratos ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CardSkeleton({ h = 120 }: { h?: number }) {
  return <Card className="p-5 bg-app-card"><Skeleton style={{ height: h }} /></Card>
}

function TableSkeleton() {
  return (
    <Card className="p-5 bg-app-card space-y-2">
      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
    </Card>
  )
}
