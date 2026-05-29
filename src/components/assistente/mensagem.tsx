'use client'

import { Bot, User } from 'lucide-react'
import { FormatResponse } from '@/lib/assistente/format-response'
import { cn } from '@/lib/utils'

type Props = {
  role: 'user' | 'model'
  content: string
}

export function Mensagem({ role, content }: Props) {
  const isUser = role === 'user'

  return (
    <div className={cn('flex gap-2', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <span className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-full bg-brand text-white mt-0.5">
          <Bot size={14} />
        </span>
      )}

      <div className={cn(
        'max-w-[85%] px-3 py-2 text-sm',
        isUser
          ? 'bg-brand-surface text-ink rounded-[12px_12px_0_12px]'
          : 'bg-app-subtle text-ink rounded-[12px_12px_12px_0]',
      )}>
        {isUser ? <p className="whitespace-pre-wrap">{content}</p> : <FormatResponse text={content} />}
      </div>

      {isUser && (
        <span className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-full bg-stone-700 text-white mt-0.5">
          <User size={14} />
        </span>
      )}
    </div>
  )
}

export function MensagemLoading() {
  return (
    <div className="flex gap-2 justify-start">
      <span className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-full bg-brand text-white mt-0.5">
        <Bot size={14} />
      </span>
      <div className="px-3 py-2 bg-app-subtle rounded-[12px_12px_12px_0]">
        <div className="flex items-center gap-1">
          <Dot delay={0} />
          <Dot delay={150} />
          <Dot delay={300} />
        </div>
      </div>
    </div>
  )
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="h-1.5 w-1.5 rounded-full bg-ink-muted dot-pulse"
      style={{ animationDelay: `${delay}ms` }}
    />
  )
}
