'use client'

import { useEffect, useRef, useState } from 'react'
import { SendHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

import { Mensagem, MensagemLoading } from './mensagem'
import { SugestoesIniciais } from './sugestoes-iniciais'
import type { ChatMessage } from '@/lib/assistente/types'
import { cn } from '@/lib/utils'

type Props = {
  initialMessages?: ChatMessage[]
  initialConversaId?: string | null
  /** Notifica o pai quando uma conversa nova é criada — útil para sincronizar sidebar */
  onConversaCreated?: (id: string) => void
  /** Altura do container de mensagens; falta classe = full height */
  scrollHeight?: string
  /** Modo compacto para o card do dashboard */
  compact?: boolean
}

export function ChatArea({
  initialMessages, initialConversaId, onConversaCreated, scrollHeight, compact = false,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages ?? [])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversaId, setConversaId] = useState<string | null>(initialConversaId ?? null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Quando inicializamos com outra conversa (clique na sidebar), substitui o histórico local
  useEffect(() => {
    setMessages(initialMessages ?? [])
    setConversaId(initialConversaId ?? null)
  }, [initialMessages, initialConversaId])

  // Auto-scroll na última mensagem
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function enviar(textoForcado?: string) {
    const texto = (textoForcado ?? input).trim()
    if (!texto || loading) return

    const userMsg: ChatMessage = { role: 'user', content: texto }
    const nova: ChatMessage[] = [...messages, userMsg]
    setMessages(nova)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/assistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nova, conversaId }),
      })

      const data = await res.json() as { resposta?: string; conversaId?: string | null; error?: string }
      if (!res.ok || data.error) {
        toast.error(data.error ?? 'Falha na comunicação com o assistente.')
        // Remove a mensagem do usuário do estado local em caso de erro
        setMessages((prev) => prev.slice(0, -1))
      } else {
        const resposta: ChatMessage = { role: 'model', content: data.resposta ?? '' }
        setMessages([...nova, resposta])
        if (data.conversaId && data.conversaId !== conversaId) {
          setConversaId(data.conversaId)
          onConversaCreated?.(data.conversaId)
        }
      }
    } catch {
      toast.error('Falha de rede. Tente novamente.')
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setLoading(false)
      // devolve foco ao input
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Área de mensagens */}
      <div
        ref={scrollRef}
        className={cn('flex-1 overflow-y-auto px-4 py-3', scrollHeight)}
        style={scrollHeight ? undefined : (compact ? { height: 320 } : undefined)}
      >
        {messages.length === 0 && !loading ? (
          <SugestoesIniciais onPick={(t) => enviar(t)} />
        ) : (
          <div className="space-y-3">
            {messages.map((m, i) => <Mensagem key={i} role={m.role} content={m.content} />)}
            {loading && <MensagemLoading />}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t bg-app-card p-3 flex items-end gap-2">
        <Textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Pergunte sobre sua operação…"
          rows={1}
          maxLength={500}
          disabled={loading}
          className="flex-1 resize-none min-h-[40px] max-h-[120px] text-sm"
        />
        <Button
          type="button"
          onClick={() => enviar()}
          disabled={loading || !input.trim()}
          size="icon"
          className="h-10 w-10 bg-brand hover:bg-brand-dark text-white shrink-0"
          aria-label="Enviar"
        >
          <SendHorizontal size={16} />
        </Button>
      </div>
    </div>
  )
}
