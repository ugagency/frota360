import Link from 'next/link'
import { ArrowRight, Route } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge, type StatusValue } from '@/components/ui/status-badge'
import { Card } from '@/components/ui/card'
import { formatCurrency, formatDate, formatKm } from '@/lib/utils'

type ViagemRow = {
  id: string
  numero: string
  origem: string
  destino: string
  data_saida: string | null
  km_saida: number | null
  km_chegada: number | null
  valor_frete: number | null
  status: StatusValue
  motoristas: { nome: string } | null
}

export async function ViagensVeiculoTab({ veiculoId }: { veiculoId: string }) {
  const supabase = createClient()
  const { data } = await supabase
    .from('viagens')
    .select('id, numero, origem, destino, data_saida, km_saida, km_chegada, valor_frete, status, motoristas(nome)')
    .eq('veiculo_id', veiculoId)
    .order('data_saida', { ascending: false })
    .limit(50)
    .returns<ViagemRow[]>()

  const viagens = data ?? []

  if (viagens.length === 0) {
    return (
      <Card className="p-10 text-center bg-app-card">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-app-subtle text-ink-muted mb-3">
          <Route size={22} />
        </div>
        <div className="text-sm font-medium text-ink">Nenhuma viagem registrada para este veículo.</div>
      </Card>
    )
  }

  return (
    <Card className="bg-app-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-app-subtle/40 hover:bg-app-subtle/40">
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Nº</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Rota</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Motorista</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Saída</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted text-right">KM rodados</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted text-right">Frete</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {viagens.map((v) => {
            const kmRodados = v.km_chegada != null && v.km_saida != null ? Number(v.km_chegada) - Number(v.km_saida) : null
            return (
              <TableRow key={v.id} className="hover:bg-app-subtle/40">
                <TableCell>
                  <Link href={`/viagens/${v.id}`} className="font-mono font-bold text-brand-dark hover:underline">
                    {v.numero}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="truncate">{v.origem}</span>
                    <ArrowRight size={12} className="text-ink-muted shrink-0" />
                    <span className="truncate">{v.destino}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{v.motoristas?.nome ?? '—'}</TableCell>
                <TableCell className="font-mono text-xs">{v.data_saida ? formatDate(v.data_saida) : '—'}</TableCell>
                <TableCell className="text-right font-mono text-sm">{kmRodados != null ? formatKm(kmRodados) : '—'}</TableCell>
                <TableCell className="text-right font-mono text-sm">{v.valor_frete != null ? formatCurrency(Number(v.valor_frete)) : '—'}</TableCell>
                <TableCell><StatusBadge status={v.status} /></TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}
