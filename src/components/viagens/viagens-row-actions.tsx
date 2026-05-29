'use client'

import Link from 'next/link'
import { Eye, MoreVertical, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CancelarViagemModal } from './cancelar-viagem-modal'

type Props = {
  viagem: { id: string; numero: string; status: string }
}

export function ViagensRowActions({ viagem }: Props) {
  const canCancel = viagem.status === 'planejada' || viagem.status === 'em_andamento'

  return (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Ver detalhes">
        <Link href={`/viagens/${viagem.id}`}><Eye size={15} /></Link>
      </Button>

      {canCancel && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Mais"><MoreVertical size={15} /></Button>
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
