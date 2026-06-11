'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTransportadoraId } from '@/lib/tenant'
import type { Plano } from '@/lib/plano'
import { mensagemAmigavel } from '@/lib/errors'

export type ActionResult = { ok: true } | { ok: false; error: string }

export async function atualizarPlano(novoPlano: Plano): Promise<ActionResult> {
  if (!['demo', 'basico', 'profissional'].includes(novoPlano)) {
    return { ok: false, error: 'Plano inválido' }
  }

  const supabase = createClient()
  let tid: string
  try { tid = await getTransportadoraId(supabase) }
  catch (e) { return { ok: false, error: (e as Error).message } }

  const hoje = new Date().toISOString().slice(0, 10)

  const payload: Record<string, unknown> = {
    plano: novoPlano,
    plano_status: 'ativo',
    plano_inicio: hoje,
    // demo: trigger set_demo_validade define plano_validade = hoje + 7d automaticamente
    // basico/profissional: sem validade (plano recorrente)
    plano_validade: novoPlano === 'demo' ? null : null,
  }

  const { error } = await supabase
    .from('transportadoras')
    .update(payload as never)
    .eq('id', tid)

  if (error) return { ok: false, error: mensagemAmigavel(error.message) }

  revalidatePath('/configuracoes')
  revalidatePath('/')
  revalidatePath('/financeiro')
  revalidatePath('/relatorios')
  revalidatePath('/assistente')
  revalidatePath('/manutencao')
  revalidatePath('/checklists')
  return { ok: true }
}
