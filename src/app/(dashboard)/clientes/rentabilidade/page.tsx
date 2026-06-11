import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, TrendingUp, Info } from 'lucide-react'
import { ModuloBloqueado } from '@/components/plano/modulo-bloqueado'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { Plano } from '@/lib/plano'

export const dynamic = 'force-dynamic'

type ViagemRow = {
  cliente: string | null
  valor_frete: number | null
}

export default async function RentabilidadePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vinculo } = await supabase
    .from('usuarios_transportadoras')
    .select('transportadora_id')
    .eq('user_id', user.id)
    .returns<{ transportadora_id: string }[]>()
    .maybeSingle()
  if (!vinculo) redirect('/login')

  const { data: transp } = await supabase
    .from('transportadoras')
    .select('plano')
    .eq('id', vinculo.transportadora_id)
    .returns<{ plano: Plano }[]>()
    .maybeSingle()

  if (transp?.plano !== 'profissional') {
    return (
      <ModuloBloqueado
        nomeModulo="Rentabilidade por Cliente"
        descricao="Veja o ranking de clientes por faturamento gerado — identifique seus melhores clientes e priorize sua carteira."
      />
    )
  }

  const { data: rawViagens } = await supabase
    .from('viagens')
    .select('cliente, valor_frete')
    .eq('transportadora_id', vinculo.transportadora_id)
    .eq('status', 'concluida')
    .not('cliente', 'is', null)

  const data = (rawViagens as ViagemRow[] | null)

  // Agrupar por cliente (texto livre)
  const mapaClientes = new Map<string, { faturamento: number; viagens: number }>()
  for (const v of data ?? []) {
    const nome = (v.cliente ?? '').trim()
    if (!nome) continue
    const atual = mapaClientes.get(nome) ?? { faturamento: 0, viagens: 0 }
    atual.faturamento += v.valor_frete ?? 0
    atual.viagens += 1
    mapaClientes.set(nome, atual)
  }

  const ranking = Array.from(mapaClientes.entries())
    .map(([nome, d]) => ({ nome, ...d, ticketMedio: d.viagens ? d.faturamento / d.viagens : 0 }))
    .sort((a, b) => b.faturamento - a.faturamento)

  const totalFaturamento = ranking.reduce((s, r) => s + r.faturamento, 0)
  const totalViagens     = ranking.reduce((s, r) => s + r.viagens, 0)

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-ink-muted">
        <Link href="/clientes" className="hover:text-ink">Clientes</Link>
        <ChevronRight size={12} />
        <span className="text-ink">Rentabilidade</span>
      </nav>

      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink leading-none">Rentabilidade</h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            Ranking por faturamento — {ranking.length} {ranking.length === 1 ? 'cliente' : 'clientes'} com viagens concluídas
          </p>
        </div>
      </header>

      {/* KPIs resumo */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 bg-app-card">
          <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">Faturamento total</div>
          <div className="mt-1 font-display text-2xl font-bold text-ink">{formatCurrency(totalFaturamento)}</div>
        </Card>
        <Card className="p-4 bg-app-card">
          <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">Viagens concluídas</div>
          <div className="mt-1 font-display text-2xl font-bold text-ink">{totalViagens}</div>
        </Card>
        <Card className="p-4 bg-app-card">
          <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">Clientes ativos</div>
          <div className="mt-1 font-display text-2xl font-bold text-ink">{ranking.length}</div>
        </Card>
      </div>

      {/* Aviso metodologia */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700">
        <Info size={14} className="shrink-0 mt-0.5" />
        <span>
          Análise baseada nas viagens concluídas. O campo &quot;cliente&quot; da viagem deve coincidir com a razão social cadastrada.
          Não inclui cálculo de margem — disponível em versão futura.
        </span>
      </div>

      {ranking.length === 0 ? (
        <Card className="p-12 text-center bg-app-card">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-brand-surface text-brand mb-3">
            <TrendingUp size={28} />
          </div>
          <div className="font-display text-lg font-semibold text-ink">Nenhuma viagem concluída encontrada.</div>
          <div className="mt-1 text-sm text-ink-secondary">Conclua viagens com o campo "cliente" preenchido para ver o ranking.</div>
        </Card>
      ) : (
        <Card className="bg-app-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-app-subtle/50">
                  <th className="text-left px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-ink-muted w-8">#</th>
                  <th className="text-left px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-ink-muted">Cliente</th>
                  <th className="text-right px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-ink-muted">Viagens</th>
                  <th className="text-right px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-ink-muted">Faturamento</th>
                  <th className="text-right px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-ink-muted hidden sm:table-cell">Ticket médio</th>
                  <th className="text-right px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-ink-muted hidden md:table-cell">Part. %</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ranking.map((r, idx) => {
                  const participacao = totalFaturamento ? (r.faturamento / totalFaturamento) * 100 : 0
                  return (
                    <tr key={r.nome} className="hover:bg-app-subtle/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-ink-muted">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-ink">{r.nome}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-ink-secondary">{r.viagens}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-medium text-ink">{formatCurrency(r.faturamento)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-ink-secondary hidden sm:table-cell">
                        {formatCurrency(r.ticketMedio)}
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-app-subtle rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-brand rounded-full"
                              style={{ width: `${Math.min(100, participacao)}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs text-ink-muted w-10 text-right">
                            {participacao.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
