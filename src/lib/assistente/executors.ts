import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type SB = SupabaseClient<Database, 'public', any>

// =====================================================================
// Utilidades
// =====================================================================
function normalizarPlacaQuery(p: string): string {
  return p.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7)
}

function mesAtualISO() {
  const d = new Date()
  return {
    inicio: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10),
    fim:    new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10),
  }
}

const PESO_PRIORIDADE: Record<string, number> = { critico: 0, alto: 1, medio: 2, baixo: 3 }

// =====================================================================
// 1. resumo_operacao
// =====================================================================
export async function resumo_operacao(supabase: SB, tid: string) {
  const m = mesAtualISO()

  const [veiculos, viagens, alertas, financeiro] = await Promise.all([
    supabase.from('veiculos').select('status').eq('transportadora_id', tid)
      .returns<{ status: string }[]>(),
    supabase.from('viagens')
      .select('numero, origem, destino, motoristas(nome), veiculos(placa)')
      .eq('transportadora_id', tid).eq('status', 'em_andamento')
      .returns<{ numero: string; origem: string; destino: string; motoristas: { nome: string } | null; veiculos: { placa: string } | null }[]>(),
    supabase.from('alertas')
      .select('titulo, descricao, prioridade, data_alerta')
      .eq('transportadora_id', tid).eq('status', 'pendente').eq('prioridade', 'critico')
      .limit(10)
      .returns<{ titulo: string; descricao: string | null; prioridade: string; data_alerta: string }[]>(),
    supabase.from('lancamentos_financeiros').select('tipo, valor')
      .eq('transportadora_id', tid).gte('data', m.inicio).lte('data', m.fim)
      .returns<{ tipo: 'receita' | 'despesa'; valor: number }[]>(),
  ])

  const v = veiculos.data ?? []
  const counts = {
    total: v.length,
    ativos: v.filter((x) => x.status === 'ativo').length,
    em_viagem: v.filter((x) => x.status === 'em_viagem').length,
    em_manutencao: v.filter((x) => x.status === 'em_manutencao').length,
    inativos: v.filter((x) => x.status === 'inativo').length,
  }

  let receita = 0, despesa = 0
  for (const l of financeiro.data ?? []) {
    if (l.tipo === 'receita') receita += Number(l.valor); else despesa += Number(l.valor)
  }

  return {
    data_hoje: new Date().toISOString().slice(0, 10),
    frota: counts,
    viagens_em_andamento: (viagens.data ?? []).map((v) => ({
      numero: v.numero, placa: v.veiculos?.placa, motorista: v.motoristas?.nome,
      rota: `${v.origem} → ${v.destino}`,
    })),
    alertas_criticos: alertas.data ?? [],
    financeiro_mes: { receita, despesa, resultado: receita - despesa },
  }
}

// =====================================================================
// 2. listar_veiculos
// =====================================================================
export async function listar_veiculos(supabase: SB, tid: string, args: { status?: string; tipo?: string; proprietario?: string }) {
  let q = supabase.from('veiculos')
    .select('placa, marca, modelo, ano, tipo, status, proprietario, km_atual, data_proxima_revisao')
    .eq('transportadora_id', tid).order('placa').limit(100)

  if (args.status) q = q.eq('status', args.status)
  if (args.tipo) q = q.eq('tipo', args.tipo)
  if (args.proprietario) q = q.eq('proprietario', args.proprietario)

  const { data } = await q.returns<any[]>()
  const list = data ?? []
  return { total: list.length, veiculos: list }
}

// =====================================================================
// 3. detalhes_veiculo
// =====================================================================
export async function detalhes_veiculo(supabase: SB, tid: string, args: { placa: string }) {
  const placa = normalizarPlacaQuery(args.placa)
  if (!placa) return { erro: 'Placa inválida' }

  const { data } = await supabase.from('veiculos')
    .select('id, placa, marca, modelo, ano, cor, tipo, status, proprietario, km_atual, km_proxima_revisao, data_proxima_revisao, data_licenciamento, renavam, chassi')
    .eq('transportadora_id', tid).ilike('placa', `%${placa}%`)
    .returns<any[]>().limit(1).maybeSingle()

  if (!data) return { erro: `Veículo ${args.placa} não encontrado.` }

  const [alertas, ultimaManut] = await Promise.all([
    supabase.from('alertas').select('titulo, descricao, prioridade, data_alerta')
      .eq('referencia_id', data.id).eq('status', 'pendente')
      .returns<any[]>(),
    supabase.from('manutencoes').select('tipo, descricao, data_entrada, data_saida, valor_total, status')
      .eq('veiculo_id', data.id).order('data_entrada', { ascending: false }).limit(1)
      .returns<any[]>().maybeSingle(),
  ])

  return {
    veiculo: data,
    alertas_ativos: alertas.data ?? [],
    ultima_manutencao: ultimaManut.data ?? null,
  }
}

// =====================================================================
// 4. listar_motoristas
// =====================================================================
export async function listar_motoristas(supabase: SB, tid: string, args: { status?: string; documentos_vencendo?: boolean }) {
  let q = supabase.from('motoristas')
    .select('nome, cpf, telefone, cnh_categoria, cnh_validade, mopp_validade, tipo, status')
    .eq('transportadora_id', tid).order('nome').limit(100)

  if (args.status) q = q.eq('status', args.status)

  if (args.documentos_vencendo) {
    const limite = new Date()
    limite.setDate(limite.getDate() + 60)
    const lim = limite.toISOString().slice(0, 10)
    q = q.or(`cnh_validade.lte.${lim},mopp_validade.lte.${lim}`)
  }

  const { data } = await q.returns<any[]>()
  return { total: (data ?? []).length, motoristas: data ?? [] }
}

// =====================================================================
// 5. listar_viagens
// =====================================================================
export async function listar_viagens(supabase: SB, tid: string, args: {
  status?: string; periodo_inicio?: string; periodo_fim?: string
  placa_veiculo?: string; nome_motorista?: string; limite?: number
}) {
  const limite = Math.min(Math.max(args.limite ?? 10, 1), 50)

  let q = supabase.from('viagens')
    .select('numero, origem, destino, cliente, data_saida, data_chegada, data_chegada_real, status, valor_frete, veiculos(placa, modelo), motoristas(nome)')
    .eq('transportadora_id', tid).order('data_saida', { ascending: false, nullsFirst: false }).limit(limite)

  if (args.status) q = q.eq('status', args.status)
  if (args.periodo_inicio) q = q.gte('data_saida', args.periodo_inicio)
  if (args.periodo_fim) q = q.lte('data_saida', `${args.periodo_fim}T23:59:59`)

  if (args.placa_veiculo) {
    const placa = normalizarPlacaQuery(args.placa_veiculo)
    // resolve veiculo_id pela placa
    const { data: vRow } = await supabase.from('veiculos').select('id').eq('transportadora_id', tid)
      .ilike('placa', `%${placa}%`).limit(1).maybeSingle()
    if (vRow) q = q.eq('veiculo_id', (vRow as any).id)
    else return { total: 0, viagens: [], aviso: `Veículo ${args.placa_veiculo} não encontrado.` }
  }

  if (args.nome_motorista) {
    const { data: mRow } = await supabase.from('motoristas').select('id').eq('transportadora_id', tid)
      .ilike('nome', `%${args.nome_motorista}%`).limit(1).maybeSingle()
    if (mRow) q = q.eq('motorista_id', (mRow as any).id)
    else return { total: 0, viagens: [], aviso: `Motorista "${args.nome_motorista}" não encontrado.` }
  }

  const { data } = await q.returns<any[]>()
  return { total: (data ?? []).length, viagens: data ?? [] }
}

// =====================================================================
// 6. listar_manutencoes
// =====================================================================
export async function listar_manutencoes(supabase: SB, tid: string, args: {
  status?: string; tipo?: string; placa_veiculo?: string; limite?: number
}) {
  const limite = Math.min(Math.max(args.limite ?? 10, 1), 50)

  let q = supabase.from('manutencoes')
    .select('tipo, descricao, oficina, data_entrada, data_saida, valor_total, status, veiculos(placa, modelo)')
    .eq('transportadora_id', tid).order('data_entrada', { ascending: false }).limit(limite)

  if (args.status) q = q.eq('status', args.status)
  if (args.tipo) q = q.eq('tipo', args.tipo)

  if (args.placa_veiculo) {
    const placa = normalizarPlacaQuery(args.placa_veiculo)
    const { data: vRow } = await supabase.from('veiculos').select('id').eq('transportadora_id', tid)
      .ilike('placa', `%${placa}%`).limit(1).maybeSingle()
    if (vRow) q = q.eq('veiculo_id', (vRow as any).id)
    else return { total: 0, manutencoes: [], aviso: `Veículo ${args.placa_veiculo} não encontrado.` }
  }

  const { data } = await q.returns<any[]>()
  return { total: (data ?? []).length, manutencoes: data ?? [] }
}

// =====================================================================
// 7. resumo_financeiro
// =====================================================================
export async function resumo_financeiro(supabase: SB, tid: string, args: {
  periodo_inicio?: string; periodo_fim?: string; placa_veiculo?: string
}) {
  const m = mesAtualISO()
  const de = args.periodo_inicio ?? m.inicio
  const ate = args.periodo_fim ?? m.fim

  let q = supabase.from('lancamentos_financeiros').select('tipo, categoria, valor, data')
    .eq('transportadora_id', tid).gte('data', de).lte('data', ate)

  if (args.placa_veiculo) {
    const placa = normalizarPlacaQuery(args.placa_veiculo)
    const { data: vRow } = await supabase.from('veiculos').select('id').eq('transportadora_id', tid)
      .ilike('placa', `%${placa}%`).limit(1).maybeSingle()
    if (vRow) q = q.eq('veiculo_id', (vRow as any).id)
    else return { aviso: `Veículo ${args.placa_veiculo} não encontrado.` }
  }

  const { data } = await q.returns<{ tipo: 'receita' | 'despesa'; categoria: string; valor: number; data: string }[]>()

  let receita = 0, despesa = 0
  const porCategoria: Record<string, number> = {}
  for (const l of data ?? []) {
    const v = Number(l.valor)
    if (l.tipo === 'receita') receita += v
    else {
      despesa += v
      porCategoria[l.categoria] = (porCategoria[l.categoria] ?? 0) + v
    }
  }

  return {
    periodo: { de, ate },
    veiculo: args.placa_veiculo ?? null,
    receita_total: receita,
    despesa_total: despesa,
    resultado: receita - despesa,
    margem_percentual: receita > 0 ? Number(((receita - despesa) / receita * 100).toFixed(1)) : null,
    despesas_por_categoria: porCategoria,
    quantidade_lancamentos: (data ?? []).length,
  }
}

// =====================================================================
// 8. custo_por_veiculo
// =====================================================================
export async function custo_por_veiculo(supabase: SB, tid: string, args: {
  periodo_inicio?: string; periodo_fim?: string
}) {
  const m = mesAtualISO()
  const de = args.periodo_inicio ?? m.inicio
  const ate = args.periodo_fim ?? m.fim

  const [veiculos, lancs, viagens] = await Promise.all([
    supabase.from('veiculos').select('id, placa, modelo').eq('transportadora_id', tid)
      .returns<{ id: string; placa: string; modelo: string | null }[]>(),
    supabase.from('lancamentos_financeiros').select('veiculo_id, tipo, categoria, valor')
      .eq('transportadora_id', tid).gte('data', de).lte('data', ate)
      .returns<{ veiculo_id: string | null; tipo: 'receita' | 'despesa'; categoria: string; valor: number }[]>(),
    supabase.from('viagens').select('veiculo_id, km_saida, km_chegada')
      .eq('transportadora_id', tid).eq('status', 'concluida')
      .gte('data_chegada_real', de).lte('data_chegada_real', `${ate}T23:59:59`)
      .returns<{ veiculo_id: string; km_saida: number | null; km_chegada: number | null }[]>(),
  ])

  type Row = {
    placa: string; modelo: string | null
    combustivel: number; manutencao: number; pedagio: number; multa: number; outros: number
    total: number; km_rodados: number; custo_por_km: number
  }
  const agg = new Map<string, Row>()

  for (const v of veiculos.data ?? []) {
    agg.set(v.id, {
      placa: v.placa, modelo: v.modelo,
      combustivel: 0, manutencao: 0, pedagio: 0, multa: 0, outros: 0,
      total: 0, km_rodados: 0, custo_por_km: 0,
    })
  }

  for (const l of lancs.data ?? []) {
    if (l.tipo !== 'despesa' || !l.veiculo_id) continue
    const r = agg.get(l.veiculo_id)
    if (!r) continue
    const v = Number(l.valor)
    r.total += v
    if (l.categoria === 'combustivel') r.combustivel += v
    else if (l.categoria === 'manutencao') r.manutencao += v
    else if (l.categoria === 'pedagio') r.pedagio += v
    else if (l.categoria === 'multa') r.multa += v
    else r.outros += v
  }

  for (const v of viagens.data ?? []) {
    if (v.km_saida == null || v.km_chegada == null) continue
    const r = agg.get(v.veiculo_id)
    if (!r) continue
    r.km_rodados += Number(v.km_chegada) - Number(v.km_saida)
  }

  const rows = Array.from(agg.values())
    .filter((r) => r.total > 0)
    .map((r) => ({ ...r, custo_por_km: r.km_rodados > 0 ? Number((r.total / r.km_rodados).toFixed(2)) : 0 }))
    .sort((a, b) => b.total - a.total)

  return { periodo: { de, ate }, veiculos: rows }
}

// =====================================================================
// 9. listar_alertas
// =====================================================================
export async function listar_alertas(supabase: SB, tid: string, args: {
  status?: string; prioridade?: string; tipo?: string
}) {
  let q = supabase.from('alertas')
    .select('tipo, referencia_tipo, titulo, descricao, data_alerta, status, prioridade')
    .eq('transportadora_id', tid).limit(30)

  q = q.eq('status', args.status ?? 'pendente')
  if (args.prioridade) q = q.eq('prioridade', args.prioridade)
  if (args.tipo) q = q.eq('tipo', args.tipo)

  const { data } = await q.returns<any[]>()
  const sorted = (data ?? []).slice().sort(
    (a, b) => (PESO_PRIORIDADE[a.prioridade] ?? 99) - (PESO_PRIORIDADE[b.prioridade] ?? 99),
  )

  return { total: sorted.length, alertas: sorted }
}

// =====================================================================
// 10. ranking_motoristas
// =====================================================================
export async function ranking_motoristas(supabase: SB, tid: string, args: {
  criterio: 'viagens' | 'km_rodados' | 'frete_gerado'
  periodo_inicio?: string; periodo_fim?: string; limite?: number
}) {
  const m = mesAtualISO()
  const de = args.periodo_inicio ?? m.inicio
  const ate = args.periodo_fim ?? m.fim
  const limite = Math.min(Math.max(args.limite ?? 5, 1), 20)

  const [motoristas, viagens] = await Promise.all([
    supabase.from('motoristas').select('id, nome').eq('transportadora_id', tid)
      .returns<{ id: string; nome: string }[]>(),
    supabase.from('viagens').select('motorista_id, km_saida, km_chegada, valor_frete')
      .eq('transportadora_id', tid).eq('status', 'concluida')
      .gte('data_chegada_real', de).lte('data_chegada_real', `${ate}T23:59:59`)
      .returns<{ motorista_id: string; km_saida: number | null; km_chegada: number | null; valor_frete: number | null }[]>(),
  ])

  type Stat = { nome: string; viagens: number; km_rodados: number; frete_gerado: number }
  const mp = new Map<string, Stat>()
  for (const m of motoristas.data ?? []) mp.set(m.id, { nome: m.nome, viagens: 0, km_rodados: 0, frete_gerado: 0 })

  for (const v of viagens.data ?? []) {
    const s = mp.get(v.motorista_id)
    if (!s) continue
    s.viagens++
    if (v.km_saida != null && v.km_chegada != null) s.km_rodados += Number(v.km_chegada) - Number(v.km_saida)
    if (v.valor_frete != null) s.frete_gerado += Number(v.valor_frete)
  }

  const rankKey = args.criterio === 'km_rodados' ? 'km_rodados' :
                  args.criterio === 'frete_gerado' ? 'frete_gerado' : 'viagens'

  const ranking = Array.from(mp.values())
    .filter((s) => s.viagens > 0)
    .sort((a, b) => b[rankKey] - a[rankKey])
    .slice(0, limite)

  return { criterio: args.criterio, periodo: { de, ate }, ranking }
}

// =====================================================================
// Dispatcher
// =====================================================================
export const EXECUTORS = {
  resumo_operacao,
  listar_veiculos,
  detalhes_veiculo,
  listar_motoristas,
  listar_viagens,
  listar_manutencoes,
  resumo_financeiro,
  custo_por_veiculo,
  listar_alertas,
  ranking_motoristas,
} as const

export type ExecutorName = keyof typeof EXECUTORS

export async function executarFuncao(
  name: string,
  args: Record<string, unknown>,
  supabase: SB,
  tid: string,
): Promise<Record<string, unknown>> {
  const fn = (EXECUTORS as Record<string, (s: SB, t: string, a: any) => Promise<unknown>>)[name]
  if (!fn) return { erro: `Função desconhecida: ${name}` }
  try {
    const result = await fn(supabase, tid, args)
    return result as Record<string, unknown>
  } catch (e) {
    return { erro: e instanceof Error ? e.message : 'Falha ao executar consulta' }
  }
}
