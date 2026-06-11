import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Phone, Mail, MapPin, FileText } from 'lucide-react'

type ClienteCompleto = {
  id: string
  razao_social: string
  cnpj: string | null
  telefone: string | null
  email: string | null
  cidade: string | null
  estado: string | null
  segmento: string | null
  proxima_acao: string | null
  valor_mensal_est: number | null
  prazo_pagamento: number
  notas_internas: string | null
}

export async function VisaoGeralTab({ cliente }: { cliente: ClienteCompleto }) {
  const supabase = createClient()

  // Busca viagens onde cliente ILIKE razao_social (join por texto)
  const { data: viagens } = await supabase
    .from('viagens')
    .select('id, valor_frete, status, data_saida')
    .ilike('cliente', `%${cliente.razao_social}%`)
    .returns<{ id: string; valor_frete: number | null; status: string; data_saida: string | null }[]>()

  const todasViagens = viagens ?? []
  const concluidas  = todasViagens.filter((v) => v.status === 'concluida')
  const faturamento = concluidas.reduce((s, v) => s + (v.valor_frete ?? 0), 0)
  const ticketMedio = concluidas.length ? faturamento / concluidas.length : 0
  const ultimaViagem = concluidas
    .filter((v) => v.data_saida)
    .sort((a, b) => (b.data_saida! > a.data_saida! ? 1 : -1))[0]

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiMini label="Viagens" value={String(todasViagens.length)} />
        <KpiMini label="Concluídas" value={String(concluidas.length)} />
        <KpiMini label="Faturamento" value={formatCurrency(faturamento)} />
        <KpiMini label="Ticket médio" value={formatCurrency(ticketMedio)} />
      </div>

      {/* Dados do cliente */}
      <Card className="p-5 bg-app-card">
        <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-3">Dados cadastrais</div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cliente.cnpj && <DataField label="CNPJ" value={cliente.cnpj} />}
          {cliente.segmento && <DataField label="Segmento" value={cliente.segmento} />}
          {cliente.prazo_pagamento && <DataField label="Prazo pagamento" value={`${cliente.prazo_pagamento} dias`} />}
          {cliente.valor_mensal_est && <DataField label="Fat. mensal est." value={formatCurrency(cliente.valor_mensal_est)} />}
          {ultimaViagem?.data_saida && <DataField label="Última viagem" value={formatDate(ultimaViagem.data_saida)} />}
          {cliente.proxima_acao && <DataField label="Próxima ação" value={formatDate(cliente.proxima_acao)} urgent={new Date(cliente.proxima_acao) < new Date()} />}
        </dl>
      </Card>

      {/* Contatos */}
      {(cliente.telefone || cliente.email || cliente.cidade) && (
        <Card className="p-5 bg-app-card">
          <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-3">Contato</div>
          <div className="space-y-2">
            {cliente.telefone && (
              <a href={`tel:${cliente.telefone.replace(/\D/g, '')}`} className="flex items-center gap-2 text-sm text-brand hover:text-brand-dark">
                <Phone size={14} /> {cliente.telefone}
              </a>
            )}
            {cliente.email && (
              <a href={`mailto:${cliente.email}`} className="flex items-center gap-2 text-sm text-brand hover:text-brand-dark">
                <Mail size={14} /> {cliente.email}
              </a>
            )}
            {(cliente.cidade || cliente.estado) && (
              <span className="flex items-center gap-2 text-sm text-ink-secondary">
                <MapPin size={14} /> {[cliente.cidade, cliente.estado].filter(Boolean).join(' / ')}
              </span>
            )}
          </div>
        </Card>
      )}

      {/* Notas internas */}
      {cliente.notas_internas && (
        <Card className="p-5 bg-app-card">
          <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-2">
            <FileText size={12} /> Notas internas
          </div>
          <p className="text-sm text-ink-secondary whitespace-pre-wrap">{cliente.notas_internas}</p>
        </Card>
      )}
    </div>
  )
}

function KpiMini({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3 bg-app-card text-center">
      <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">{label}</div>
      <div className="mt-1 font-display text-lg font-bold text-ink">{value}</div>
    </Card>
  )
}

function DataField({ label, value, urgent }: { label: string; value: string; urgent?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] text-ink-muted">{label}</dt>
      <dd className={`text-sm font-medium ${urgent ? 'text-red-600' : 'text-ink'}`}>{value}</dd>
    </div>
  )
}
