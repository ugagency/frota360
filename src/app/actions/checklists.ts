'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTransportadoraId } from '@/lib/tenant'
import { z } from 'zod'

const itemSchema = z.object({
  nome:      z.string(),
  resultado: z.enum(['ok', 'nao_conforme', 'nao_verificado']),
  observacao: z.string().optional().nullable(),
})

export const checklistSchema = z.object({
  veiculo_id:      z.string().uuid('Selecione um veículo'),
  motorista_id:    z.string().uuid().optional().nullable(),
  tipo:            z.enum(['saida', 'chegada']),
  data_realizacao: z.string().min(1),
  itens:           z.array(itemSchema).min(1),
  observacao_geral: z.string().optional().nullable(),
})

export type ChecklistFormData = z.infer<typeof checklistSchema>
export type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string }

function calcularStatusGeral(itens: ChecklistFormData['itens']): 'aprovado' | 'reprovado' | 'com_ressalvas' {
  const naoConformes = itens.filter((i) => i.resultado === 'nao_conforme').length
  if (naoConformes === 0) return 'aprovado'
  if (naoConformes / itens.length > 0.2) return 'reprovado'
  return 'com_ressalvas'
}

export async function criarChecklist(data: ChecklistFormData): Promise<ActionResult<{ id: string }>> {
  const parsed = checklistSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  const supabase = createClient()
  let tid: string
  try { tid = await getTransportadoraId(supabase) }
  catch (e) { return { ok: false, error: (e as Error).message } }

  const { data: { user } } = await supabase.auth.getUser()
  const status_geral = calcularStatusGeral(parsed.data.itens)

  const { data: novo, error } = await supabase
    .from('checklists')
    .insert({
      transportadora_id: tid,
      veiculo_id:       parsed.data.veiculo_id,
      motorista_id:     parsed.data.motorista_id ?? null,
      tipo:             parsed.data.tipo,
      data_realizacao:  parsed.data.data_realizacao,
      itens:            parsed.data.itens as never,
      observacao_geral: parsed.data.observacao_geral ?? null,
      status_geral,
      criado_por: user?.id ?? null,
    } as never)
    .select('id')
    .returns<{ id: string }[]>()
    .single()

  if (error || !novo) return { ok: false, error: error?.message ?? 'Falha ao criar checklist' }

  // Gerar alerta se reprovado ou com ressalvas
  if (status_geral !== 'aprovado') {
    await supabase.from('alertas').insert({
      transportadora_id: tid,
      tipo: 'checklist',
      referencia_id: parsed.data.veiculo_id,
      referencia_tipo: 'veiculo',
      titulo: `Checklist ${status_geral === 'reprovado' ? 'reprovado' : 'com ressalvas'}`,
      descricao: `Checklist de ${parsed.data.tipo === 'saida' ? 'saída' : 'chegada'} com itens não conformes.`,
      data_alerta: new Date().toISOString().slice(0, 10),
      prioridade: status_geral === 'reprovado' ? 'alto' : 'medio',
      status: 'pendente',
    } as never)
  }

  revalidatePath('/checklists')
  revalidatePath(`/frota/${parsed.data.veiculo_id}`)
  return { ok: true, data: { id: novo.id } }
}
