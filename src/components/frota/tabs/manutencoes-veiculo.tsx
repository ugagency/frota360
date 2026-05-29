import Link from 'next/link'
import { Wrench } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { StatusBadge, type StatusValue } from '@/components/ui/status-badge'
import { formatCurrency, formatDate, formatKm } from '@/lib/utils'

type ManutencaoRow = {
  id: string
  tipo: 'preventiva' | 'corretiva'
  descricao: string
  oficina: string | null
  data_entrada: string
  data_saida: string | null
  km_na_manutencao: number | null
  valor_total: number
  status: StatusValue
}

export async function ManutencoesVeiculoTab({ veiculoId }: { veiculoId: string }) {
  const supabase = createClient()
  const { data } = await supabase
    .from('manutencoes')
    .select('id, tipo, descricao, oficina, data_entrada, data_saida, km_na_manutencao, valor_total, status')
    .eq('veiculo_id', veiculoId)
    .order('data_entrada', { ascending: false })
    .limit(50)
    .returns<ManutencaoRow[]>()

  const manutencoes = data ?? []

  if (manutencoes.length === 0) {
    return (
      <Card className="p-10 text-center bg-app-card">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-app-subtle text-ink-muted mb-3">
          <Wrench size={22} />
        </div>
        <div className="text-sm font-medium text-ink">Nenhuma manutenção registrada para este veículo.</div>
      </Card>
    )
  }

  return (
    <Card className="bg-app-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-app-subtle/40 hover:bg-app-subtle/40">
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Tipo</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Descrição</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Oficina</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Entrada</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted text-right">KM</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted text-right">Custo</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {manutencoes.map((m) => (
            <TableRow key={m.id} className="hover:bg-app-subtle/40 cursor-pointer">
              <TableCell><StatusBadge status={m.tipo} /></TableCell>
              <TableCell className="max-w-[320px]">
                <Link href={`/manutencao/${m.id}`} className="text-sm text-ink hover:text-brand-dark line-clamp-1">
                  {m.descricao}
                </Link>
              </TableCell>
              <TableCell className="text-sm text-ink-secondary">{m.oficina ?? '—'}</TableCell>
              <TableCell className="font-mono text-xs">{formatDate(m.data_entrada)}</TableCell>
              <TableCell className="text-right font-mono text-sm">{m.km_na_manutencao != null ? formatKm(m.km_na_manutencao) : '—'}</TableCell>
              <TableCell className="text-right font-mono text-sm">{formatCurrency(Number(m.valor_total))}</TableCell>
              <TableCell><StatusBadge status={m.status} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
