'use client'

import { useFieldArray, type Control, type UseFormSetValue } from 'react-hook-form'
import { Plus, X } from 'lucide-react'
import { CidadeAutocomplete } from '@/components/cidades/cidade-autocomplete'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { ViagemCreateData } from '@/lib/validations/viagem'

interface DestinosMultiplosProps {
  control: Control<ViagemCreateData>
  setValue: UseFormSetValue<ViagemCreateData>
}

export function DestinosMultiplos({ control, setValue }: DestinosMultiplosProps) {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'destinos',
  })

  function onCidadeChange(index: number, cidade: string) {
    const current = fields[index]
    update(index, { ...current, cidade, cidade_label: cidade })
    // O destino principal é o último item
    if (index === fields.length - 1) {
      setValue('destino', cidade, { shouldValidate: true })
    }
  }

  function onObservacaoChange(index: number, obs: string) {
    update(index, { ...fields[index], observacao: obs })
  }

  function adicionarParada() {
    append({ ordem: fields.length + 1, cidade: '', cidade_label: '', observacao: '' })
  }

  function remover(index: number) {
    remove(index)
    // Atualiza destino principal após remoção
    const restantes = fields.filter((_, i) => i !== index)
    const ultimo = restantes[restantes.length - 1]
    setValue('destino', ultimo?.cidade ?? '', { shouldValidate: true })
  }

  return (
    <div className="space-y-2">
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-start gap-2">
          {/* Marcador de ordem */}
          <div className="flex flex-col items-center pt-2 shrink-0 gap-0.5">
            <div className={cn(
              'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0',
              index === fields.length - 1
                ? 'bg-red-100 text-red-700'
                : 'bg-amber-100 text-amber-800',
            )}>
              {index + 1}
            </div>
            {index < fields.length - 1 && (
              <div className="w-px h-2 bg-border" />
            )}
          </div>

          {/* Autocomplete de cidade */}
          <CidadeAutocomplete
            value={field.cidade}
            onChange={v => onCidadeChange(index, v)}
            placeholder={index === 0 ? 'Destino principal' : `Parada ${index + 1}`}
            className="flex-1"
          />

          {/* Observação opcional */}
          <Input
            placeholder="Obs. (opcional)"
            className="w-36 text-sm"
            value={field.observacao ?? ''}
            onChange={e => onObservacaoChange(index, e.target.value)}
          />

          {/* Remover */}
          {fields.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => remover(index)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ))}

      {fields.length < 10 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full border-dashed text-muted-foreground hover:text-foreground"
          onClick={adicionarParada}
        >
          <Plus className="h-3.5 w-3.5 mr-2" />
          Adicionar parada
        </Button>
      )}
    </div>
  )
}
