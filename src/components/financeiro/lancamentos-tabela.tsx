'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Paperclip, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { toast } from 'sonner'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { LancamentoFormSheet } from './lancamento-form-sheet'
import { deletarLancamento } from '@/app/actions/financeiro'
import { CATEGORIA_LABEL, type LancamentoFormData } from '@/lib/validations/financeiro'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import type { SelectOption } from './lancamento-form'

export type LancamentoRow = {
  id: string
  tipo: 'receita' | 'despesa'
  categoria: keyof typeof CATEGORIA_LABEL
  descricao: string
  valor: number
  data: string
  veiculo_id: string | null
  viagem_id: string | null
  comprovante_url: string | null
  veiculos: { placa: string } | null
}

export function LancamentosTabela({
  lancamentos, veiculos, viagens,
}: {
  lancamentos: LancamentoRow[]
  veiculos: SelectOption[]
  viagens: Array<SelectOption & { veiculo_id: string }>
}) {
  if (lancamentos.length === 0) {
    return (
      <div className="rounded-md border bg-app-card p-8 text-center">
        <div className="text-sm font-medium text-ink">Nenhum lançamento no período.</div>
      </div>
    )
  }

  return (
    <div className="rounded-md border bg-app-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-app-subtle/40 hover:bg-app-subtle/40">
            {['Data', 'Tipo', 'Categoria', 'Descrição', 'Veículo', 'Valor', '', 'Ações'].map((h, i) => (
              <TableHead key={i} className={cn(
                'font-mono text-[11px] uppercase tracking-wider text-ink-muted',
                (h === 'Valor' || h === 'Ações') && 'text-right',
              )}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {lancamentos.map((l) => (
            <Row key={l.id} lancamento={l} veiculos={veiculos} viagens={viagens} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function Row({ lancamento: l, veiculos, viagens }: {
  lancamento: LancamentoRow
  veiculos: SelectOption[]
  viagens: Array<SelectOption & { veiculo_id: string }>
}) {
  const router = useRouter()
  const [pending, startT] = useTransition()

  function deletar() {
    startT(async () => {
      const r = await deletarLancamento(l.id)
      if (!r.ok) { toast.error(r.error); return }
      toast.success('Lançamento removido.')
      router.refresh()
    })
  }

  const isReceita = l.tipo === 'receita'

  const formData: Partial<LancamentoFormData> & { id: string } = {
    id: l.id,
    tipo: l.tipo, categoria: l.categoria, descricao: l.descricao,
    valor: l.valor, data: l.data, veiculo_id: l.veiculo_id, viagem_id: l.viagem_id,
    comprovante_url: l.comprovante_url,
  }

  return (
    <TableRow className="hover:bg-app-subtle/40">
      <TableCell className="font-mono text-xs">{formatDate(l.data)}</TableCell>
      <TableCell>
        <span className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase border',
          isReceita ? 'bg-accent-surface text-accent border-accent-border' : 'bg-red-50 text-red-700 border-red-200',
        )}>
          {isReceita ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
          {isReceita ? 'RECEITA' : 'DESPESA'}
        </span>
      </TableCell>
      <TableCell className="text-sm">{CATEGORIA_LABEL[l.categoria] ?? l.categoria}</TableCell>
      <TableCell className="text-sm max-w-[280px] truncate">{l.descricao}</TableCell>
      <TableCell className="font-mono text-xs">{l.veiculos?.placa ?? <span className="text-ink-muted">—</span>}</TableCell>
      <TableCell className={cn('text-right font-mono text-sm font-medium', isReceita ? 'text-accent' : 'text-red-700')}>
        {isReceita ? '+' : '−'} {formatCurrency(Number(l.valor))}
      </TableCell>
      <TableCell>
        {l.comprovante_url ? (
          <a href={l.comprovante_url} target="_blank" rel="noopener noreferrer" className="text-ink-muted hover:text-brand">
            <Paperclip size={14} />
          </a>
        ) : null}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-0">
          <LancamentoFormSheet mode="edit" veiculos={veiculos} viagens={viagens} lancamento={formData} />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-ink-muted hover:text-destructive" disabled={pending}>
                <Trash2 size={14} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover lançamento?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. <br />
                  <strong>{l.descricao}</strong> — {formatCurrency(Number(l.valor))}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={deletar} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  )
}
