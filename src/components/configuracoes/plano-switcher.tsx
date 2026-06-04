'use client'

import { useState, useTransition } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { atualizarPlano } from '@/app/actions/plano'
import type { Plano } from '@/lib/plano'

const PLANOS: {
  id: Plano
  nome: string
  preco: string
  descricao: string
  features: string[]
}[] = [
  {
    id: 'demo',
    nome: 'Demo',
    preco: 'Grátis · 7 dias',
    descricao: 'Acesso limitado para avaliação.',
    features: ['Frota, Motoristas, Viagens', 'Até 5 veículos', '1 usuário'],
  },
  {
    id: 'basico',
    nome: 'Básico',
    preco: 'R$ 197,90/mês',
    descricao: 'Para transportadoras de pequeno porte.',
    features: ['Frota, Motoristas, Viagens, Manutenção', 'Até 20 veículos', '2 usuários', 'Suporte por e-mail'],
  },
  {
    id: 'profissional',
    nome: 'Profissional',
    preco: 'R$ 447,00/mês',
    descricao: 'Acesso completo a todos os módulos.',
    features: ['Todos os módulos + Assistente IA', 'Veículos e usuários ilimitados', 'Checklists, Relatório contador, CT-e/MDF-e', 'Suporte WhatsApp prioritário'],
  },
]

interface Props {
  planoAtual: Plano
}

export function PlanoSwitcher({ planoAtual }: Props) {
  const [selecionado, setSelecionado] = useState<Plano>(planoAtual)
  const [pending, startTransition] = useTransition()

  function aplicar(plano: Plano) {
    if (plano === planoAtual) return
    setSelecionado(plano)
    startTransition(async () => {
      const res = await atualizarPlano(plano)
      if (!res.ok) {
        toast.error(res.error)
        setSelecionado(planoAtual)
      } else {
        toast.success(`Plano alterado para ${plano.charAt(0).toUpperCase() + plano.slice(1)}.`)
        // Recarrega para refletir os novos acessos
        window.location.reload()
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PLANOS.map((p) => {
          const isAtual = p.id === planoAtual
          const isSelecionado = p.id === selecionado

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => aplicar(p.id)}
              disabled={pending}
              className={`relative text-left rounded-xl border p-4 transition-all disabled:opacity-60 ${
                isAtual
                  ? 'border-brand bg-brand/5 shadow-sm'
                  : isSelecionado && pending
                  ? 'border-brand/50 bg-brand/3'
                  : 'border-border hover:border-brand/40 hover:bg-app-subtle'
              }`}
            >
              {/* Badge plano atual */}
              {isAtual && (
                <span className="absolute top-3 right-3 text-[9px] font-mono uppercase tracking-wider bg-brand text-white px-1.5 py-0.5 rounded">
                  Atual
                </span>
              )}

              {/* Loading spinner */}
              {isSelecionado && pending && (
                <span className="absolute top-3 right-3">
                  <Loader2 size={14} className="animate-spin text-brand" />
                </span>
              )}

              <p className="font-display font-bold text-ink text-base mb-0.5">{p.nome}</p>
              <p className="text-[11px] font-mono text-brand mb-2">{p.preco}</p>
              <ul className="space-y-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-ink-secondary">
                    <Check size={11} className="text-accent mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>

      <p className="text-[11px] text-ink-muted">
        Clique em um plano para ativar imediatamente. A alteração reflete em todos os módulos na mesma sessão.
      </p>
    </div>
  )
}
