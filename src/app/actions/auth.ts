'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { criarContaSchema, type CriarContaInput } from '@/lib/validations/auth'

export type ActionResult = { ok: true } | { ok: false; error: string }

// ---------------------------------------------------------------------
// criarConta — onboarding completo do tenant.
// Usa admin.createUser para não disparar email de confirmação e
// evitar o rate-limit de 4 emails/h do Supabase Free.
// ---------------------------------------------------------------------
export async function criarConta(data: CriarContaInput): Promise<ActionResult> {
  const parsed = criarContaSchema.safeParse(data)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const supabase = createClient()
  const admin = createAdminClient()

  // 1. Cria o usuário já confirmado (sem email)
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.senha,
    email_confirm: true,
    user_metadata: { nome: parsed.data.nome },
  })

  if (createErr || !created.user) {
    const msg = createErr?.message ?? 'Falha ao criar conta'
    if (msg.toLowerCase().includes('already')) {
      return { ok: false, error: 'Já existe uma conta com esse e-mail.' }
    }
    return { ok: false, error: msg }
  }

  const userId = created.user.id

  try {
    // 2. Cria a transportadora
    const trialEnds = new Date()
    trialEnds.setDate(trialEnds.getDate() + 14)

    const { data: transp, error: transpErr } = await admin
      .from('transportadoras')
      .insert({
        nome: parsed.data.nome_empresa,
        cnpj: parsed.data.cnpj,
        telefone: parsed.data.telefone ?? null,
        cidade: parsed.data.cidade,
        estado: parsed.data.estado,
        plano: 'starter',
        plano_status: 'trial',
        trial_ends_at: trialEnds.toISOString(),
      })
      .select('id')
      .single()

    if (transpErr || !transp) throw new Error(transpErr?.message ?? 'Falha ao criar transportadora')

    // 3. Vincula o usuário como admin
    const { error: vincErr } = await admin
      .from('usuarios_transportadoras')
      .insert({
        user_id: userId,
        transportadora_id: transp.id,
        role: 'admin',
      })

    if (vincErr) throw new Error(vincErr.message)

    // 4. Faz login imediato — escreve cookies da sessão via createServerClient
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.senha,
    })
    if (signInErr) throw new Error(`Conta criada, mas falha ao logar: ${signInErr.message}`)
  } catch (e) {
    // Rollback: remove o user pra liberar o e-mail e o usuário poder tentar de novo
    await admin.auth.admin.deleteUser(userId)
    return { ok: false, error: e instanceof Error ? e.message : 'Falha ao concluir cadastro' }
  }

  return { ok: true }
}

// ---------------------------------------------------------------------
// solicitarResetSenha — dispara email do Supabase com magic link
// ---------------------------------------------------------------------
export async function solicitarResetSenha(email: string): Promise<ActionResult> {
  if (!email || !email.includes('@')) return { ok: false, error: 'E-mail inválido' }

  const supabase = createClient()
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/redefinir-senha`,
  })

  // Sempre retornamos ok — não revela se o email existe (anti-enumeration)
  if (error && !error.message.toLowerCase().includes('rate')) {
    return { ok: false, error: 'Falha ao enviar email. Tente novamente em alguns minutos.' }
  }
  return { ok: true }
}

// ---------------------------------------------------------------------
// sair — limpa sessão e redireciona
// ---------------------------------------------------------------------
export async function sair() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
