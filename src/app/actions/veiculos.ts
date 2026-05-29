'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTransportadoraId } from '@/lib/tenant'
import {
  veiculoSchema, veiculoUpdateSchema,
  type VeiculoFormData, type VeiculoUpdateData,
} from '@/lib/validations/veiculo'

export type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string }

function revalidateAll() {
  revalidatePath('/')
  revalidatePath('/frota')
}

// ---------------------------------------------------------------------
export async function criarVeiculo(data: VeiculoFormData): Promise<ActionResult<{ id: string }>> {
  const parsed = veiculoSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  const supabase = createClient()
  let tid: string
  try { tid = await getTransportadoraId(supabase) }
  catch (e) { return { ok: false, error: (e as Error).message } }

  const payload = { ...parsed.data, transportadora_id: tid } as never
  const { data: novo, error } = await supabase
    .from('veiculos')
    .insert(payload)
    .select('id')
    .returns<{ id: string }[]>()
    .single()

  if (error || !novo) {
    if (error?.code === '23505') return { ok: false, error: 'Já existe um veículo com essa placa.' }
    return { ok: false, error: error?.message ?? 'Falha ao criar veículo' }
  }

  revalidateAll()
  return { ok: true, data: { id: novo.id } }
}

// ---------------------------------------------------------------------
export async function atualizarVeiculo(id: string, data: VeiculoUpdateData): Promise<ActionResult> {
  const parsed = veiculoUpdateSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  const supabase = createClient()
  const { error } = await supabase
    .from('veiculos')
    .update(parsed.data as never)
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  revalidateAll()
  revalidatePath(`/frota/${id}`)
  return { ok: true }
}

// ---------------------------------------------------------------------
export async function atualizarKm(id: string, novaKm: number): Promise<ActionResult> {
  if (!Number.isFinite(novaKm) || novaKm < 0) return { ok: false, error: 'KM inválido' }

  const supabase = createClient()

  // Garante que nova KM >= atual + verifica vencimento de revisão
  const { data: atualRaw } = await supabase
    .from('veiculos')
    .select('km_atual, km_proxima_revisao, placa, transportadora_id')
    .eq('id', id)
    .returns<{ km_atual: number; km_proxima_revisao: number | null; placa: string; transportadora_id: string }[]>()
    .maybeSingle()

  if (!atualRaw) return { ok: false, error: 'Veículo não encontrado' }
  if (novaKm < Number(atualRaw.km_atual)) {
    return { ok: false, error: `KM deve ser ≥ ${atualRaw.km_atual.toLocaleString('pt-BR')}` }
  }

  const { error } = await supabase.from('veiculos').update({ km_atual: novaKm } as never).eq('id', id)
  if (error) return { ok: false, error: error.message }

  // Disparo de alerta crítico se ultrapassou KM de revisão
  if (atualRaw.km_proxima_revisao != null && novaKm >= Number(atualRaw.km_proxima_revisao)) {
    await supabase.from('alertas').insert({
      transportadora_id: atualRaw.transportadora_id,
      tipo: 'manutencao_km',
      referencia_id: id,
      referencia_tipo: 'veiculo',
      titulo: `Revisão vencida por KM — ${atualRaw.placa}`,
      descricao: `Veículo atingiu ${novaKm.toLocaleString('pt-BR')} km — revisão prevista a ${atualRaw.km_proxima_revisao.toLocaleString('pt-BR')} km.`,
      data_alerta: new Date().toISOString().slice(0, 10),
      prioridade: 'critico',
      status: 'pendente',
    } as never)
  }

  revalidateAll()
  revalidatePath(`/frota/${id}`)
  return { ok: true }
}

// ---------------------------------------------------------------------
export async function inativarVeiculo(id: string): Promise<ActionResult> {
  const supabase = createClient()

  // Bloqueia se houver viagem em andamento
  const { count } = await supabase
    .from('viagens')
    .select('id', { count: 'exact', head: true })
    .eq('veiculo_id', id)
    .eq('status', 'em_andamento')

  if ((count ?? 0) > 0) {
    return { ok: false, error: 'Veículo possui viagem em andamento. Encerre a viagem antes de inativar.' }
  }

  const { error } = await supabase.from('veiculos').update({ status: 'inativo' } as never).eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidateAll()
  revalidatePath(`/frota/${id}`)
  return { ok: true }
}

// ---------------------------------------------------------------------
export async function reativarVeiculo(id: string): Promise<ActionResult> {
  const supabase = createClient()
  const { error } = await supabase.from('veiculos').update({ status: 'ativo' } as never).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidateAll()
  revalidatePath(`/frota/${id}`)
  return { ok: true }
}
