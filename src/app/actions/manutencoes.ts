'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTransportadoraId } from '@/lib/tenant'
import { mensagemAmigavel } from '@/lib/errors'
import {
  manutencaoSchema, manutencaoUpdateSchema, concluirManutencaoSchema,
  type ManutencaoFormData, type ManutencaoUpdateData, type ConcluirManutencaoData,
} from '@/lib/validations/manutencao'

export type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string }

function revalidateAll(id?: string) {
  revalidatePath('/')
  revalidatePath('/manutencao')
  revalidatePath('/frota')
  if (id) revalidatePath(`/manutencao/${id}`)
}

function valorTotalDosItens(itens: { valor: number }[]): number {
  return itens.reduce((acc, it) => acc + Number(it.valor || 0), 0)
}

// =====================================================================
export async function criarManutencao(data: ManutencaoFormData): Promise<ActionResult<{ id: string }>> {
  const parsed = manutencaoSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  const supabase = createClient()
  let tid: string
  try { tid = await getTransportadoraId(supabase) }
  catch (e) { return { ok: false, error: (e as Error).message } }

  const valor_total = valorTotalDosItens(parsed.data.itens)

  const payload = {
    ...parsed.data,
    transportadora_id: tid,
    status: 'em_andamento' as const,
    valor_total,
  } as never

  const { data: nova, error } = await supabase
    .from('manutencoes')
    .insert(payload)
    .select('id')
    .returns<{ id: string }[]>()
    .single()

  if (error || !nova) return { ok: false, error: mensagemAmigavel(error?.message ?? 'Falha ao criar manutenção') }

  // Veículo entra em manutenção
  await supabase.from('veiculos').update({ status: 'em_manutencao' } as never).eq('id', parsed.data.veiculo_id)

  // Lançamento despesa
  if (valor_total > 0) {
    await supabase.from('lancamentos_financeiros').insert({
      transportadora_id: tid,
      veiculo_id: parsed.data.veiculo_id,
      manutencao_id: nova.id,
      tipo: 'despesa',
      categoria: 'manutencao',
      descricao: `Manutenção ${parsed.data.tipo} — ${parsed.data.descricao.slice(0, 80)}`,
      valor: valor_total,
      data: parsed.data.data_entrada,
    } as never)
  }

  revalidateAll(nova.id)
  return { ok: true, data: { id: nova.id } }
}

// =====================================================================
export async function atualizarManutencao(id: string, data: ManutencaoUpdateData): Promise<ActionResult> {
  const parsed = manutencaoUpdateSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  const supabase = createClient()
  const update: Record<string, unknown> = { ...parsed.data }

  if (parsed.data.itens) {
    update.valor_total = valorTotalDosItens(parsed.data.itens)
  }

  const { error } = await supabase.from('manutencoes').update(update as never).eq('id', id)
  if (error) return { ok: false, error: mensagemAmigavel(error.message) }

  // Atualiza lançamento vinculado se valor mudou
  if (update.valor_total != null) {
    await supabase.from('lancamentos_financeiros')
      .update({ valor: update.valor_total } as never)
      .eq('manutencao_id', id)
  }

  revalidateAll(id)
  return { ok: true }
}

// =====================================================================
export async function concluirManutencao(id: string, data: ConcluirManutencaoData): Promise<ActionResult> {
  const parsed = concluirManutencaoSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  const supabase = createClient()

  const { data: m } = await supabase
    .from('manutencoes')
    .select('veiculo_id, status')
    .eq('id', id)
    .returns<{ veiculo_id: string; status: string }[]>()
    .maybeSingle()

  if (!m) return { ok: false, error: 'Manutenção não encontrada' }
  if (m.status === 'concluida') return { ok: false, error: 'Manutenção já concluída' }

  // Atualiza a manutenção
  await supabase.from('manutencoes').update({
    status: 'concluida',
    data_saida: parsed.data.data_saida,
    km_proxima: parsed.data.km_proxima ?? null,
    data_proxima: parsed.data.data_proxima ?? null,
    valor_total: parsed.data.valor_total_final,
  } as never).eq('id', id)

  // Atualiza o veículo (status + agenda próxima revisão)
  const vUpdate: Record<string, unknown> = { status: 'ativo' }
  if (parsed.data.km_proxima != null) vUpdate.km_proxima_revisao = parsed.data.km_proxima
  if (parsed.data.data_proxima) vUpdate.data_proxima_revisao = parsed.data.data_proxima
  await supabase.from('veiculos').update(vUpdate as never).eq('id', m.veiculo_id)

  // Resolve alertas pendentes de manutenção desse veículo
  await supabase.from('alertas').update({ status: 'resolvido' } as never)
    .eq('referencia_id', m.veiculo_id)
    .eq('referencia_tipo', 'veiculo')
    .in('tipo', ['manutencao_km', 'manutencao_data'])
    .eq('status', 'pendente')

  // Atualiza lançamento vinculado
  await supabase.from('lancamentos_financeiros')
    .update({ valor: parsed.data.valor_total_final } as never)
    .eq('manutencao_id', id)

  revalidateAll(id)
  return { ok: true }
}

// =====================================================================
export async function anexarLaudo(id: string, laudoUrl: string): Promise<ActionResult> {
  const supabase = createClient()
  const { error } = await supabase.from('manutencoes').update({ laudo_url: laudoUrl } as never).eq('id', id)
  if (error) return { ok: false, error: mensagemAmigavel(error.message) }
  revalidateAll(id)
  return { ok: true }
}
