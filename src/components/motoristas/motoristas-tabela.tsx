'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Users, Plus } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { StatusBadge, type StatusValue } from '@/components/ui/status-badge'
import { AvatarIniciais } from './avatar-iniciais'
import { DocumentoValidadeBadge } from './documento-validade-badge'
import { MotoristasRowActions } from './motoristas-row-actions'
import { MotoristaFormSheet } from './motorista-form-sheet'
import { formatarCPF } from '@/lib/format'
import { TIPO_LABELS } from '@/lib/validations/motorista'
import { cn } from '@/lib/utils'

export type MotoristaLista = {
  id: string
  nome: string
  cpf: string
  telefone: string | null
  cnh_numero: string | null
  cnh_categoria: 'C' | 'D' | 'E' | null
  cnh_validade: string | null
  mopp_validade: string | null
  nr_validade: string | null
  tipo: 'proprio' | 'agregado'
  status: StatusValue
}

export function MotoristasTabela({ motoristas }: { motoristas: MotoristaLista[] }) {
  const router = useRouter()

  if (motoristas.length === 0) return <EmptyState />

  return (
    <div className="rounded-md border bg-app-card overflow-hidden">
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow className="bg-app-subtle/40 hover:bg-app-subtle/40">
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Motorista</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">CNH</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Validade CNH</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">MOPP</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Vínculo</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Status</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {motoristas.map((m) => (
            <TableRow
              key={m.id}
              className="cursor-pointer hover:bg-app-subtle/50"
              onClick={() => router.push(`/motoristas/${m.id}`)}
            >
              <TableCell>
                <Link
                  href={`/motoristas/${m.id}`}
                  className="flex items-center gap-2.5 group"
                  onClick={(e) => e.stopPropagation()}
                >
                  <AvatarIniciais nome={m.nome} size="md" />
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-ink group-hover:text-brand-dark truncate">{m.nome}</div>
                    <div className="font-mono text-[11px] text-ink-muted">{formatarCPF(m.cpf)}</div>
                  </div>
                </Link>
              </TableCell>

              <TableCell>
                {m.cnh_categoria ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase bg-brand-surface text-brand-dark border border-brand-border">
                    {m.cnh_categoria}
                  </span>
                ) : <span className="text-ink-muted">—</span>}
              </TableCell>

              <TableCell><DocumentoValidadeBadge validade={m.cnh_validade} /></TableCell>
              <TableCell><DocumentoValidadeBadge validade={m.mopp_validade} /></TableCell>

              <TableCell>
                <span className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase border',
                  m.tipo === 'proprio'
                    ? 'bg-accent-surface text-accent border-accent-border'
                    : 'bg-stone-100 text-stone-600 border-stone-200',
                )}>
                  {TIPO_LABELS[m.tipo]}
                </span>
              </TableCell>

              <TableCell><StatusBadge status={m.status} /></TableCell>
              <TableCell className="text-right"><MotoristasRowActions motorista={m} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-md border bg-app-card p-12 text-center">
      <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-app-subtle text-ink-muted mb-3">
        <Users size={28} />
      </div>
      <div className="font-display text-lg font-semibold text-ink">Nenhum motorista cadastrado.</div>
      <div className="mt-1 text-sm text-ink-secondary">Cadastre o primeiro motorista da sua equipe.</div>
      <div className="mt-4">
        <MotoristaFormSheet mode="create" trigger={
          <Button className="bg-brand hover:bg-brand-dark text-white">
            <Plus className="mr-1.5 h-4 w-4" /> Cadastrar motorista
          </Button>
        } />
      </div>
    </div>
  )
}
