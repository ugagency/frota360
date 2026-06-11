'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Wrench, Eye, Pencil } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { StatusBadge, type StatusValue } from '@/components/ui/status-badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

export type ManutencaoLista = {
  id: string
  tipo: 'preventiva' | 'corretiva'
  descricao: string
  oficina: string | null
  data_entrada: string
  data_saida: string | null
  valor_total: number
  status: StatusValue
  veiculos: { placa: string; modelo: string | null } | null
}

export function ManutencoesTabela({ manutencoes }: { manutencoes: ManutencaoLista[] }) {
  const router = useRouter()
  if (manutencoes.length === 0) return <EmptyState />

  return (
    <div className="rounded-md border bg-app-card overflow-hidden">
      <TooltipProvider>
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow className="bg-app-subtle/40 hover:bg-app-subtle/40">
              {['Veículo', 'Tipo', 'Descrição', 'Oficina', 'Entrada', 'Saída', 'Custo', 'Status', 'Ações'].map((h) => (
                <TableHead key={h} className={cn(
                  'font-mono text-[11px] uppercase tracking-wider text-ink-muted',
                  (h === 'Custo' || h === 'Ações') && 'text-right',
                )}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {manutencoes.map((m) => {
              const truncated = m.descricao.length > 40 ? `${m.descricao.slice(0, 40)}…` : m.descricao
              return (
                <TableRow key={m.id} className="cursor-pointer hover:bg-app-subtle/50" onClick={() => router.push(`/manutencao/${m.id}`)}>
                  <TableCell>
                    {m.veiculos ? (
                      <>
                        <div className="font-mono font-bold text-sm">{m.veiculos.placa}</div>
                        {m.veiculos.modelo && <div className="text-xs text-ink-muted">{m.veiculos.modelo}</div>}
                      </>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase border',
                      m.tipo === 'preventiva'
                        ? 'bg-brand-surface text-brand-dark border-brand-border'
                        : 'bg-red-50 text-red-700 border-red-200',
                    )}>{m.tipo === 'preventiva' ? 'PREVENTIVA' : 'CORRETIVA'}</span>
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild><span className="text-sm">{truncated}</span></TooltipTrigger>
                      <TooltipContent className="max-w-sm">{m.descricao}</TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-sm text-ink-secondary">{m.oficina ?? '—'}</TableCell>
                  <TableCell className="font-mono text-xs">{formatDate(m.data_entrada)}</TableCell>
                  <TableCell className="font-mono text-xs">{m.data_saida ? formatDate(m.data_saida) : <span className="text-yellow-700">Em andamento</span>}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatCurrency(Number(m.valor_total))}</TableCell>
                  <TableCell><StatusBadge status={m.status} /></TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button asChild variant="ghost" size="icon" className="h-10 w-10">
                      <Link href={`/manutencao/${m.id}`}><Eye size={15} /></Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TooltipProvider>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-md border bg-app-card p-12 text-center">
      <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-app-subtle text-ink-muted mb-3">
        <Wrench size={28} />
      </div>
      <div className="font-display text-lg font-semibold text-ink">Nenhuma manutenção registrada.</div>
      <div className="mt-1 text-sm text-ink-secondary">Registre a primeira manutenção da sua frota.</div>
    </div>
  )
}
