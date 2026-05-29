import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDate, formatKm } from '@/lib/utils'
import { FinanceiroPie } from './financeiro-pie'

type Lancamento = {
  id: string
  tipo: 'receita' | 'despesa'
  categoria: string
  descricao: string
  valor: number
  data: string
}

type Viagem = { km_saida: number | null; km_chegada: number | null }

const CATEGORIA_LABEL: Record<string, string> = {
  combustivel: 'Combustível',
  manutencao:  'Manutenção',
  pedagio:     'Pedágio',
  multa:       'Multa',
  frete:       'Frete',
  adiantamento:'Adiantamento',
  outros:      'Outros',
}

export async function FinanceiroVeiculoTab({ veiculoId }: { veiculoId: string }) {
  const supabase = createClient()

  const [lancamentosRes, viagensRes] = await Promise.all([
    supabase
      .from('lancamentos_financeiros')
      .select('id, tipo, categoria, descricao, valor, data')
      .eq('veiculo_id', veiculoId)
      .order('data', { ascending: false })
      .returns<Lancamento[]>(),
    supabase
      .from('viagens')
      .select('km_saida, km_chegada')
      .eq('veiculo_id', veiculoId)
      .eq('status', 'concluida')
      .returns<Viagem[]>(),
  ])

  const lancamentos = lancamentosRes.data ?? []
  const viagens = viagensRes.data ?? []

  // Agregados
  let receitas = 0, despesas = 0
  const despPorCategoria: Record<string, number> = {}
  for (const l of lancamentos) {
    const v = Number(l.valor)
    if (l.tipo === 'receita') receitas += v
    else {
      despesas += v
      despPorCategoria[l.categoria] = (despPorCategoria[l.categoria] ?? 0) + v
    }
  }
  const resultado = receitas - despesas
  const kmTotal = viagens.reduce((acc, v) => {
    if (v.km_chegada != null && v.km_saida != null) return acc + (Number(v.km_chegada) - Number(v.km_saida))
    return acc
  }, 0)
  const custoPorKm = kmTotal > 0 ? despesas / kmTotal : 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiSimple label="Receitas"       value={formatCurrency(receitas)} tone="accent" />
        <KpiSimple label="Despesas"       value={formatCurrency(despesas)} tone="danger" />
        <KpiSimple label="Resultado"      value={formatCurrency(resultado)} tone={resultado >= 0 ? 'accent' : 'danger'} />
        <KpiSimple label="Custo / KM"     value={kmTotal > 0 ? formatCurrency(custoPorKm) : '—'} tone="neutral"
                    hint={`KM rodado: ${formatKm(kmTotal)}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="bg-app-card p-5 lg:col-span-2">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted mb-3">
            Despesas por categoria
          </h3>
          {Object.keys(despPorCategoria).length === 0 ? (
            <p className="text-sm text-ink-muted">Sem despesas registradas.</p>
          ) : (
            <FinanceiroPie
              data={Object.entries(despPorCategoria).map(([k, v]) => ({
                name: CATEGORIA_LABEL[k] ?? k,
                value: Number(v.toFixed(2)),
              }))}
            />
          )}
        </Card>

        <Card className="bg-app-card lg:col-span-3 overflow-hidden">
          <div className="p-5 pb-2">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">
              Últimos lançamentos
            </h3>
          </div>
          {lancamentos.length === 0 ? (
            <p className="p-5 pt-2 text-sm text-ink-muted">Nenhum lançamento vinculado a este veículo.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-app-subtle/40 hover:bg-app-subtle/40">
                  <TableHead className="font-mono text-[10px] uppercase text-ink-muted">Data</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase text-ink-muted">Categoria</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase text-ink-muted">Descrição</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase text-ink-muted text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lancamentos.slice(0, 20).map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs">{formatDate(l.data)}</TableCell>
                    <TableCell className="text-xs">{CATEGORIA_LABEL[l.categoria] ?? l.categoria}</TableCell>
                    <TableCell className="text-sm max-w-[260px] truncate">{l.descricao}</TableCell>
                    <TableCell className={`text-right font-mono text-sm ${l.tipo === 'receita' ? 'text-accent' : 'text-red-700'}`}>
                      {l.tipo === 'receita' ? '+' : '−'} {formatCurrency(Number(l.valor))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  )
}

function KpiSimple({ label, value, tone, hint }: {
  label: string; value: string; tone: 'accent' | 'danger' | 'neutral'; hint?: string
}) {
  const color = tone === 'accent' ? 'text-accent' : tone === 'danger' ? 'text-red-700' : 'text-ink'
  return (
    <Card className="p-4 bg-app-card">
      <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">{label}</div>
      <div className={`mt-1.5 font-display text-2xl font-bold tabular-nums ${color}`}>{value}</div>
      {hint && <div className="mt-1 text-[11px] font-mono text-ink-muted">{hint}</div>}
    </Card>
  )
}
