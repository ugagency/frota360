'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Truck, AlertTriangle, Plus } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { StatusBadge, type StatusValue } from '@/components/ui/status-badge'
import { FrotaRowActions } from './frota-row-actions'
import { VeiculoFormSheet } from './veiculo-form-sheet'
import { formatKm, formatDate, getDaysUntil } from '@/lib/utils'
import { TIPO_LABELS, PROPRIETARIO_LABELS, type VeiculoFormData } from '@/lib/validations/veiculo'
import { cn } from '@/lib/utils'

export type VeiculoLista = {
  id: string
  placa: string
  tipo: keyof typeof TIPO_LABELS
  marca: string | null
  modelo: string | null
  ano: number | null
  km_atual: number
  data_proxima_revisao: string | null
  status: StatusValue
  proprietario: 'proprio' | 'agregado'
}

export function FrotaTabela({ veiculos }: { veiculos: VeiculoLista[] }) {
  const router = useRouter()

  if (veiculos.length === 0) return <EmptyState />

  return (
    <div className="rounded-md border bg-app-card overflow-hidden">
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow className="bg-app-subtle/40 hover:bg-app-subtle/40">
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Veículo</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Tipo</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Propriedade</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted text-right">KM atual</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Próx. revisão</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Status</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {veiculos.map((v) => {
            const dias = v.data_proxima_revisao ? getDaysUntil(v.data_proxima_revisao) : null
            const alertaRev = dias != null && dias < 15

            return (
              <TableRow
                key={v.id}
                className="cursor-pointer hover:bg-app-subtle/50"
                onClick={() => router.push(`/frota/${v.id}`)}
              >
                <TableCell>
                  <Link href={`/frota/${v.id}`} className="block group" onClick={(e) => e.stopPropagation()}>
                    <div className="font-mono font-bold text-brand-dark uppercase group-hover:underline">{v.placa}</div>
                    <div className="text-xs text-ink-secondary truncate">
                      {[v.marca, v.modelo, v.ano].filter(Boolean).join(' · ') || '—'}
                    </div>
                  </Link>
                </TableCell>

                <TableCell>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase bg-stone-100 text-stone-700 border border-stone-200">
                    {TIPO_LABELS[v.tipo]}
                  </span>
                </TableCell>

                <TableCell>
                  <span className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase border',
                    v.proprietario === 'proprio'
                      ? 'bg-accent-surface text-accent border-accent-border'
                      : 'bg-stone-100 text-stone-600 border-stone-200',
                  )}>
                    {PROPRIETARIO_LABELS[v.proprietario]}
                  </span>
                </TableCell>

                <TableCell className="text-right font-mono text-sm">{formatKm(v.km_atual)}</TableCell>

                <TableCell>
                  {v.data_proxima_revisao ? (
                    <span className={cn(
                      'inline-flex items-center gap-1 font-mono text-xs',
                      alertaRev && 'px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 border border-yellow-200',
                    )}>
                      {alertaRev && <AlertTriangle size={11} />}
                      {formatDate(v.data_proxima_revisao)}
                    </span>
                  ) : (
                    <span className="text-ink-muted">—</span>
                  )}
                </TableCell>

                <TableCell><StatusBadge status={v.status} /></TableCell>

                <TableCell className="text-right">
                  <FrotaRowActions veiculo={v} />
                </TableCell>
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
        <Truck size={28} />
      </div>
      <div className="font-display text-lg font-semibold text-ink">Nenhum veículo cadastrado.</div>
      <div className="mt-1 text-sm text-ink-secondary">Comece cadastrando o primeiro veículo da sua frota.</div>
      <div className="mt-4">
        <VeiculoFormSheet mode="create" trigger={
          <Button className="bg-brand hover:bg-brand-dark text-white">
            <Plus className="mr-1.5 h-4 w-4" /> Cadastrar veículo
          </Button>
        } />
      </div>
    </div>
  )
}
