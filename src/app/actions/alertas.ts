'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Assinaturas compatíveis com <form action={...}>: recebem FormData, retornam void.
export async function resolverAlerta(formData: FormData) {
  const id = formData.get('id')?.toString()
  if (!id) return
  const supabase = createClient()
  await supabase.from('alertas').update({ status: 'resolvido' } as never).eq('id', id)
  revalidatePath('/')
}

export async function marcarAlertaVisualizado(formData: FormData) {
  const id = formData.get('id')?.toString()
  if (!id) return
  const supabase = createClient()
  await supabase.from('alertas').update({ status: 'visualizado' } as never).eq('id', id)
  revalidatePath('/')
}
