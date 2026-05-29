import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, Phone } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge, type StatusValue } from '@/components/ui/status-badge'

import { AvatarIniciais } from '@/components/motoristas/avatar-iniciais'
import { DocumentoValidadeBadge } from '@/components/motoristas/documento-validade-badge'
import { MotoristaFormSheet } from '@/components/motoristas/motorista-form-sheet'
import { ViagensMotoristaTab } from '@/components/motoristas/tabs/viagens-motorista'
import { DocumentosExtrasTab } from '@/components/motoristas/tabs/documentos-extras'
import { DesempenhoMotoristaTab } from '@/components/motoristas/tabs/desempenho-motorista'

import { formatarCPF } from '@/lib/format'
import { TIPO_LABELS, type MotoristaFormData } from '@/lib/validations/motorista'

export const dynamic = 'force-dynamic'

type MotoristaCompleto = {
  id: string
  nome: string
  cpf: string
  telefone: string | null
  tipo: 'proprio' | 'agregado'
  cnh_numero: string | null
  cnh_categoria: 'C' | 'D' | 'E' | null
  cnh_validade: string | null
  mopp_validade: string | null
  nr_validade: string | null
  status: StatusValue
  documentos: { tipo: string; validade: string }[] | null
}

export default async function MotoristaDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: m } = await supabase
    .from('motoristas')
    .select('id, nome, cpf, telefone, tipo, cnh_numero, cnh_categoria, cnh_validade, mopp_validade, nr_validade, status, documentos')
    .eq('id', params.id)
    .returns<MotoristaCompleto[]>()
    .maybeSingle()

  if (!m) notFound()

  const formData: Partial<MotoristaFormData> & { id: string } = {
    id: m.id,
    nome: m.nome,
    cpf: m.cpf,
    telefone: m.telefone,
    tipo: m.tipo,
    cnh_numero: m.cnh_numero,
    cnh_categoria: m.cnh_categoria,
    cnh_validade: m.cnh_validade,
    mopp_validade: m.mopp_validade,
    nr_validade: m.nr_validade,
    documentos: m.documentos ?? [],
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-ink-muted">
        <Link href="/motoristas" className="hover:text-ink">Motoristas</Link>
        <ChevronRight size={12} />
        <span className="text-ink">{m.nome}</span>
      </nav>

      {/* Header */}
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <AvatarIniciais nome={m.nome} size="xl" />
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold text-ink leading-none">{m.nome}</h1>
            <div className="font-mono text-sm text-ink-secondary">{formatarCPF(m.cpf)}</div>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <StatusBadge status={m.status} />
              {m.cnh_categoria && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase bg-brand-surface text-brand-dark border border-brand-border">
                  CNH {m.cnh_categoria}
                </span>
              )}
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase border bg-stone-100 text-stone-700 border-stone-200">
                {TIPO_LABELS[m.tipo]}
              </span>
              {m.telefone && (
                <a href={`tel:${m.telefone.replace(/\D/g, '')}`} className="inline-flex items-center gap-1 text-xs text-brand hover:text-brand-dark">
                  <Phone size={12} /> {m.telefone}
                </a>
              )}
            </div>
          </div>
        </div>

        <MotoristaFormSheet mode="edit" motorista={formData} />
      </header>

      {/* Cards de documentos críticos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DocumentoCard
          titulo="CNH"
          principal={m.cnh_categoria ? `Categoria ${m.cnh_categoria}` : 'Categoria não informada'}
          secundario={m.cnh_numero ? `Nº ${m.cnh_numero}` : null}
          validade={m.cnh_validade}
        />
        <DocumentoCard
          titulo="MOPP"
          principal="Movimentação de Produtos Perigosos"
          secundario={null}
          validade={m.mopp_validade}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="viagens" className="space-y-4">
        <TabsList className="bg-app-subtle">
          <TabsTrigger value="viagens">Viagens</TabsTrigger>
          <TabsTrigger value="documentos">Documentos extras</TabsTrigger>
          <TabsTrigger value="desempenho">Desempenho</TabsTrigger>
        </TabsList>

        <TabsContent value="viagens">
          <Suspense fallback={<TableSkeleton />}>
            <ViagensMotoristaTab motoristaId={m.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="documentos">
          <DocumentosExtrasTab documentos={m.documentos ?? []} />
        </TabsContent>

        <TabsContent value="desempenho">
          <Suspense fallback={<CardSkeleton h={120} />}>
            <DesempenhoMotoristaTab motoristaId={m.id} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DocumentoCard({
  titulo, principal, secundario, validade,
}: { titulo: string; principal: string; secundario: string | null; validade: string | null }) {
  return (
    <Card className="p-5 bg-app-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">{titulo}</div>
          <div className="mt-1.5 font-display text-lg font-semibold text-ink leading-tight">{principal}</div>
          {secundario && <div className="mt-0.5 text-xs text-ink-secondary font-mono">{secundario}</div>}
        </div>
        <DocumentoValidadeBadge validade={validade} compact={false} className="shrink-0" />
      </div>
    </Card>
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
