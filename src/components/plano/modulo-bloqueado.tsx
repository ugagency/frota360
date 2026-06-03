'use client'

import { Lock, MessageCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const WA_BASE = 'https://wa.me/5531975142675?text='

interface ModuloBloqueadoProps {
  nomeModulo: string
  descricao: string
}

export function ModuloBloqueado({ nomeModulo, descricao }: ModuloBloqueadoProps) {
  const waMsg = encodeURIComponent(
    `Olá! Quero fazer upgrade para o plano Profissional e ter acesso ao módulo ${nomeModulo}.`,
  )

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-brand-surface rounded-xl flex items-center justify-center mx-auto mb-5">
          <Lock className="h-7 w-7 text-brand" />
        </div>

        <h2 className="font-display font-bold text-xl text-ink mb-2">{nomeModulo}</h2>
        <p className="text-ink-secondary text-sm mb-1">
          Disponível no plano <strong className="text-ink">Profissional</strong>
        </p>
        <p className="text-ink-muted text-sm mb-7 leading-relaxed">{descricao}</p>

        <a
          href={`${WA_BASE}${waMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-brand text-white font-semibold
                     py-3 px-4 rounded mb-3 hover:bg-brand-dark transition-colors text-sm"
        >
          <MessageCircle className="h-4 w-4" />
          Fazer upgrade — R$447/mês
        </a>

        <Link
          href="/upgrade"
          className="inline-flex items-center gap-1 text-ink-muted text-xs hover:text-ink-secondary transition-colors"
        >
          Ver comparativo de planos
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  )
}
