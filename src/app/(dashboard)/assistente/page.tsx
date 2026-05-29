import { createClient } from '@/lib/supabase/server'
import { AssistenteClient } from './assistente-client'
import type { Conversa, ChatMessage } from '@/lib/assistente/types'

export const dynamic = 'force-dynamic'

type Row = {
  id: string
  titulo: string | null
  updated_at: string
  mensagens: ChatMessage[]
}

export default async function AssistentePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // RLS já garante isolamento. Limitamos a últimas 20.
  const { data } = await supabase
    .from('conversas_assistente')
    .select('id, titulo, updated_at, mensagens')
    .eq('user_id', user?.id ?? '')
    .order('updated_at', { ascending: false })
    .limit(20)
    .returns<Row[]>()

  const conversas: Conversa[] = (data ?? []).map((r) => ({
    id: r.id,
    titulo: r.titulo,
    updated_at: r.updated_at,
    mensagens: Array.isArray(r.mensagens) ? r.mensagens : [],
  }))

  return <AssistenteClient conversas={conversas} />
}
