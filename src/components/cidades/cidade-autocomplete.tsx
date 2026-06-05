'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
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
  const [input, setInput] = useState('')
  const [sugestoes, setSugestoes] = useState<CidadeOption[]>([])
  const [aberto, setAberto] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const containerRef = useRef<HTMLDivElement>(null)
  // Guarda o último value emitido por nós via onChange
  const emittedRef = useRef<string>('')

  // Só reseta o input quando o pai limpa o value externamente (ex: form.reset)
  useEffect(() => {
    if (!value && emittedRef.current) {
      emittedRef.current = ''
      setInput('')
    }
  }, [value])

  const buscar = useCallback(async (q: string) => {
    if (q.length < 3) { setSugestoes([]); setAberto(false); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/cidades?q=${encodeURIComponent(q)}`)
      if (!res.ok) throw new Error('erro')
      const data: CidadeOption[] = await res.json()
      setSugestoes(data)
      setAberto(data.length > 0)
    } catch {
      setSugestoes([])
      setAberto(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => buscar(input), 300)
    return () => clearTimeout(debounceRef.current)
  }, [input, buscar])

  // Fechar ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function selecionar(cidade: CidadeOption) {
    emittedRef.current = cidade.value
    setInput(cidade.label)
    onChange(cidade.value)
    setSugestoes([])
    setAberto(false)
  }

  function handleBlur() {
    setTimeout(() => {
      setAberto(false)
      // Fallback: se digitou sem selecionar da lista, emite texto livre
      if (input && !emittedRef.current) {
        emittedRef.current = input
        onChange(input)
      }
    }, 150)
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none z-10" />
      <Input
        name={name}
        value={input}
        onChange={e => {
          const v = e.target.value
          setInput(v)
          emittedRef.current = '' // ao editar, descarta seleção anterior
          onChange('')            // sinaliza campo inválido para validação
        }}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className="pl-9"
        autoComplete="off"
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
      )}
      {aberto && sugestoes.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-popover border rounded-md shadow-md max-h-56 overflow-auto">
          {sugestoes.map(cidade => (
            <li
              key={cidade.ibgeId}
              onMouseDown={e => { e.preventDefault(); selecionar(cidade) }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
            >
              <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{cidade.municipio}</span>
              <span className="text-xs text-muted-foreground font-mono">{cidade.estado}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
