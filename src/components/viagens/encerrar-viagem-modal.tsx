'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Flag } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { encerrarViagem } from '@/app/actions/viagens'
import { formatKm } from '@/lib/utils'
import { parseKmInput, formatarKmInput } from '@/lib/format'

type Props = {
  viagemId: string
  numero: string
  kmSaida: number | null
  trigger?: React.ReactNode
}

export function EncerrarViagemModal({ viagemId, numero, kmSaida, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [km, setKm] = useState('')
  const [dataHora, setDataHora] = useState(() => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
  })
  const [obs, setObs] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function submit() {
    const novaKm = parseKmInput(km)
    if (kmSaida != null && novaKm <= kmSaida) {
      toast.error(`KM de chegada deve ser maior que ${formatKm(kmSaida)}`)
      return
    }
    startTransition(async () => {
      const r = await encerrarViagem(viagemId, {
        km_chegada: novaKm,
        data_chegada_real: new Date(dataHora).toISOString(),
        observacoes: obs.trim() || null,
      })
      if (!r.ok) { toast.error(r.error); return }
      toast.success(`Viagem ${numero} encerrada.`)
      setOpen(false)
      setKm(''); setObs('')
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-accent hover:bg-accent-mid text-white">
            <Flag className="mr-1.5 h-4 w-4" /> Encerrar viagem
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Encerrar {numero}</DialogTitle>
          <DialogDescription>
            Registre o KM e horário de chegada. Esta ação atualiza o veículo para <strong>Ativo</strong> e recalcula alertas de revisão.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>KM de chegada *</Label>
            <Input
              inputMode="numeric"
              autoFocus
              className="font-mono"
              value={km}
              onChange={(e) => setKm(formatarKmInput(e.target.value))}
              placeholder={kmSaida ? formatKm(kmSaida) : '0'}
            />
            {kmSaida != null && (
              <p className="text-xs text-ink-muted">KM de saída: <span className="font-mono">{formatKm(kmSaida)}</span></p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Data e hora da chegada *</Label>
            <Input type="datetime-local" className="font-mono" value={dataHora} onChange={(e) => setDataHora(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea rows={3} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ocorrências, atrasos, etc." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancelar</Button>
          <Button onClick={submit} disabled={pending || !km || !dataHora} className="bg-accent hover:bg-accent-mid text-white">
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Encerrar viagem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
