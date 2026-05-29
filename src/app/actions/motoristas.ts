'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTransportadoraId } from '@/lib/tenant'
import { gerarAlertas } from '@/lib/alertas'
import {
  motoristaSchema, motoristaUpdateSchema,
  type MotoristaFormData, type MotoristaUpdateData,
} from '@/lib/validations/motorista'

export type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string }

function revalidateAll(id?: string) {
  revalidatePath('/')
  revalidatePath('/motoristas')
  if (id) revalidatePath(`/motoristas/${id}`)
}

// ---------------------------------------------------------------------
export async function criarMotorista(data: MotoristaFormData): Promise<ActionResult<{ id: string }>> {
  const parsed = motoristaSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  const supabase = createClient()
  let tid: string
  try { tid = await getTransportadoraId(supabase) }
  catch (e) { return { ok: false, error: (e as Error).message } }

  const payload = { ...parsed.data, transportadora_id: tid } as never
  const { data: novo, error } = await supabase
    .from('motoristas')
    .insert(payload)
    .select('id')
    .returns<{ id: string }[]>()
    .single()

  if (error || !novo) {
    if (error?.code === '23505') return { ok: false, error: 'Já existe um motorista com esse CPF.' }
    return { ok: false, error: error?.message ?? 'Falha ao criar motorista' }
  }

  // Recheca alertas (CNH/MOPP próximos do vencimento já viram pendentes)
  await gerarAlertas(supabase, tid).catch(() => null)

  revalidateAll()
  return { ok: true, data: { id: novo.id } }
}

// ---------------------------------------------------------------------
export async function atualizarMotorista(id: string, data: MotoristaUpdateData): Promise<ActionResult> {
  const parsed = motoristaUpdateSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  const supabase = createClient()
  const { error } = await supabase.from('motoristas').update(parsed.data as never).eq('id', id)
  if (error) return { ok: false, error: error.message }

  // Reavalia alertas (datas de CNH/MOPP podem ter mudado)
  try {
    const tid = await getTransportadoraId(supabase)
    await gerarAlertas(supabase, tid)
  } catch { /* sem tenant não há o que reconciliar */ }

  revalidateAll(id)
  return { ok: true }
}

// ---------------------------------------------------------------------
export async function inativarMotorista(id: string): Promise<ActionResult> {
  const supabase = createClient()

  const { count } = await supabase
    .from('viagens')
    .select('id', { count: 'exact', head: true })
    .eq('motorista_id', id)
    .eq('status', 'em_andamento')

  if ((count ?? 0) > 0) {
    return { ok: false, error: 'Motorista possui viagem em andamento. Encerre a viagem antes de inativar.' }
  }

  const { error } = await supabase.from('motoristas').update({ status: 'inativo' } as never).eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidateAll(id)
  return { ok: true }
}

export async function reativarMotorista(id: string): Promise<ActionResult> {
  const supabase = createClient()
  const { error } = await supabase.from('motoristas').update({ status: 'ativo' } as never).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidateAll(id)
  return { ok: true }
}
