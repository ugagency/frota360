'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Play } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { EncerrarViagemModal } from './encerrar-viagem-modal'
import { CancelarViagemModal } from './cancelar-viagem-modal'
import { iniciarViagem } from '@/app/actions/viagens'

type Props = {
  viagemId: string
  numero: string
  status: 'planejada' | 'em_andamento' | 'concluida' | 'cancelada'
  kmSaida: number | null
}

export function ViagemActionsBar({ viagemId, numero, status, kmSaida }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function iniciar() {
    startTransition(async () => {
      const r = await iniciarViagem(viagemId)
      if (!r.ok) { toast.error(r.error); return }
      toast.success(`Viagem ${numero} iniciada.`)
      router.refresh()
    })
  }

  if (status === 'concluida' || status === 'cancelada') return null

  return (
    <div className="flex flex-wrap gap-2">
      {status === 'planejada' && (
        <Button onClick={iniciar} disabled={pending} className="bg-brand hover:bg-brand-dark text-white">
          {pending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Play className="mr-1.5 h-4 w-4" />}
          Iniciar viagem
        </Button>
      )}

      {status === 'em_andamento' && (
        <EncerrarViagemModal viagemId={viagemId} numero={numero} kmSaida={kmSaida} />
      )}

      <CancelarViagemModal viagemId={viagemId} numero={numero} />
    </div>
  )
}
