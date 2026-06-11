'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTransportadoraId } from '@/lib/tenant'
import {
  clienteSchema, clienteUpdateSchema, interacaoSchema, contratoSchema,
  type ClienteFormData, type ClienteUpdateData, type InteracaoFormData, type ContratoFormData,
} from '@/lib/validations/cliente'
import { mensagemAmigavel } from '@/lib/errors'

export type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string }

function revalidateList() {
  revalidatePath('/clientes')
}

// ─── Clientes ─────────────────────────────────────────────────────────────────

export async function criarCliente(data: ClienteFormData): Promise<ActionResult<{ id: string }>> {
  const parsed = clienteSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  const supabase = createClient()
  let tid: string
  try { tid = await getTransportadoraId(supabase) }
  catch (e) { return { ok: false, error: (e as Error).message } }

  const payload = { ...parsed.data, transportadora_id: tid } as never
  const { data: novo, error } = await supabase
    .from('clientes')
    .insert(payload)
    .select('id')
    .returns<{ id: string }[]>()
    .single()

  if (error || !novo) {
    if (error?.code === '23505') return { ok: false, error: 'Já existe um cliente com esse CNPJ.' }
    return { ok: false, error: mensagemAmigavel(error?.message ?? 'Falha ao criar cliente') }
  }

  revalidateList()
  return { ok: true, data: { id: novo.id } }
}

export async function atualizarCliente(id: string, data: ClienteUpdateData): Promise<ActionResult> {
  const parsed = clienteUpdateSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  const supabase = createClient()
  const { error } = await supabase
    .from('clientes')
    .update(parsed.data as never)
    .eq('id', id)

  if (error) return { ok: false, error: mensagemAmigavel(error.message) }

  revalidateList()
  revalidatePath(`/clientes/${id}`)
  return { ok: true }
}

// ─── Interações ───────────────────────────────────────────────────────────────

export async function criarInteracao(clienteId: string, data: InteracaoFormData): Promise<ActionResult> {
  const parsed = interacaoSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  const supabase = createClient()
  let tid: string
  try { tid = await getTransportadoraId(supabase) }
  catch (e) { return { ok: false, error: (e as Error).message } }

  const { data: { user } } = await supabase.auth.getUser()

  const payload = {
    ...parsed.data,
    transportadora_id: tid,
    cliente_id: clienteId,
    criado_por: user?.id ?? null,
  } as never

  const { error } = await supabase.from('crm_interacoes').insert(payload)
  if (error) return { ok: false, error: mensagemAmigavel(error.message) }

  // Atualiza proxima_acao no cliente se fornecido na interação
  if (parsed.data.proximo_contato) {
    await supabase
      .from('clientes')
      .update({ proxima_acao: parsed.data.proximo_contato } as never)
      .eq('id', clienteId)
  }

  revalidatePath(`/clientes/${clienteId}`)
  return { ok: true }
}

// ─── Contratos ────────────────────────────────────────────────────────────────

export async function criarContrato(clienteId: string, data: ContratoFormData): Promise<ActionResult> {
  const parsed = contratoSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  const supabase = createClient()
  let tid: string
  try { tid = await getTransportadoraId(supabase) }
  catch (e) { return { ok: false, error: (e as Error).message } }

  const payload = {
    ...parsed.data,
    transportadora_id: tid,
    cliente_id: clienteId,
  } as never

  const { error } = await supabase.from('crm_contratos').insert(payload)
  if (error) return { ok: false, error: mensagemAmigavel(error.message) }

  revalidatePath(`/clientes/${clienteId}`)
  return { ok: true }
}
