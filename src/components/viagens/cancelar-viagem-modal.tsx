'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { cancelarViagem } from '@/app/actions/viagens'

type Props = {
  viagemId: string
  numero: string
  trigger?: React.ReactNode
}

export function CancelarViagemModal({ viagemId, numero, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function submit() {
    if (motivo.trim().length < 5) {
      toast.error('Informe um motivo (mínimo 5 caracteres)')
      return
    }
    startTransition(async () => {
      const r = await cancelarViagem(viagemId, { motivo: motivo.trim() })
      if (!r.ok) { toast.error(r.error); return }
      toast.success(`Viagem ${numero} cancelada.`)
      setOpen(false)
      setMotivo('')
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="text-destructive border-red-200 hover:bg-red-50">
            <XCircle className="mr-1.5 h-4 w-4" /> Cancelar viagem
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Cancelar {numero}</DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. O veículo volta para <strong>Ativo</strong> e os lançamentos automáticos da viagem serão removidos.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-xs text-red-700">
            Frete e adiantamento gerados na abertura serão deletados do financeiro.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label>Motivo do cancelamento *</Label>
          <Textarea rows={4} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex: Cliente desistiu, veículo apresentou pane…" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>Voltar</Button>
          <Button variant="destructive" onClick={submit} disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar cancelamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
