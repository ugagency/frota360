'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { ImportacaoWizard } from './importacao-wizard'

type Entidade = 'veiculos' | 'motoristas' | 'clientes'

const TITULO: Record<Entidade, string> = {
  veiculos:   'Importar veículos',
  motoristas: 'Importar motoristas',
  clientes:   'Importar clientes',
}

export function ImportacaoDialog({ entidade }: { entidade: Entidade }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Upload size={15} /> Importar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{TITULO[entidade]}</DialogTitle>
        </DialogHeader>
        <ImportacaoWizard entidade={entidade} />
      </DialogContent>
    </Dialog>
  )
}
