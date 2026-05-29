'use client'

import { useMemo, useState } from 'react'
import { Bot } from 'lucide-react'

import { ChatArea } from '@/components/assistente/chat-area'
import { ConversasSidebar, type ConversaResumo } from '@/components/assistente/conversas-sidebar'
import type { Conversa, ChatMessage } from '@/lib/assistente/types'

type Props = {
  conversas: Conversa[]
}

export function AssistenteClient({ conversas }: Props) {
  const [conversaAtivaId, setConversaAtivaId] = useState<string | null>(null)
  // chave de remount pra resetar o estado interno do ChatArea quando o usuário troca de conversa
  const [resetKey, setResetKey] = useState(0)

  const resumos: ConversaResumo[] = useMemo(
    () => conversas.map((c) => ({ id: c.id, titulo: c.titulo, updated_at: c.updated_at })),
    [conversas],
  )

  const conversaAtiva = useMemo(
    () => conversas.find((c) => c.id === conversaAtivaId) ?? null,
    [conversas, conversaAtivaId],
  )

  function onSelect(id: string | null) {
    setConversaAtivaId(id)
    setResetKey((k) => k + 1)
  }

  const initialMessages: ChatMessage[] = conversaAtiva?.mensagens ?? []

  return (
    <div className="flex h-[calc(100vh-3.5rem-2rem)] -mx-4 md:-mx-6 -mb-4 md:-mb-6 border-t">
      <ConversasSidebar
        conversas={resumos}
        conversaAtivaId={conversaAtivaId}
        onSelect={onSelect}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-2 px-5 py-3 border-b bg-app-card">
          <span className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-brand text-white">
            <Bot size={16} />
          </span>
          <div>
            <h1 className="font-display text-lg font-semibold text-ink leading-none">
              {conversaAtiva?.titulo ?? 'Nova conversa'}
            </h1>
            <p className="mt-0.5 text-[11px] text-ink-muted">
              {conversaAtiva
                ? `Última atividade: ${new Date(conversaAtiva.updated_at).toLocaleString('pt-BR')}`
                : 'Pergunte sobre frota, motoristas, viagens, manutenções, financeiro e alertas.'}
            </p>
          </div>
        </header>

        <div className="flex-1 min-h-0 bg-app">
          <ChatArea
            key={resetKey}
            initialMessages={initialMessages}
            initialConversaId={conversaAtivaId}
            onConversaCreated={(id) => setConversaAtivaId(id)}
          />
        </div>
      </main>
    </div>
  )
}
