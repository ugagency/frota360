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

// ─── Lookup CNPJ via CNPJa ────────────────────────────────────────────────────

export type CNPJaResult = {
  ok: true
  dados: {
    razao_social: string
    cnpj: string
    email: string | null
    telefone: string | null
    cidade: string | null
    estado: string | null
  }
} | { ok: false; error: string }

export async function buscarCNPJ(cnpj: string): Promise<CNPJaResult> {
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) return { ok: false, error: 'CNPJ deve ter 14 dígitos.' }

  try {
    const resp = await fetch(`https://open.cnpja.com/office/${digits}`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 0 },
    })

    if (resp.status === 404) return { ok: false, error: 'CNPJ não encontrado na base da Receita Federal.' }
    if (!resp.ok) return { ok: false, error: 'Serviço de consulta CNPJ indisponível. Tente novamente.' }

    const json = await resp.json()

    const razaoSocial: string = json?.company?.name ?? json?.alias ?? ''
    if (!razaoSocial) return { ok: false, error: 'Não foi possível extrair os dados da empresa.' }

    const email: string | null = json?.emails?.[0]?.address ?? null
    const fone  = json?.phones?.[0]
    const telefone: string | null = fone
      ? `(${fone.area}) ${String(fone.number).replace(/^(\d{4,5})(\d{4})$/, '$1-$2')}`
      : null
    const cidade: string | null = json?.address?.city
      ? toTitleCase(json.address.city)
      : null
    const estado: string | null = json?.address?.state ?? null

    const cnpjFormatado = digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')

    return {
      ok: true,
      dados: { razao_social: razaoSocial, cnpj: cnpjFormatado, email, telefone, cidade, estado },
    }
  } catch {
    return { ok: false, error: 'Erro ao consultar CNPJ. Verifique sua conexão.' }
  }
}

function toTitleCase(str: string): string {
  const minors = new Set(['de', 'da', 'do', 'das', 'dos', 'e'])
  return str.toLowerCase().split(' ').map((w, i) =>
    i === 0 || !minors.has(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w
  ).join(' ')
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
