'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil } from 'lucide-react'
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { VeiculoForm } from './veiculo-form'
import type { VeiculoFormData } from '@/lib/validations/veiculo'

type Props = {
  mode: 'create' | 'edit'
  veiculo?: Partial<VeiculoFormData> & { id?: string }
  trigger?: React.ReactNode
  onSavedNavigate?: boolean // se true, navega para /frota/[id] após criar
}

export function VeiculoFormSheet({ mode, veiculo, trigger, onSavedNavigate }: Props) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const defaultTrigger = mode === 'create'
    ? <Button className="bg-brand hover:bg-brand-dark text-white"><Plus className="mr-1.5 h-4 w-4" /> Novo veículo</Button>
    : <Button variant="outline" size="sm"><Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar</Button>

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger ?? defaultTrigger}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="font-display text-2xl text-ink">
            {mode === 'create' ? 'Novo veículo' : 'Editar veículo'}
          </SheetTitle>
          <SheetDescription className="text-xs text-ink-secondary">
            {mode === 'create'
              ? 'Cadastre um veículo na sua frota. Campos com * são obrigatórios.'
              : 'Atualize as informações deste veículo.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-hidden px-6 py-4">
          <VeiculoForm
            veiculo={veiculo}
            onCancel={() => setOpen(false)}
            onSuccess={(id) => {
              setOpen(false)
              router.refresh()
              if (onSavedNavigate && id) router.push(`/frota/${id}`)
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
