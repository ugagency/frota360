import 'server-only'
import { getDaysUntil, getAlertPriorityFromDays, type AlertPriority } from '@/lib/utils'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Aceita qualquer instância de SupabaseClient — o tipo Database vem do call site
type SB = SupabaseClient<Database, 'public', any>
type AlertaTipo = 'manutencao_km' | 'manutencao_data' | 'cnh_vencimento' | 'mopp_vencimento' | 'licenciamento'

type Candidato = {
  tipo: AlertaTipo
  referencia_id: string
  referencia_tipo: 'veiculo' | 'motorista'
  titulo: string
  descricao: string | null
  data_alerta: string // YYYY-MM-DD
  prioridade: AlertPriority
}

// ---------------------------------------------------------------------
// Função pública — chamada do dashboard layout
// ---------------------------------------------------------------------
export async function gerarAlertas(supabase: SB, transportadoraId: string) {
  const candidatos: Candidato[] = []

  type VeiculoRow = {
    id: string; placa: string; modelo: string | null; km_atual: number
    km_proxima_revisao: number | null; data_proxima_revisao: string | null; data_licenciamento: string | null
  }
  type MotoristaRow = { id: string; nome: string; cnh_validade: string | null; mopp_validade: string | null }

  const [veiculos, motoristas] = await Promise.all([
    supabase
      .from('veiculos')
      .select('id, placa, modelo, km_atual, km_proxima_revisao, data_proxima_revisao, data_licenciamento')
      .eq('transportadora_id', transportadoraId)
      .neq('status', 'inativo')
      .returns<VeiculoRow[]>(),
    supabase
      .from('motoristas')
      .select('id, nome, cnh_validade, mopp_validade')
      .eq('transportadora_id', transportadoraId)
      .neq('status', 'inativo')
      .returns<MotoristaRow[]>(),
  ])

  for (const v of veiculos.data ?? []) {
    // 1. KM até próxima revisão
    if (v.km_proxima_revisao != null) {
      const restante = Number(v.km_proxima_revisao) - Number(v.km_atual)
      if (restante < 5000) {
        candidatos.push({
          tipo: 'manutencao_km',
          referencia_id: v.id,
          referencia_tipo: 'veiculo',
          titulo: `Revisão por KM — ${v.placa}${v.modelo ? ` (${v.modelo})` : ''}`,
          descricao: restante > 0
            ? `Faltam ${Math.round(restante).toLocaleString('pt-BR')} km para a próxima revisão.`
            : `Revisão atrasada em ${Math.abs(Math.round(restante)).toLocaleString('pt-BR')} km.`,
          data_alerta: hojeISO(),
          prioridade: prioridadeKm(restante),
        })
      }
    }

    // 2. Data de próxima revisão
    if (v.data_proxima_revisao) {
      const dias = getDaysUntil(v.data_proxima_revisao)
      if (dias <= 30) {
        candidatos.push({
          tipo: 'manutencao_data',
          referencia_id: v.id,
          referencia_tipo: 'veiculo',
          titulo: `Revisão programada — ${v.placa}`,
          descricao: dias >= 0
            ? `Revisão em ${dias} ${dias === 1 ? 'dia' : 'dias'}.`
            : `Revisão atrasada há ${Math.abs(dias)} dias.`,
          data_alerta: v.data_proxima_revisao,
          prioridade: getAlertPriorityFromDays(dias),
        })
      }
    }

    // 3. Licenciamento
    if (v.data_licenciamento) {
      const dias = getDaysUntil(v.data_licenciamento)
      if (dias <= 30) {
        candidatos.push({
          tipo: 'licenciamento',
          referencia_id: v.id,
          referencia_tipo: 'veiculo',
          titulo: `Licenciamento — ${v.placa}`,
          descricao: dias >= 0
            ? `Licenciamento vence em ${dias} ${dias === 1 ? 'dia' : 'dias'}.`
            : `Licenciamento vencido há ${Math.abs(dias)} dias.`,
          data_alerta: v.data_licenciamento,
          prioridade: getAlertPriorityFromDays(dias),
        })
      }
    }
  }

  for (const m of motoristas.data ?? []) {
    // 4. CNH
    if (m.cnh_validade) {
      const dias = getDaysUntil(m.cnh_validade)
      if (dias <= 60) {
        candidatos.push({
          tipo: 'cnh_vencimento',
          referencia_id: m.id,
          referencia_tipo: 'motorista',
          titulo: `CNH — ${m.nome}`,
          descricao: dias >= 0
            ? `CNH vence em ${dias} ${dias === 1 ? 'dia' : 'dias'}.`
            : `CNH vencida há ${Math.abs(dias)} dias.`,
          data_alerta: m.cnh_validade,
          prioridade: getAlertPriorityFromDays(dias),
        })
      }
    }

    // 5. MOPP
    if (m.mopp_validade) {
      const dias = getDaysUntil(m.mopp_validade)
      if (dias <= 60) {
        candidatos.push({
          tipo: 'mopp_vencimento',
          referencia_id: m.id,
          referencia_tipo: 'motorista',
          titulo: `MOPP — ${m.nome}`,
          descricao: dias >= 0
            ? `MOPP vence em ${dias} ${dias === 1 ? 'dia' : 'dias'}.`
            : `MOPP vencido há ${Math.abs(dias)} dias.`,
          data_alerta: m.mopp_validade,
          prioridade: getAlertPriorityFromDays(dias),
        })
      }
    }
  }

  // ---- Reconciliação com o banco --------------------------------------
  type ExistenteRow = {
    id: string; tipo: string; referencia_id: string; status: string; prioridade: string; data_alerta: string
  }
  const { data: existentes } = await supabase
    .from('alertas')
    .select('id, tipo, referencia_id, status, prioridade, data_alerta')
    .eq('transportadora_id', transportadoraId)
    .returns<ExistenteRow[]>()

  const key = (t: string, r: string) => `${t}::${r}`
  const ativos = new Map<string, { id: string; prioridade: string; data_alerta: string }>()
  const resolvidos = new Set<string>()

  for (const e of existentes ?? []) {
    if (e.status === 'resolvido') resolvidos.add(key(e.tipo, e.referencia_id))
    else ativos.set(key(e.tipo, e.referencia_id), { id: e.id, prioridade: e.prioridade, data_alerta: e.data_alerta })
  }

  const novos: Candidato[] = []
  const updates: Array<{ id: string; prioridade: string; data_alerta: string }> = []

  for (const c of candidatos) {
    const k = key(c.tipo, c.referencia_id)
    if (resolvidos.has(k)) continue                      // usuário dispensou
    const atual = ativos.get(k)
    if (!atual) {
      novos.push(c)
      continue
    }
    if (atual.prioridade !== c.prioridade || atual.data_alerta !== c.data_alerta) {
      updates.push({ id: atual.id, prioridade: c.prioridade, data_alerta: c.data_alerta })
    }
  }

  let inseridos = 0, atualizados = 0

  if (novos.length > 0) {
    const payload = novos.map((n) => ({ ...n, transportadora_id: transportadoraId })) as never
    const { error, count } = await supabase.from('alertas').insert(payload, { count: 'exact' })
    if (!error) inseridos = count ?? novos.length
  }

  // updates feitos em paralelo
  if (updates.length > 0) {
    const results = await Promise.all(updates.map((u) =>
      supabase.from('alertas').update({ prioridade: u.prioridade, data_alerta: u.data_alerta } as never).eq('id', u.id),
    ))
    atualizados = results.filter((r) => !r.error).length
  }

  return { inseridos, atualizados }
}

// ---------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------
function prioridadeKm(restante: number): AlertPriority {
  if (restante < 500) return 'critico'
  if (restante < 1500) return 'alto'
  if (restante < 3000) return 'medio'
  return 'baixo'
}

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10)
}

// ---------------------------------------------------------------------
// Throttle de execução (1h) via transportadoras.config
// ---------------------------------------------------------------------
const TTL_MS = 60 * 60 * 1000

export async function gerarAlertasSeNecessario(
  supabase: SB,
  transportadoraId: string,
  configAtual: Record<string, unknown> | null,
) {
  const ultimo = configAtual?.ultimo_check_alertas as string | undefined
  if (ultimo) {
    const idade = Date.now() - new Date(ultimo).getTime()
    if (idade < TTL_MS) return null
  }

  const resultado = await gerarAlertas(supabase, transportadoraId)

  await supabase
    .from('transportadoras')
    .update({ config: { ...(configAtual ?? {}), ultimo_check_alertas: new Date().toISOString() } } as never)
    .eq('id', transportadoraId)

  return resultado
}
