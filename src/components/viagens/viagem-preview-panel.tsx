'use client'

import { AlertTriangle, Truck, User, MapPin, DollarSign, Calendar, type LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DocumentoValidadeBadge } from '@/components/motoristas/documento-validade-badge'
import { formatCurrency, formatDate, formatKm, getDaysUntil } from '@/lib/utils'
import type { DestinoItem } from '@/lib/validations/viagem'

export type VeiculoOption = {
  id: string
  placa: string
  modelo: string | null
  km_atual: number
}

export type MotoristaOption = {
  id: string
  nome: string
  cnh_categoria: 'C' | 'D' | 'E' | null
  cnh_validade: string | null
}

type Props = {
  veiculo: VeiculoOption | null
  motorista: MotoristaOption | null
  origem: string
  destino: string
  destinos?: DestinoItem[]
  dataSaida: string
  dataChegada: string
  valorFrete: number
  valorAdiantamento: number
  cnhVencida: boolean
}

export function ViagemPreviewPanel({
  veiculo, motorista, origem, destino, destinos = [], dataSaida, dataChegada,
  valorFrete, valorAdiantamento, cnhVencida,
}: Props) {
  const pctAdiantamento = valorFrete > 0 ? (valorAdiantamento / valorFrete) * 100 : 0
  const acimaLimite = pctAdiantamento > 80

  return (
    <Card className="bg-app-card p-5 sticky top-20 space-y-5">
      <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">Resumo da viagem</h3>

      {cnhVencida && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs text-red-700 font-medium">
            CNH do motorista vencida — impossível abrir a viagem.
          </AlertDescription>
        </Alert>
      )}

      {/* Veículo */}
      <Section icone={Truck} titulo="Veículo">
        {veiculo ? (
          <>
            <div className="font-mono font-bold text-base text-brand-dark">{veiculo.placa}</div>
            {veiculo.modelo && <div className="text-xs text-ink-secondary">{veiculo.modelo}</div>}
            <div className="text-[11px] font-mono text-ink-muted mt-1">KM atual: {formatKm(veiculo.km_atual)}</div>
          </>
        ) : <Vazio>Selecione um veículo</Vazio>}
      </Section>

      {/* Motorista */}
      <Section icone={User} titulo="Motorista">
        {motorista ? (
          <>
            <div className="font-medium text-sm text-ink">{motorista.nome}</div>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              {motorista.cnh_categoria && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-brand-surface text-brand-dark border border-brand-border">
                  CNH {motorista.cnh_categoria}
                </span>
              )}
              <DocumentoValidadeBadge validade={motorista.cnh_validade} compact />
            </div>
          </>
        ) : <Vazio>Selecione um motorista</Vazio>}
      </Section>

      {/* Rota */}
      <Section icone={MapPin} titulo="Rota">
        {origem || destino ? (
          <div className="text-sm text-ink space-y-0.5">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <span className="truncate">{origem || '—'}</span>
            </div>
            {destinos.length > 0 ? destinos.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5 pl-0.5">
                <div className={`w-2 h-2 rounded-full shrink-0 ${i === destinos.length - 1 ? 'bg-red-500' : 'bg-amber-400'}`} />
                <span className="truncate text-xs">{d.cidade || <Vazio>—</Vazio>}</span>
              </div>
            )) : (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <span className="truncate">{destino || <Vazio>—</Vazio>}</span>
              </div>
            )}
            <p className="text-[10px] text-ink-muted pt-0.5">* Distância estimada não disponível. KM real informado ao encerrar.</p>
          </div>
        ) : <Vazio>Informe origem e destino</Vazio>}
      </Section>

      {/* Datas */}
      <Section icone={Calendar} titulo="Período">
        {dataSaida ? (
          <div className="text-xs space-y-0.5">
            <div className="text-ink"><span className="text-ink-muted font-mono">Saída:</span> {formatDateTime(dataSaida)}</div>
            {dataChegada && (
              <div className="text-ink">
                <span className="text-ink-muted font-mono">Chegada:</span> {formatDateTime(dataChegada)}
                {dataSaida && <span className="ml-1 text-ink-muted">· {Math.max(0, getDaysUntil(dataChegada) - getDaysUntil(dataSaida))}d</span>}
              </div>
            )}
          </div>
        ) : <Vazio>Defina as datas</Vazio>}
      </Section>

      {/* Financeiro */}
      <Section icone={DollarSign} titulo="Financeiro">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-ink-secondary">Frete</span>
            <span className="font-mono font-bold text-accent">{formatCurrency(valorFrete)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-secondary">Adiantamento</span>
            <span className="font-mono text-ink">{formatCurrency(valorAdiantamento)}</span>
          </div>
          {valorFrete > 0 && (
            <div className={`text-[11px] font-mono text-right ${acimaLimite ? 'text-red-600' : 'text-ink-muted'}`}>
              {pctAdiantamento.toFixed(1)}% do frete{acimaLimite && ' ⚠ excede 80%'}
            </div>
          )}
        </div>
      </Section>
    </Card>
  )
}

function Section({ icone: Icon, titulo, children }: { icone: LucideIcon; titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1">
        <Icon size={11} /> {titulo}
      </div>
      <div className="pl-4">{children}</div>
    </div>
  )
}

function Vazio({ children }: { children: React.ReactNode }) {
  return <span className="text-ink-muted italic text-xs">{children}</span>
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch { return formatDate(iso) }
}
