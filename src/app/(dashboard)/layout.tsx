import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/dashboard-shell'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Middleware já cobre isso, mas é defesa em profundidade
  if (!user) redirect('/login')

  const { data: vinculo } = await supabase
    .from('usuarios_transportadoras')
    .select('role, transportadora_id')
    .eq('user_id', user.id)
    .returns<{ role: string; transportadora_id: string }[]>()
    .maybeSingle()

  if (!vinculo) {
    // Usuário existe mas não tem tenant — fluxo de signup interrompido.
    // TODO Sprint 4: tela de recuperação / vincular a transportadora existente
    redirect('/login')
  }

  const { data: transp } = await supabase
    .from('transportadoras')
    .select('id, nome, plano, plano_status')
    .eq('id', vinculo.transportadora_id)
    .returns<{ id: string; nome: string; plano: 'starter' | 'pro'; plano_status: 'trial' | 'ativo' | 'cancelado' | 'inadimplente' }[]>()
    .single()

  if (!transp) redirect('/login')
  const userNome = (user.user_metadata?.nome as string | undefined) ?? user.email?.split('@')[0] ?? 'Usuário'

  // Contagem de alertas críticos pendentes — RLS isola pelo tenant
  const { count: alertasCriticos } = await supabase
    .from('alertas')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pendente')
    .eq('prioridade', 'critico')

  return (
    <DashboardShell
      userNome={userNome}
      userEmail={user.email ?? ''}
      transportadoraNome={transp.nome}
      plano={transp.plano}
      planoStatus={transp.plano_status}
      alertasCriticos={alertasCriticos ?? 0}
    >
      {children}
    </DashboardShell>
  )
}
