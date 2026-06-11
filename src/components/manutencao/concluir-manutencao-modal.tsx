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
import { concluirManutencao } from '@/app/actions/manutencoes'
import { parseKmInput, formatarKmInput } from '@/lib/format'

type Props = {
  manutencaoId: string
  valorAtual: number
  kmNaManutencao?: number | null
  trigger?: React.ReactNode
}

export function ConcluirManutencaoModal({ manutencaoId, valorAtual, kmNaManutencao, trigger }: Props) {
  const kmSugerido = kmNaManutencao ? kmNaManutencao + 50000 : null
  const [open, setOpen] = useState(false)
  const [dataSaida, setDataSaida] = useState(new Date().toISOString().slice(0, 10))
  const [kmProxima, setKmProxima] = useState(kmSugerido ? formatarKmInput(kmSugerido) : '')
  const [dataProxima, setDataProxima] = useState('')
  const [valorFinal, setValorFinal] = useState(String(valorAtual))
  const [pending, startT] = useTransition()
  const router = useRouter()

  function submit() {
    if (!dataSaida) { toast.error('Informe a data de saída'); return }
    startT(async () => {
      const r = await concluirManutencao(manutencaoId, {
        data_saida: dataSaida,
        km_proxima: kmProxima ? parseKmInput(kmProxima) : null,
        data_proxima: dataProxima || null,
        valor_total_final: Number(valorFinal) || 0,
      })
      if (!r.ok) { toast.error(r.error); return }
      toast.success('Manutenção concluída.')
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-accent hover:bg-accent-mid text-white">
            <Flag className="mr-1.5 h-4 w-4" /> Concluir manutenção
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Concluir manutenção</DialogTitle>
          <DialogDescription>
            Veículo volta para <strong>Ativo</strong>. Alertas pendentes de revisão deste veículo serão resolvidos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Data de saída *</Label>
            <Input type="date" className="font-mono" value={dataSaida} onChange={(e) => setDataSaida(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>KM próx. revisão</Label>
              <Input
                inputMode="numeric" className="font-mono" placeholder="—"
                value={kmProxima}
                onChange={(e) => setKmProxima(formatarKmInput(e.target.value))}
              />
              {kmNaManutencao && (
                <p className="text-xs text-ink-muted">
                  Sugestão: {(kmNaManutencao + 50000).toLocaleString('pt-BR')} km (KM entrada + 50.000)
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Data próx. revisão</Label>
              <Input type="date" className="font-mono" value={dataProxima} onChange={(e) => setDataProxima(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Valor total final (R$) *</Label>
            <Input type="number" step="0.01" min="0" className="font-mono" value={valorFinal} onChange={(e) => setValorFinal(e.target.value)} />
            <p className="text-xs text-ink-muted">Pode diferir do orçado se houver itens extras.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancelar</Button>
          <Button onClick={submit} disabled={pending} className="bg-accent hover:bg-accent-mid text-white">
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Concluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
