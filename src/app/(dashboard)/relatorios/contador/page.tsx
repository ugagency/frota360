import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Download } from 'lucide-react'
import { ModuloBloqueado } from '@/components/plano/modulo-bloqueado'
import { formatCurrency } from '@/lib/utils'
import type { Plano } from '@/lib/plano'

export const dynamic = 'force-dynamic'

type SearchParams = { mes?: string; ano?: string }

function periodoLabel(mes: number, ano: number) {
  return new Date(ano, mes - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export default async function RelatorioContadorPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verificar plano
  const { data: vinculo } = await supabase
    .from('usuarios_transportadoras').select('transportadora_id').eq('user_id', user.id)
    .returns<{ transportadora_id: string }[]>().maybeSingle()
  if (!vinculo) redirect('/login')

  const { data: transp } = await supabase
    .from('transportadoras').select('plano, nome')
    .eq('id', vinculo.transportadora_id)
    .returns<{ plano: Plano; nome: string }[]>().maybeSingle()

  if (transp?.plano !== 'profissional') {
    return (
      <ModuloBloqueado
        nomeModulo="Relatório para Contador"
        descricao="Relatório mensal com resumo financeiro, lançamentos, viagens e documentos — formatado para enviar ao seu contador."
      />
    )
  }

  const hoje = new Date()
  const mesParam = searchParams.mes ? Number(searchParams.mes) : (hoje.getMonth() === 0 ? 12 : hoje.getMonth())
  const anoParam = searchParams.ano ? Number(searchParams.ano) : (hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear())
  const mes = Math.max(1, Math.min(12, mesParam))
  const ano = Math.max(2020, Math.min(2030, anoParam))

  const inicioMes = `${ano}-${String(mes).padStart(2, '0')}-01`
  const fimMes    = new Date(ano, mes, 0).toISOString().slice(0, 10)
  const daqui30   = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)

  type FinRow   = { tipo: string; valor: number }
  type LancRow  = { data: string; descricao: string | null; categoria: string; tipo: string; valor: number; veiculos: { placa: string; modelo: string | null } | null }
  type ViagemRow = { numero: string | null; data_saida: string; data_chegada_real: string | null; origem: string; destino: string; km_saida: number | null; km_chegada: number | null; valor_frete: number; veiculos: { placa: string } | null; motoristas: { nome: string } | null }
  type AlertaRow = { titulo: string; descricao: string | null; prioridade: string }

  const [finRes, lancRes, viagRes, alertasRes] = await Promise.all([
    supabase.from('lancamentos_financeiros').select('tipo, valor')
      .eq('transportadora_id', vinculo.transportadora_id).gte('data', inicioMes).lte('data', fimMes)
      .returns<FinRow[]>(),
    supabase.from('lancamentos_financeiros')
      .select('data, descricao, categoria, tipo, valor, veiculos(placa, modelo)')
      .eq('transportadora_id', vinculo.transportadora_id).gte('data', inicioMes).lte('data', fimMes).order('data')
      .returns<LancRow[]>(),
    supabase.from('viagens')
      .select('numero, data_saida, data_chegada_real, origem, destino, km_saida, km_chegada, valor_frete, veiculos(placa), motoristas(nome)')
      .eq('transportadora_id', vinculo.transportadora_id).eq('status', 'concluida')
      .gte('data_saida', inicioMes).lte('data_saida', `${fimMes}T23:59:59`).order('data_saida')
      .returns<ViagemRow[]>(),
    supabase.from('alertas').select('titulo, descricao, prioridade')
      .eq('transportadora_id', vinculo.transportadora_id).eq('status', 'pendente')
      .in('prioridade', ['critico', 'alto']).lte('data_alerta', daqui30).order('prioridade')
      .returns<AlertaRow[]>(),
  ])

  const totalReceita = (finRes.data ?? []).filter((l) => l.tipo === 'receita').reduce((s, l) => s + Number(l.valor), 0)
  const totalDespesa = (finRes.data ?? []).filter((l) => l.tipo === 'despesa').reduce((s, l) => s + Number(l.valor), 0)
  const resultado    = totalReceita - totalDespesa

  const anos = Array.from({ length: 4 }, (_, i) => hoje.getFullYear() - i)
  const meses = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-ink-muted">
        <Link href="/relatorios" className="hover:text-ink">Relatórios</Link>
        <ChevronRight size={12} />
        <span className="text-ink">Para o Contador</span>
      </nav>

      {/* Header com filtros */}
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink leading-none">Relatório para Contador</h1>
          <p className="mt-1.5 text-sm text-ink-muted">{transp.nome} · {periodoLabel(mes, ano)}</p>
        </div>
        <form className="flex items-center gap-2">
          <select name="mes" defaultValue={mes} className="text-sm border rounded px-2 py-1.5 bg-app-card text-ink">
            {meses.map((m) => (
              <option key={m} value={m}>
                {new Date(2000, m - 1).toLocaleDateString('pt-BR', { month: 'long' })}
              </option>
            ))}
          </select>
          <select name="ano" defaultValue={ano} className="text-sm border rounded px-2 py-1.5 bg-app-card text-ink">
            {anos.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <button type="submit" className="text-sm px-3 py-1.5 bg-brand text-white rounded hover:bg-brand-dark transition-colors">
            Filtrar
          </button>
        </form>
      </header>

      {/* Resumo financeiro */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Receita', valor: totalReceita, cor: 'text-accent' },
          { label: 'Despesa', valor: totalDespesa, cor: 'text-red-600' },
          { label: 'Resultado', valor: resultado,  cor: resultado >= 0 ? 'text-accent' : 'text-red-600' },
        ].map((item) => (
          <div key={item.label} className="bg-app-card border rounded-xl p-5">
            <p className="text-xs text-ink-muted font-mono uppercase tracking-wider mb-1">{item.label}</p>
            <p className={`font-display text-2xl font-bold ${item.cor}`}>{formatCurrency(item.valor)}</p>
          </div>
        ))}
      </div>

      {/* Lançamentos */}
      <Section titulo="Lançamentos do período" count={(lancRes.data ?? []).length}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-ink-muted text-left">
              <th className="py-2 font-mono text-[11px] uppercase tracking-wider">Data</th>
              <th className="py-2 font-mono text-[11px] uppercase tracking-wider">Descrição</th>
              <th className="py-2 font-mono text-[11px] uppercase tracking-wider">Categoria</th>
              <th className="py-2 font-mono text-[11px] uppercase tracking-wider">Veículo</th>
              <th className="py-2 font-mono text-[11px] uppercase tracking-wider text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {(lancRes.data ?? []).map((l: any, i: number) => (
              <tr key={i} className="border-b border-border/50 hover:bg-app-subtle/50">
                <td className="py-2 font-mono text-xs">{new Date(l.data).toLocaleDateString('pt-BR')}</td>
                <td className="py-2">{l.descricao ?? '—'}</td>
                <td className="py-2 capitalize">{l.categoria}</td>
                <td className="py-2 font-mono text-xs">{l.veiculos?.placa ?? '—'}</td>
                <td className={`py-2 text-right font-mono text-xs ${l.tipo === 'receita' ? 'text-accent' : 'text-red-600'}`}>
                  {l.tipo === 'despesa' ? '−' : '+'}{formatCurrency(Number(l.valor))}
                </td>
              </tr>
            ))}
            {(lancRes.data ?? []).length === 0 && (
              <tr><td colSpan={5} className="py-4 text-center text-ink-muted text-sm">Nenhum lançamento no período.</td></tr>
            )}
          </tbody>
        </table>
      </Section>

      {/* Viagens */}
      <Section titulo="Viagens concluídas" count={(viagRes.data ?? []).length}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-ink-muted text-left">
              <th className="py-2 font-mono text-[11px] uppercase tracking-wider">Nº</th>
              <th className="py-2 font-mono text-[11px] uppercase tracking-wider">Veículo</th>
              <th className="py-2 font-mono text-[11px] uppercase tracking-wider">Motorista</th>
              <th className="py-2 font-mono text-[11px] uppercase tracking-wider">Rota</th>
              <th className="py-2 font-mono text-[11px] uppercase tracking-wider text-right">KM</th>
              <th className="py-2 font-mono text-[11px] uppercase tracking-wider text-right">Frete</th>
            </tr>
          </thead>
          <tbody>
            {(viagRes.data ?? []).map((v: any, i: number) => {
              const km = v.km_saida != null && v.km_chegada != null ? Number(v.km_chegada) - Number(v.km_saida) : null
              return (
                <tr key={i} className="border-b border-border/50 hover:bg-app-subtle/50">
                  <td className="py-2 font-mono text-xs">{v.numero ?? '—'}</td>
                  <td className="py-2 font-mono text-xs">{v.veiculos?.placa ?? '—'}</td>
                  <td className="py-2">{v.motoristas?.nome ?? '—'}</td>
                  <td className="py-2 text-xs">{v.origem} → {v.destino}</td>
                  <td className="py-2 text-right font-mono text-xs">{km != null ? km.toLocaleString('pt-BR') : '—'}</td>
                  <td className="py-2 text-right font-mono text-xs text-accent">{formatCurrency(Number(v.valor_frete))}</td>
                </tr>
              )
            })}
            {(viagRes.data ?? []).length === 0 && (
              <tr><td colSpan={6} className="py-4 text-center text-ink-muted text-sm">Nenhuma viagem concluída no período.</td></tr>
            )}
          </tbody>
        </table>
      </Section>

      {/* Alertas críticos */}
      {(alertasRes.data ?? []).length > 0 && (
        <Section titulo="Documentos a vencer (próximos 30 dias)" count={(alertasRes.data ?? []).length}>
          <ul className="space-y-2">
            {(alertasRes.data ?? []).map((a: any, i: number) => (
              <li key={i} className={`flex items-start gap-3 px-3 py-2 rounded text-sm ${a.prioridade === 'critico' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
                <span className={`text-xs font-mono uppercase pt-0.5 ${a.prioridade === 'critico' ? 'text-red-600' : 'text-amber-700'}`}>{a.prioridade}</span>
                <div>
                  <p className="font-medium text-ink">{a.titulo}</p>
                  {a.descricao && <p className="text-ink-muted text-xs">{a.descricao}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Exportar CSV */}
      <div className="flex justify-end">
        <Link
          href={`/api/relatorios/contador-csv?mes=${mes}&ano=${ano}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-app-card border rounded text-sm hover:bg-app-subtle transition-colors"
        >
          <Download size={15} />
          Exportar CSV
        </Link>
      </div>
    </div>
  )
}

function Section({ titulo, count, children }: { titulo: string; count: number; children: React.ReactNode }) {
  return (
    <div className="bg-app-card border rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b flex items-center justify-between">
        <h2 className="font-display font-semibold text-ink">{titulo}</h2>
        <span className="text-xs text-ink-muted font-mono">{count} {count === 1 ? 'item' : 'itens'}</span>
      </div>
      <div className="px-5 py-3 overflow-x-auto">{children}</div>
    </div>
  )
}
