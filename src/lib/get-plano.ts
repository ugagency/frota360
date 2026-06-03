import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { Plano } from '@/lib/plano'

export async function getPlanoTransportadora(): Promise<Plano> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'demo'

  const { data: vinculo } = await supabase
    .from('usuarios_transportadoras')
    .select('transportadora_id')
    .eq('user_id', user.id)
    .returns<{ transportadora_id: string }[]>()
    .maybeSingle()

  if (!vinculo) return 'demo'

  const { data } = await supabase
    .from('transportadoras')
    .select('plano')
    .eq('id', vinculo.transportadora_id)
    .returns<{ plano: Plano }[]>()
    .maybeSingle()

  return data?.plano ?? 'demo'
}
