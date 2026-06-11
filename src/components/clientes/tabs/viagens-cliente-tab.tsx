import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import Link from 'next/link'

type ViagemLinha = {
  id: string
  numero: string
  origem: string
  destino: string
  status: string
  valor_frete: number | null
  data_saida: string | null
  data_chegada: string | null
}

export async function ViagensClienteTab({ razaoSocial }: { razaoSocial: string }) {
  const supabase = createClient()

  const { data } = await supabase
    .from('viagens')
    .select('id, numero, origem, destino, status, valor_frete, data_saida, data_chegada')
    .ilike('cliente', `%${razaoSocial}%`)
    .order('data_saida', { ascending: false })
    .limit(100)
    .returns<ViagemLinha[]>()

  const viagens = data ?? []

  if (viagens.length === 0) {
    return (
      <Card className="p-10 text-center bg-app-card">
        <div className="text-sm text-ink-secondary">Nenhuma viagem registrada para este cliente.</div>
        <div className="mt-1 text-xs text-ink-muted">
          Viagens são vinculadas pelo nome do cliente informado no cadastro da viagem.
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-app-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-app-subtle/50">
              <th className="text-left px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-ink-muted">Nº</th>
              <th className="text-left px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-ink-muted">Origem → Destino</th>
              <th className="text-left px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-ink-muted">Status</th>
              <th className="text-right px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-ink-muted">Frete</th>
              <th className="text-left px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-ink-muted hidden sm:table-cell">Saída</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {viagens.map((v) => (
              <tr key={v.id} className="hover:bg-app-subtle/40 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/viagens/${v.id}`} className="font-mono text-xs text-brand hover:text-brand-dark">
                    {v.numero}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-secondary">
                  <span className="text-xs">{v.origem} → {v.destino}</span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={v.status as Parameters<typeof StatusBadge>[0]['status']} />
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-ink">
                  {v.valor_frete ? formatCurrency(v.valor_frete) : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-ink-secondary hidden sm:table-cell">
                  {v.data_saida ? formatDate(v.data_saida) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
