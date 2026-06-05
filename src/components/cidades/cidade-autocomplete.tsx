'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { CidadeOption } from '@/lib/ibge/cidades'

interface CidadeAutocompleteProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  name?: string
  disabled?: boolean
  className?: string
}

export function CidadeAutocomplete({
  value,
  onChange,
  placeholder = 'Ex: Betim/MG',
  name,
  disabled,
  className,
}: CidadeAutocompleteProps) {
  const [input, setInput] = useState(value || '')
  const [sugestoes, setSugestoes] = useState<CidadeOption[]>([])
  const [aberto, setAberto] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focado, setFocado] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const selecionouRef = useRef(false)

  const buscar = useCallback(async (q: string) => {
    if (q.length < 3) { setSugestoes([]); setAberto(false); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/cidades?q=${encodeURIComponent(q)}`)
      const data: CidadeOption[] = await res.json()
      setSugestoes(data)
      if (!selecionouRef.current) setAberto(data.length > 0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selecionouRef.current) { selecionouRef.current = false; return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => buscar(input), 200)
    return () => clearTimeout(debounceRef.current)
  }, [input, buscar])

  useEffect(() => {
    if (value !== undefined && value !== input) setInput(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  function selecionar(cidade: CidadeOption) {
    selecionouRef.current = true
    setInput(cidade.label)
    onChange(cidade.value)
    setSugestoes([])
    setAberto(false)
  }

  function onBlur() {
    setFocado(false)
    // Se o usuário digitou algo sem selecionar, preserve como texto livre
    setTimeout(() => {
      setAberto(false)
      if (input && !sugestoes.find(s => s.label === input || s.value === input)) {
        onChange(input)
      }
    }, 150)
  }

  return (
    <Popover open={aberto && focado} onOpenChange={setAberto}>
      <PopoverAnchor asChild>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            name={name}
            value={input}
            onChange={e => {
              selecionouRef.current = false
              setInput(e.target.value)
              onChange('')
            }}
            onFocus={() => {
              setFocado(true)
              if (sugestoes.length > 0) setAberto(true)
            }}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={cn('pl-9', className)}
            autoComplete="off"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="p-1 w-[var(--radix-popover-trigger-width)]"
        onOpenAutoFocus={e => e.preventDefault()}
        side="bottom"
        align="start"
        sideOffset={4}
      >
        {sugestoes.length === 0 ? (
          <p className="py-2 text-center text-xs text-muted-foreground">Nenhuma cidade encontrada</p>
        ) : (
          <ul role="listbox">
            {sugestoes.map(cidade => (
              <li
                key={cidade.ibgeId}
                role="option"
                aria-selected={false}
                onMouseDown={e => { e.preventDefault(); selecionar(cidade) }}
                className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{cidade.municipio}</span>
                <span className="text-xs text-muted-foreground font-mono">{cidade.estado}</span>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
