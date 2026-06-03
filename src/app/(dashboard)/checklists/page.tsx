import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ModuloBloqueado } from '@/components/plano/modulo-bloqueado'
import { ChecklistsClient } from './checklists-client'
import type { Plano } from '@/lib/plano'

export const dynamic = 'force-dynamic'

export default async function ChecklistsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vinculo } = await supabase
    .from('usuarios_transportadoras')
    .select('transportadora_id')
    .eq('user_id', user.id)
    .returns<{ transportadora_id: string }[]>()
    .maybeSingle()
  if (!vinculo) redirect('/login')

  const { data: transp } = await supabase
    .from('transportadoras').select('plano')
    .eq('id', vinculo.transportadora_id)
    .returns<{ plano: Plano }[]>().maybeSingle()

  if (transp?.plano !== 'profissional') {
    return (
      <ModuloBloqueado
        nomeModulo="Checklists"
        descricao="Registre inspeções de saída e chegada com itens não conformes, fotos e geração automática de alertas."
      />
    )
  }

  const [veiculosRes, motoristasRes, checklistsRes] = await Promise.all([
    supabase.from('veiculos').select('id, placa, modelo').neq('status', 'inativo').order('placa')
      .returns<{ id: string; placa: string; modelo: string | null }[]>(),
    supabase.from('motoristas').select('id, nome').neq('status', 'inativo').order('nome')
      .returns<{ id: string; nome: string }[]>(),
    supabase.from('checklists')
      .select('id, tipo, data_realizacao, status_geral, itens, veiculos(placa, modelo), motoristas(nome)')
      .order('data_realizacao', { ascending: false })
      .limit(50)
      .returns<any[]>(),
  ])

  return (
    <ChecklistsClient
      checklists={checklistsRes.data ?? []}
      veiculos={veiculosRes.data ?? []}
      motoristas={motoristasRes.data ?? []}
    />
  )
}
