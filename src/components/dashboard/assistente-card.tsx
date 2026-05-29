'use client'

import Link from 'next/link'
import { Bot, ArrowUpRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ChatArea } from '@/components/assistente/chat-area'

export function AssistenteCard() {
  return (
    <Card className="bg-app-card overflow-hidden">
      <header className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-brand text-white">
            <Bot size={16} />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-ink leading-none">Assistente Frota 360</h2>
            <p className="mt-0.5 text-[11px] text-ink-muted">Consulta sua operação em linguagem natural.</p>
          </div>
        </div>
        <Link
          href="/assistente"
          className="inline-flex items-center gap-1 text-xs text-brand hover:text-brand-dark font-medium"
        >
          Expandir <ArrowUpRight size={12} />
        </Link>
      </header>

      <ChatArea compact />
    </Card>
  )
}
