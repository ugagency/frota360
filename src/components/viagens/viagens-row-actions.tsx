'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, MoreVertical, XCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CancelarViagemModal } from './cancelar-viagem-modal'
import { encerrarViagem } from '@/app/actions/viagens'

type Props = {
  viagem: { id: string; numero: string; status: string; destino: string; km_saida: number | null }
}

export function ViagensRowActions({ viagem }: Props) {
  const canCancel = viagem.status === 'planejada' || viagem.status === 'em_andamento'

  return (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      {viagem.status === 'em_andamento' && <BotaoChegou viagem={viagem} />}

      <Button asChild variant="ghost" size="icon" className="h-10 w-10" title="Ver detalhes">
        <Link href={`/viagens/${viagem.id}`}><Eye size={15} /></Link>
      </Button>

      {canCancel && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10" title="Mais"><MoreVertical size={15} /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <CancelarViagemModal
              viagemId={viagem.id}
              numero={viagem.numero}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                  <XCircle className="mr-2 h-4 w-4" /> Cancelar viagem
                </DropdownMenuItem>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

function BotaoChegou({ viagem }: { viagem: Props['viagem'] }) {
  const [aberto, setAberto] = useState(false)
  const [kmChegada, setKmChegada] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function confirmar() {
    const km = Number(kmChegada)
    if (!km || isNaN(km)) { toast.error('Informe um KM válido'); return }
    if (viagem.km_saida != null && km <= viagem.km_saida) {
      toast.error(`KM deve ser maior que ${viagem.km_saida.toLocaleString('pt-BR')}`)
      return
    }
    setCarregando(true)
    const result = await encerrarViagem(viagem.id, {
      km_chegada: km,
      data_chegada_real: new Date().toISOString(),
    })
    setCarregando(false)
    if (result.ok) {
      toast.success('Chegada registrada!')
      setAberto(false)
      setKmChegada('')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs
                   font-medium bg-green-100 text-green-800 hover:bg-green-200
                   transition-colors border border-green-200 whitespace-nowrap"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Chegou
      </button>

      <Dialog open={aberto} onOpenChange={(v) => { setAberto(v); if (!v) setKmChegada('') }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar chegada</DialogTitle>
            <p className="text-sm text-ink-secondary">{viagem.numero} · {viagem.destino}</p>
          </DialogHeader>

          <div className="py-2 space-y-1.5">
            <Label htmlFor="km-chegada" className="text-sm font-medium">KM de chegada *</Label>
            <Input
              id="km-chegada"
              type="number"
              placeholder={viagem.km_saida != null ? String(viagem.km_saida + 500) : ''}
              value={kmChegada}
              onChange={(e) => setKmChegada(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmar()}
              autoFocus
            />
            {viagem.km_saida != null && (
              <p className="text-xs text-ink-muted">KM de saída: {viagem.km_saida.toLocaleString('pt-BR')} km</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)} disabled={carregando}>
              Cancelar
            </Button>
            <Button
              onClick={confirmar}
              disabled={carregando || !kmChegada}
              className="bg-brand hover:bg-brand-dark text-white"
            >
              {carregando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmar chegada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
