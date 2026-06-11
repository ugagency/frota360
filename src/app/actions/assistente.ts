'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { mensagemAmigavel } from '@/lib/errors'

export type ActionResult = { ok: true } | { ok: false; error: string }

export async function deletarConversa(formData: FormData): Promise<ActionResult> {
  const id = formData.get('id')?.toString()
  if (!id) return { ok: false, error: 'ID ausente' }

  const supabase = createClient()
  // RLS filtra por user_id; sem precisar de eq explícito
  const { error } = await supabase.from('conversas_assistente').delete().eq('id', id)
  if (error) return { ok: false, error: mensagemAmigavel(error.message) }

  revalidatePath('/assistente')
  return { ok: true }
}

export async function limparHistorico(): Promise<ActionResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado' }

  const { error } = await supabase
    .from('conversas_assistente')
    .delete()
    .eq('user_id', user.id)

  if (error) return { ok: false, error: mensagemAmigavel(error.message) }

  revalidatePath('/assistente')
  return { ok: true }
}
