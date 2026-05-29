'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MoreVertical, Eye, Pencil, Power, Gauge } from 'lucide-react'
import { toast } from 'sonner'

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { inativarVeiculo, reativarVeiculo } from '@/app/actions/veiculos'
import { VeiculoFormSheet } from './veiculo-form-sheet'
import { AtualizarKmModal } from './atualizar-km-modal'
import type { VeiculoFormData } from '@/lib/validations/veiculo'

type Props = {
  veiculo: { id: string; placa: string; status: string; km_atual: number } & Partial<VeiculoFormData>
}

export function FrotaRowActions({ veiculo }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)

  function toggleStatus() {
    startTransition(async () => {
      const r = veiculo.status === 'inativo'
        ? await reativarVeiculo(veiculo.id)
        : await inativarVeiculo(veiculo.id)
      if (!r.ok) { toast.error(r.error); return }
      toast.success(veiculo.status === 'inativo' ? 'Veículo reativado.' : 'Veículo inativado.')
      router.refresh()
    })
  }

  return (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Ver detalhes">
        <Link href={`/frota/${veiculo.id}`}><Eye size={15} /></Link>
      </Button>

      <VeiculoFormSheet
        mode="edit"
        veiculo={veiculo}
        trigger={
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar"><Pencil size={15} /></Button>
        }
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Mais"><MoreVertical size={15} /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <AtualizarKmModal
            veiculoId={veiculo.id}
            placa={veiculo.placa}
            kmAtual={veiculo.km_atual}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Gauge className="mr-2 h-4 w-4" /> Atualizar KM
              </DropdownMenuItem>
            }
          />
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={toggleStatus} className={veiculo.status === 'inativo' ? 'text-accent' : 'text-destructive'}>
            <Power className="mr-2 h-4 w-4" />
            {veiculo.status === 'inativo' ? 'Reativar' : 'Inativar'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
