'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { atualizarValidadeCNH } from '@/app/actions/motoristas'

type Props = {
  motoristaId: string
  alertaId: string
}

export function CnhRenovacaoInline({ motoristaId, alertaId }: Props) {
  const [expandido, setExpandido] = useState(false)
  const [novaValidade, setNovaValidade] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    if (!novaValidade) return
    setSalvando(true)
    const result = await atualizarValidadeCNH(motoristaId, novaValidade, alertaId)
    setSalvando(false)
    if (result.ok) {
      toast.success('CNH atualizada e alerta resolvido!')
      setExpandido(false)
    } else {
      toast.error(result.error)
    }
  }

  if (!expandido) {
    return (
      <button
        type="button"
        onClick={() => setExpandido(true)}
        className="mt-1 text-xs text-brand hover:text-brand-dark underline"
      >
        Registrar renovação →
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 mt-2 flex-wrap">
      <input
        type="date"
        className="h-8 text-xs border rounded px-2 flex-1 min-w-[130px] bg-app-card"
        value={novaValidade}
        onChange={(e) => setNovaValidade(e.target.value)}
        min={new Date().toISOString().split('T')[0]}
      />
      <button
        type="button"
        onClick={salvar}
        disabled={!novaValidade || salvando}
        className="h-8 px-3 text-xs font-medium bg-brand text-white
                   rounded hover:bg-brand-dark disabled:opacity-50 whitespace-nowrap transition-colors"
      >
        {salvando ? 'Salvando...' : 'Salvar nova validade'}
      </button>
      <button
        type="button"
        onClick={() => setExpandido(false)}
        className="text-xs text-ink-muted hover:text-ink"
        aria-label="Fechar"
      >
        ✕
      </button>
    </div>
  )
}
