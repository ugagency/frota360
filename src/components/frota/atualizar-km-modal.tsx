'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Gauge } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { atualizarKm } from '@/app/actions/veiculos'
import { formatKm } from '@/lib/utils'
import { parseKmInput, formatarKmInput } from '@/lib/format'

type Props = {
  veiculoId: string
  placa: string
  kmAtual: number
  trigger?: React.ReactNode
}

export function AtualizarKmModal({ veiculoId, placa, kmAtual, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [valor, setValor] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function submit() {
    const novaKm = parseKmInput(valor)
    if (novaKm < kmAtual) {
      toast.error(`KM deve ser ≥ ${formatKm(kmAtual)}`)
      return
    }
    startTransition(async () => {
      const r = await atualizarKm(veiculoId, novaKm)
      if (!r.ok) { toast.error(r.error); return }
      toast.success(`KM atualizada para ${formatKm(novaKm)}`)
      setOpen(false)
      setValor('')
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Gauge className="mr-1.5 h-3.5 w-3.5" /> Atualizar KM
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Atualizar KM</DialogTitle>
          <DialogDescription>
            <span className="font-mono font-medium">{placa}</span> — registre o hodômetro atual.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Nova quilometragem</Label>
          <Input
            inputMode="numeric"
            autoFocus
            className="font-mono text-base"
            value={valor}
            onChange={(e) => setValor(formatarKmInput(e.target.value))}
            placeholder={formatKm(kmAtual)}
          />
          <p className="text-xs text-ink-muted">
            Atual: <span className="font-mono">{formatKm(kmAtual)}</span>
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancelar</Button>
          <Button onClick={submit} disabled={pending || !valor} className="bg-brand hover:bg-brand-dark text-white">
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
