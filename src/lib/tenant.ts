import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type SB = SupabaseClient<Database, 'public', any>

/**
 * Resolve o transportadora_id do usuário autenticado.
 * Lança erro se não houver sessão ou vínculo — chame de dentro de Server Actions
 * que já garantem auth pelo middleware.
 */
export async function getTransportadoraId(supabase: SB): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data } = await supabase
    .from('usuarios_transportadoras')
    .select('transportadora_id')
    .eq('user_id', user.id)
    .returns<{ transportadora_id: string }[]>()
    .maybeSingle()

  if (!data) throw new Error('Usuário sem transportadora vinculada')
  return data.transportadora_id
}
