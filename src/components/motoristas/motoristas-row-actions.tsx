'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MoreVertical, Eye, Pencil, Power } from 'lucide-react'
import { toast } from 'sonner'

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { inativarMotorista, reativarMotorista } from '@/app/actions/motoristas'
import { MotoristaFormSheet } from './motorista-form-sheet'
import type { MotoristaFormData } from '@/lib/validations/motorista'

type Props = {
  motorista: { id: string; status: string } & Partial<MotoristaFormData>
}

export function MotoristasRowActions({ motorista }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  function toggleStatus() {
    startTransition(async () => {
      const r = motorista.status === 'inativo'
        ? await reativarMotorista(motorista.id)
        : await inativarMotorista(motorista.id)
      if (!r.ok) { toast.error(r.error); return }
      toast.success(motorista.status === 'inativo' ? 'Motorista reativado.' : 'Motorista inativado.')
      router.refresh()
    })
  }

  return (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Ver detalhes">
        <Link href={`/motoristas/${motorista.id}`}><Eye size={15} /></Link>
      </Button>

      <MotoristaFormSheet
        mode="edit"
        motorista={motorista}
        trigger={
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar"><Pencil size={15} /></Button>
        }
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Mais"><MoreVertical size={15} /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={toggleStatus} className={motorista.status === 'inativo' ? 'text-accent' : 'text-destructive'}>
            <Power className="mr-2 h-4 w-4" />
            {motorista.status === 'inativo' ? 'Reativar' : 'Inativar'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
