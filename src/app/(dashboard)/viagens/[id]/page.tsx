import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, MapPin, Phone, Truck, User } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { StatusBadge, type StatusValue } from '@/components/ui/status-badge'
import { ViagemActionsBar } from '@/components/viagens/viagem-actions-bar'
import { formatCurrency, formatDate, formatKm } from '@/lib/utils'

export const dynamic = 'force-dynamic'

type ViagemDetalhe = {
  id: string
  numero: string
  origem: string
  destino: string
  cliente: string | null
  tipo_carga: string | null
  peso_ton: number | null
  cte_numero: string | null
  data_saida: string | null
  data_chegada: string | null
  data_chegada_real: string | null
  km_saida: number | null
  km_chegada: number | null
  valor_frete: number | null
  valor_adiantamento: number
  status: StatusValue & ('planejada' | 'em_andamento' | 'concluida' | 'cancelada')
  observacoes: string | null
  veiculos: { id: string; placa: string; modelo: string | null; km_atual: number } | null
  motoristas: { id: string; nome: string; cnh_categoria: 'C' | 'D' | 'E' | null; telefone: string | null } | null
}

export default async function ViagemDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: v } = await supabase
    .from('viagens')
    .select(`
      id, numero, origem, destino, cliente, tipo_carga, peso_ton, cte_numero,
      data_saida, data_chegada, data_chegada_real, km_saida, km_chegada,
      valor_frete, valor_adiantamento, status, observacoes,
      veiculos(id, placa, modelo, km_atual),
      motoristas(id, nome, cnh_categoria, telefone)
    `)
    .eq('id', params.id)
    .returns<ViagemDetalhe[]>()
    .maybeSingle()

  if (!v) notFound()

  const kmPercorrido = v.km_chegada != null && v.km_saida != null
    ? Number(v.km_chegada) - Number(v.km_saida)
    : null
  const saldo = (Number(v.valor_frete ?? 0)) - Number(v.valor_adiantamento ?? 0)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-ink-muted">
        <Link href="/viagens" className="hover:text-ink">Viagens</Link>
        <ChevronRight size={12} />
        <span className="text-ink font-mono">{v.numero}</span>
      </nav>

      {/* Header */}
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold text-ink leading-none">{v.numero}</h1>
            <StatusBadge status={v.status} />
          </div>
          <div className="flex items-center gap-2 text-lg font-medium text-ink">
            <MapPin size={16} className="text-accent" />
            <span>{v.origem}</span>
            <span className="text-ink-muted">→</span>
            <MapPin size={16} className="text-brand" />
            <span>{v.destino}</span>
          </div>
        </div>

        <ViagemActionsBar
          viagemId={v.id}
          numero={v.numero}
          status={v.status}
          kmSaida={v.km_saida != null ? Number(v.km_saida) : null}
        />
      </header>

      {/* Cards principais — Veículo e Motorista */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 bg-app-card">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-3">
            <Truck size={12} /> Veículo
          </div>
          {v.veiculos ? (
            <>
              <div className="font-mono font-bold text-2xl text-brand-dark leading-none">{v.veiculos.placa}</div>
              {v.veiculos.modelo && <div className="text-sm text-ink-secondary mt-1">{v.veiculos.modelo}</div>}
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <Info label="KM saída" value={v.km_saida != null ? formatKm(Number(v.km_saida)) : '—'} mono />
                <Info label="KM chegada" value={v.km_chegada != null ? formatKm(Number(v.km_chegada)) : '—'} mono />
              </dl>
              <Link href={`/frota/${v.veiculos.id}`} className="mt-3 inline-flex items-center gap-1 text-xs text-brand hover:text-brand-dark font-medium">
                Ver veículo <ChevronRight size={12} />
              </Link>
            </>
          ) : <p className="text-sm text-ink-muted">Veículo removido.</p>}
        </Card>

        <Card className="p-5 bg-app-card">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-3">
            <User size={12} /> Motorista
          </div>
          {v.motoristas ? (
            <>
              <div className="font-display text-xl font-semibold text-ink leading-tight">{v.motoristas.nome}</div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {v.motoristas.cnh_categoria && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase bg-brand-surface text-brand-dark border border-brand-border">
                    CNH {v.motoristas.cnh_categoria}
                  </span>
                )}
                {v.motoristas.telefone && (
                  <a href={`tel:${v.motoristas.telefone.replace(/\D/g, '')}`} className="inline-flex items-center gap-1 text-xs text-brand hover:text-brand-dark">
                    <Phone size={12} /> {v.motoristas.telefone}
                  </a>
                )}
              </div>
              <Link href={`/motoristas/${v.motoristas.id}`} className="mt-3 inline-flex items-center gap-1 text-xs text-brand hover:text-brand-dark font-medium">
                Ver motorista <ChevronRight size={12} />
              </Link>
            </>
          ) : <p className="text-sm text-ink-muted">Motorista removido.</p>}
        </Card>
      </div>

      {/* Info grid */}
      <Card className="p-5 bg-app-card">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted mb-4">Detalhes</h3>
        <dl className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Info label="Cliente"        value={v.cliente ?? '—'} />
          <Info label="Tipo de carga"  value={v.tipo_carga ?? '—'} />
          <Info label="Peso"           value={v.peso_ton != null ? `${Number(v.peso_ton).toLocaleString('pt-BR')} t` : '—'} mono />
          <Info label="CT-e"           value={v.cte_numero ?? '—'} mono />

          <Info label="Data saída"            value={v.data_saida ? formatDate(v.data_saida) : '—'} mono />
          <Info label="Chegada prevista"      value={v.data_chegada ? formatDate(v.data_chegada) : '—'} mono />
          <Info label="Chegada real"          value={v.data_chegada_real ? formatDate(v.data_chegada_real) : '—'} mono />
          <Info label="KM percorrido"         value={kmPercorrido != null ? formatKm(kmPercorrido) : '—'} mono />

          <Info label="Valor do frete"      value={v.valor_frete != null ? formatCurrency(Number(v.valor_frete)) : '—'} mono />
          <Info label="Adiantamento"        value={formatCurrency(Number(v.valor_adiantamento))} mono />
          <Info label="Saldo a receber"     value={formatCurrency(saldo)} mono />
        </dl>

        {v.observacoes && (
          <div className="mt-6 pt-4 border-t">
            <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">Observações</div>
            <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{v.observacoes}</p>
          </div>
        )}
      </Card>
    </div>
  )
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">{label}</dt>
      <dd className={`mt-0.5 text-sm text-ink ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  )
}
