'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTransportadoraId } from '@/lib/tenant'
import { mensagemAmigavel } from '@/lib/errors'
import {
  transportadoraUpdateSchema, type TransportadoraUpdateData,
} from '@/lib/validations/transportadora'

export type ActionResult = { ok: true } | { ok: false; error: string }

export async function atualizarTransportadora(data: TransportadoraUpdateData): Promise<ActionResult> {
  const parsed = transportadoraUpdateSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  const supabase = createClient()
  let tid: string
  try { tid = await getTransportadoraId(supabase) }
  catch (e) { return { ok: false, error: (e as Error).message } }

  const { error } = await supabase
    .from('transportadoras')
    .update({
      nome: parsed.data.nome,
      cnpj: parsed.data.cnpj || null,
      telefone: parsed.data.telefone || null,
      cidade: parsed.data.cidade || null,
      estado: parsed.data.estado || null,
    } as never)
    .eq('id', tid)

  if (error) return { ok: false, error: mensagemAmigavel(error.message) }

  revalidatePath('/')
  revalidatePath('/configuracoes')
  return { ok: true }
}
