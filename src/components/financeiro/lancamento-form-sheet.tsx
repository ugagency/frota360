'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { LancamentoForm, type SelectOption } from './lancamento-form'
import type { LancamentoFormData } from '@/lib/validations/financeiro'

type Props = {
  mode: 'create' | 'edit'
  veiculos: SelectOption[]
  viagens: Array<SelectOption & { veiculo_id: string }>
  lancamento?: Partial<LancamentoFormData> & { id?: string }
  trigger?: React.ReactNode
}

export function LancamentoFormSheet({ mode, veiculos, viagens, lancamento, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const defaultTrigger = mode === 'create'
    ? <Button className="bg-brand hover:bg-brand-dark text-white"><Plus className="mr-1.5 h-4 w-4" /> Novo lançamento</Button>
    : <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil size={15} /></Button>

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger ?? defaultTrigger}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="font-display text-2xl text-ink">
            {mode === 'create' ? 'Novo lançamento' : 'Editar lançamento'}
          </SheetTitle>
          <SheetDescription className="text-xs text-ink-secondary">
            Receita ou despesa manual. Lançamentos automáticos (frete, manutenção) vêm dos módulos.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-hidden px-6 py-4">
          <LancamentoForm
            veiculos={veiculos} viagens={viagens} lancamento={lancamento}
            onCancel={() => setOpen(false)}
            onSuccess={() => { setOpen(false); router.refresh() }}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
