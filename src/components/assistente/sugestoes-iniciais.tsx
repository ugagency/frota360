'use client'

import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

const SUGESTOES = [
  'Como está minha operação hoje?',
  'Tem algum alerta crítico?',
  'Quanto gastei esse mês?',
  'Qual motorista mais rodou?',
]

export function SugestoesIniciais({ onPick }: { onPick: (texto: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-6 text-center">
      <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-brand-surface text-brand-dark mb-3">
        <Sparkles size={22} />
      </div>
      <h3 className="font-display text-base font-semibold text-ink">Pergunte sobre sua operação</h3>
      <p className="mt-1 text-xs text-ink-muted max-w-xs">
        O assistente consulta dados reais de frota, motoristas, viagens, manutenções e financeiro.
      </p>

      <div className="mt-5 flex flex-wrap justify-center gap-2 max-w-md">
        {SUGESTOES.map((s) => (
          <Button
            key={s}
            variant="outline"
            size="sm"
            onClick={() => onPick(s)}
            className="text-xs h-auto py-1.5 px-3 rounded-full text-ink-secondary hover:bg-brand-surface hover:text-brand-dark hover:border-brand-border"
          >
            {s}
          </Button>
        ))}
      </div>
    </div>
  )
}
