'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil } from 'lucide-react'
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { MotoristaForm } from './motorista-form'
import type { MotoristaFormData } from '@/lib/validations/motorista'

type Props = {
  mode: 'create' | 'edit'
  motorista?: Partial<MotoristaFormData> & { id?: string }
  trigger?: React.ReactNode
  onSavedNavigate?: boolean
}

export function MotoristaFormSheet({ mode, motorista, trigger, onSavedNavigate }: Props) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const defaultTrigger = mode === 'create'
    ? <Button className="bg-brand hover:bg-brand-dark text-white"><Plus className="mr-1.5 h-4 w-4" /> Novo motorista</Button>
    : <Button variant="outline" size="sm"><Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar</Button>

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger ?? defaultTrigger}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="font-display text-2xl text-ink">
            {mode === 'create' ? 'Novo motorista' : 'Editar motorista'}
          </SheetTitle>
          <SheetDescription className="text-xs text-ink-secondary">
            {mode === 'create'
              ? 'Cadastre um motorista. Campos com * são obrigatórios.'
              : 'Atualize as informações deste motorista.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-hidden px-6 py-4">
          <MotoristaForm
            motorista={motorista}
            onCancel={() => setOpen(false)}
            onSuccess={(id) => {
              setOpen(false)
              router.refresh()
              if (onSavedNavigate && id) router.push(`/motoristas/${id}`)
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
