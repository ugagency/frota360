import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { gerarAlertasSeNecessario } from '@/lib/alertas'
import type { Plano } from '@/lib/plano'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: vinculo } = await supabase
    .from('usuarios_transportadoras')
    .select('role, transportadora_id')
    .eq('user_id', user.id)
    .returns<{ role: string; transportadora_id: string }[]>()
    .maybeSingle()

  if (!vinculo) redirect('/login')

  type TranspRow = {
    id: string; nome: string
    plano: Plano; plano_status: string
    plano_inicio: string | null; plano_validade: string | null
    config: Record<string, unknown> | null
  }

  const { data: transp } = await supabase
    .from('transportadoras')
    .select('id, nome, plano, plano_status, plano_inicio, plano_validade, config')
    .eq('id', vinculo.transportadora_id)
    .returns<TranspRow[]>()
    .single()

  if (!transp) redirect('/login')

  const userNome = (user.user_metadata?.nome as string | undefined) ?? user.email?.split('@')[0] ?? 'Usuário'

  const [{ count: alertasCriticos }] = await Promise.all([
    supabase
      .from('alertas')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pendente')
      .eq('prioridade', 'critico'),
    gerarAlertasSeNecessario(supabase, transp.id, transp.config, transp.plano),
  ])

  return (
    <DashboardShell
      userNome={userNome}
      userEmail={user.email ?? ''}
      transportadoraNome={transp.nome}
      plano={transp.plano}
      planoStatus={transp.plano_status}
      planoValidade={transp.plano_validade}
      alertasCriticos={alertasCriticos ?? 0}
    >
      {children}
    </DashboardShell>
  )
}
