'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Route, Plus, AlarmClock } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { StatusBadge, type StatusValue } from '@/components/ui/status-badge'
import { ViagensRowActions } from './viagens-row-actions'
import { formatCurrency, formatDate, getDaysUntil } from '@/lib/utils'
import { cn } from '@/lib/utils'

export type ViagemLista = {
  id: string
  numero: string
  origem: string
  destino: string
  data_saida: string | null
  data_chegada: string | null
  valor_frete: number | null
  status: StatusValue
  veiculos: { placa: string; modelo: string | null } | null
  motoristas: { nome: string } | null
}

export function ViagensTabela({ viagens }: { viagens: ViagemLista[] }) {
  const router = useRouter()
  if (viagens.length === 0) return <EmptyState />

  return (
    <div className="rounded-md border bg-app-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-app-subtle/40 hover:bg-app-subtle/40">
            {['Nº', 'Veículo', 'Motorista', 'Rota', 'Saída', 'Chegada', 'Frete', 'Status', 'Ações'].map((h, i) => (
              <TableHead key={h} className={cn(
                'font-mono text-[11px] uppercase tracking-wider text-ink-muted',
                (h === 'Frete' || h === 'Ações') && 'text-right',
              )}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {viagens.map((v) => {
            const emAndamento = v.status === 'em_andamento'
            const atrasada = emAndamento && v.data_chegada && getDaysUntil(v.data_chegada) < 0
            return (
              <TableRow
                key={v.id}
                onClick={() => router.push(`/viagens/${v.id}`)}
                className={cn(
                  'cursor-pointer hover:bg-app-subtle/50',
                  emAndamento && 'border-l-[3px] border-l-brand',
                )}
              >
                <TableCell>
                  <Link href={`/viagens/${v.id}`} className="font-mono font-bold text-brand-dark hover:underline" onClick={(e) => e.stopPropagation()}>
                    {v.numero}
                  </Link>
                </TableCell>
                <TableCell>
                  {v.veiculos ? (
                    <>
                      <div className="font-mono font-bold text-sm">{v.veiculos.placa}</div>
                      {v.veiculos.modelo && <div className="text-xs text-ink-muted">{v.veiculos.modelo}</div>}
                    </>
                  ) : '—'}
                </TableCell>
                <TableCell className="text-sm">{v.motoristas?.nome ?? '—'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="truncate max-w-[140px]">{v.origem}</span>
                    <ArrowRight size={11} className="text-ink-muted shrink-0" />
                    <span className="truncate max-w-[140px]">{v.destino}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{v.data_saida ? formatDate(v.data_saida) : '—'}</TableCell>
                <TableCell className={cn('font-mono text-xs', atrasada && 'text-red-600 font-semibold')}>
                  {atrasada && <AlarmClock size={11} className="inline mr-1" />}
                  {v.data_chegada ? formatDate(v.data_chegada) : '—'}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {v.valor_frete != null ? formatCurrency(Number(v.valor_frete)) : '—'}
                </TableCell>
                <TableCell><StatusBadge status={v.status} /></TableCell>
                <TableCell className="text-right"><ViagensRowActions viagem={v} /></TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-md border bg-app-card p-12 text-center">
      <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-app-subtle text-ink-muted mb-3">
        <Route size={28} />
      </div>
      <div className="font-display text-lg font-semibold text-ink">Nenhuma viagem registrada.</div>
      <div className="mt-1 text-sm text-ink-secondary">Comece abrindo a primeira viagem.</div>
      <div className="mt-4">
        <Button asChild className="bg-brand hover:bg-brand-dark text-white">
          <Link href="/viagens/nova"><Plus className="mr-1.5 h-4 w-4" /> Nova viagem</Link>
        </Button>
      </div>
    </div>
  )
}
