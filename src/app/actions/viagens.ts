'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTransportadoraId } from '@/lib/tenant'
import { gerarAlertas } from '@/lib/alertas'
import { mensagemAmigavel } from '@/lib/errors'
import {
  viagemCreateSchema, encerrarViagemSchemaBase, cancelarViagemSchema,
  type ViagemCreateData, type EncerrarViagemData, type CancelarViagemData,
} from '@/lib/validations/viagem'

export type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string }

function revalidateAll(id?: string) {
  revalidatePath('/')
  revalidatePath('/viagens')
  revalidatePath('/frota')
  if (id) revalidatePath(`/viagens/${id}`)
}

// =====================================================================
// criarViagem — transação lógica: viagem + status veículo + lançamentos
// =====================================================================
export async function criarViagem(data: ViagemCreateData): Promise<ActionResult<{ id: string }>> {
  const parsed = viagemCreateSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  const supabase = createClient()
  let tid: string
  try { tid = await getTransportadoraId(supabase) }
  catch (e) { return { ok: false, error: (e as Error).message } }

  // 1. Verifica CNH do motorista
  const { data: mot } = await supabase
    .from('motoristas')
    .select('nome, cnh_validade, status')
    .eq('id', parsed.data.motorista_id)
    .returns<{ nome: string; cnh_validade: string | null; status: string }[]>()
    .maybeSingle()

  if (!mot) return { ok: false, error: 'Motorista não encontrado' }
  if (mot.status !== 'ativo') return { ok: false, error: 'Motorista não está ativo' }
  if (mot.cnh_validade && new Date(mot.cnh_validade) < new Date()) {
    return { ok: false, error: `CNH de ${mot.nome} está vencida` }
  }

  // 2. Verifica veículo
  const { data: vei } = await supabase
    .from('veiculos')
    .select('placa, status')
    .eq('id', parsed.data.veiculo_id)
    .returns<{ placa: string; status: string }[]>()
    .maybeSingle()

  if (!vei) return { ok: false, error: 'Veículo não encontrado' }
  if (vei.status !== 'ativo') return { ok: false, error: `Veículo ${vei.placa} não está disponível (${vei.status})` }

  // 3. Gera número sequencial do ano corrente
  const ano = new Date().getFullYear()
  const { count } = await supabase
    .from('viagens')
    .select('id', { count: 'exact', head: true })
    .eq('transportadora_id', tid)
    .gte('created_at', `${ano}-01-01`)
    .lte('created_at', `${ano}-12-31T23:59:59`)

  const numero = `VGM-${ano}-${String((count ?? 0) + 1).padStart(3, '0')}`

  // 4. INSERT viagem em_andamento
  // Se destinos preenchidos, usar o último como destino principal
  const destinoPrincipal = parsed.data.destinos && parsed.data.destinos.length > 0
    ? parsed.data.destinos[parsed.data.destinos.length - 1].cidade
    : parsed.data.destino

  const payload = {
    ...parsed.data,
    destino: destinoPrincipal,
    transportadora_id: tid,
    numero,
    status: 'em_andamento' as const,
  } as never

  const { data: nova, error: insertErr } = await supabase
    .from('viagens')
    .insert(payload)
    .select('id')
    .returns<{ id: string }[]>()
    .single()

  if (insertErr || !nova) {
    if (insertErr?.code === '23505') return { ok: false, error: 'Conflito de número de viagem. Tente novamente.' }
    return { ok: false, error: mensagemAmigavel(insertErr?.message ?? 'Falha ao criar viagem') }
  }

  // 5. Atualiza veículo → em_viagem (+ km_atual se km_saida for maior)
  await supabase
    .from('veiculos')
    .update({ status: 'em_viagem', km_atual: parsed.data.km_saida } as never)
    .eq('id', parsed.data.veiculo_id)

  // 6. Lançamentos financeiros
  const lancamentos: Array<Record<string, unknown>> = [{
    transportadora_id: tid,
    veiculo_id: parsed.data.veiculo_id,
    viagem_id: nova.id,
    motorista_id: parsed.data.motorista_id,
    tipo: 'receita',
    categoria: 'frete',
    descricao: `Frete ${numero} — ${parsed.data.origem} → ${destinoPrincipal}`,
    valor: parsed.data.valor_frete,
    data: new Date().toISOString().slice(0, 10),
  }]

  if (parsed.data.valor_adiantamento > 0) {
    lancamentos.push({
      transportadora_id: tid,
      veiculo_id: parsed.data.veiculo_id,
      viagem_id: nova.id,
      motorista_id: parsed.data.motorista_id,
      tipo: 'despesa',
      categoria: 'adiantamento',
      descricao: `Adiantamento motorista — ${numero}`,
      valor: parsed.data.valor_adiantamento,
      data: new Date().toISOString().slice(0, 10),
    })
  }

  await supabase.from('lancamentos_financeiros').insert(lancamentos as never)

  revalidateAll(nova.id)
  return { ok: true, data: { id: nova.id } }
}

// =====================================================================
// iniciarViagem — para viagens criadas como 'planejada' (Sprint futura)
// =====================================================================
export async function iniciarViagem(id: string): Promise<ActionResult> {
  const supabase = createClient()
  const { data: v } = await supabase
    .from('viagens')
    .select('veiculo_id, status')
    .eq('id', id)
    .returns<{ veiculo_id: string; status: string }[]>()
    .maybeSingle()

  if (!v) return { ok: false, error: 'Viagem não encontrada' }
  if (v.status !== 'planejada') return { ok: false, error: 'Viagem não está planejada' }

  await supabase.from('viagens')
    .update({ status: 'em_andamento', data_saida: new Date().toISOString() } as never)
    .eq('id', id)

  await supabase.from('veiculos').update({ status: 'em_viagem' } as never).eq('id', v.veiculo_id)

  revalidateAll(id)
  return { ok: true }
}

// =====================================================================
// encerrarViagem — finaliza, atualiza KM do veículo, recheca alertas
// =====================================================================
export async function encerrarViagem(id: string, data: EncerrarViagemData): Promise<ActionResult> {
  const supabase = createClient()

  const { data: viagem } = await supabase
    .from('viagens')
    .select('veiculo_id, km_saida, status')
    .eq('id', id)
    .returns<{ veiculo_id: string; km_saida: number | null; status: string }[]>()
    .maybeSingle()

  if (!viagem) return { ok: false, error: 'Viagem não encontrada' }
  if (viagem.status !== 'em_andamento') return { ok: false, error: 'Viagem não está em andamento' }

  const parsed = encerrarViagemSchemaBase.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  if (viagem.km_saida != null && parsed.data.km_chegada <= Number(viagem.km_saida)) {
    return { ok: false, error: `KM de chegada deve ser maior que ${Number(viagem.km_saida).toLocaleString('pt-BR')}` }
  }

  await supabase.from('viagens').update({
    status: 'concluida',
    km_chegada: parsed.data.km_chegada,
    data_chegada_real: parsed.data.data_chegada_real,
    observacoes: parsed.data.observacoes ?? null,
  } as never).eq('id', id)

  await supabase.from('veiculos').update({
    status: 'ativo',
    km_atual: parsed.data.km_chegada,
  } as never).eq('id', viagem.veiculo_id)

  // Recheca alertas (KM revisão pode ter sido ultrapassado)
  try {
    const tid = await getTransportadoraId(supabase)
    await gerarAlertas(supabase, tid)
  } catch { /* sem tenant não há o que reconciliar */ }

  revalidateAll(id)
  return { ok: true }
}

// =====================================================================
// cancelarViagem — devolve veículo e remove lançamentos
// =====================================================================
export async function cancelarViagem(id: string, data: CancelarViagemData): Promise<ActionResult> {
  const parsed = cancelarViagemSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Motivo inválido' }

  const supabase = createClient()

  const { data: v } = await supabase
    .from('viagens')
    .select('veiculo_id, status, observacoes')
    .eq('id', id)
    .returns<{ veiculo_id: string; status: string; observacoes: string | null }[]>()
    .maybeSingle()

  if (!v) return { ok: false, error: 'Viagem não encontrada' }
  if (v.status === 'concluida' || v.status === 'cancelada') {
    return { ok: false, error: 'Viagem já está finalizada' }
  }

  const obsNova = [v.observacoes, `Cancelada: ${parsed.data.motivo}`].filter(Boolean).join('\n')

  await supabase.from('viagens').update({
    status: 'cancelada',
    observacoes: obsNova,
  } as never).eq('id', id)

  // Devolve veículo
  if (v.status === 'em_andamento') {
    await supabase.from('veiculos').update({ status: 'ativo' } as never).eq('id', v.veiculo_id)
  }

  // Remove lançamentos automáticos (frete + adiantamento) — o usuário pode ter editado depois
  await supabase.from('lancamentos_financeiros').delete().eq('viagem_id', id)

  revalidateAll(id)
  return { ok: true }
}

// =====================================================================
// criarViagemERedirect — wrapper conveniente para form submit
// =====================================================================
export async function criarViagemERedirect(data: ViagemCreateData) {
  const r = await criarViagem(data)
  if (!r.ok) return r
  redirect(`/viagens/${r.data!.id}`)
}
