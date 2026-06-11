'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTransportadoraId } from '@/lib/tenant'
import { mensagemAmigavel } from '@/lib/errors'
import {
  lancamentoSchema, lancamentoUpdateSchema,
  type LancamentoFormData, type LancamentoUpdateData,
} from '@/lib/validations/financeiro'

export type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string }

function revalidateAll(veiculoId?: string | null) {
  revalidatePath('/')
  revalidatePath('/financeiro')
  revalidatePath('/financeiro/por-veiculo')
  if (veiculoId) revalidatePath(`/frota/${veiculoId}`)
}

export async function criarLancamento(data: LancamentoFormData): Promise<ActionResult<{ id: string }>> {
  const parsed = lancamentoSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  const supabase = createClient()
  let tid: string
  try { tid = await getTransportadoraId(supabase) }
  catch (e) { return { ok: false, error: (e as Error).message } }

  const payload = { ...parsed.data, transportadora_id: tid } as never
  const { data: novo, error } = await supabase
    .from('lancamentos_financeiros')
    .insert(payload)
    .select('id')
    .returns<{ id: string }[]>()
    .single()

  if (error || !novo) return { ok: false, error: mensagemAmigavel(error?.message ?? 'Falha ao criar lançamento') }

  revalidateAll(parsed.data.veiculo_id)
  return { ok: true, data: { id: novo.id } }
}

export async function atualizarLancamento(id: string, data: LancamentoUpdateData): Promise<ActionResult> {
  const parsed = lancamentoUpdateSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  const supabase = createClient()
  const { error } = await supabase.from('lancamentos_financeiros').update(parsed.data as never).eq('id', id)
  if (error) return { ok: false, error: mensagemAmigavel(error.message) }
  revalidateAll(parsed.data.veiculo_id)
  return { ok: true }
}

export async function deletarLancamento(id: string): Promise<ActionResult> {
  const supabase = createClient()
  const { error } = await supabase.from('lancamentos_financeiros').delete().eq('id', id)
  if (error) return { ok: false, error: mensagemAmigavel(error.message) }
  revalidateAll()
  return { ok: true }
}
