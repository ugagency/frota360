'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { TIPO_VEICULO, TIPO_LABELS, STATUS_VEICULO } from '@/lib/validations/veiculo'

const STATUS_LABEL: Record<string, string> = {
  ativo: 'Ativo', em_viagem: 'Em viagem', em_manutencao: 'Em manutenção', inativo: 'Inativo',
}

const DEBOUNCE_MS = 300

export function FrotaFiltros() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [, startTransition] = useTransition()

  const [busca, setBusca] = useState(params.get('q') ?? '')

  // Debounce do input de busca
  useEffect(() => {
    const t = setTimeout(() => {
      const current = params.get('q') ?? ''
      if (busca === current) return
      atualizar({ q: busca || null })
    }, DEBOUNCE_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca])

  function atualizar(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '' || v === 'todos') next.delete(k)
      else next.set(k, v)
    }
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false })
    })
  }

  function limpar() {
    setBusca('')
    startTransition(() => router.replace(pathname, { scroll: false }))
  }

  const status = params.get('status') ?? 'todos'
  const tipo = params.get('tipo') ?? 'todos'
  const prop = params.get('proprietario') ?? 'todos'
  const algumFiltro = busca || status !== 'todos' || tipo !== 'todos' || prop !== 'todos'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[220px] max-w-md">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por placa, marca ou modelo…"
          className="pl-8"
        />
      </div>

      <Select value={status} onValueChange={(v) => atualizar({ status: v })}>
        <SelectTrigger className="w-[170px]"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os status</SelectItem>
          {STATUS_VEICULO.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={tipo} onValueChange={(v) => atualizar({ tipo: v })}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os tipos</SelectItem>
          {TIPO_VEICULO.map((t) => <SelectItem key={t} value={t}>{TIPO_LABELS[t]}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={prop} onValueChange={(v) => atualizar({ proprietario: v })}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Proprietário" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="proprio">Próprio</SelectItem>
          <SelectItem value="agregado">Agregado</SelectItem>
        </SelectContent>
      </Select>

      {algumFiltro && (
        <Button variant="ghost" size="sm" onClick={limpar} className="text-ink-muted">
          <X className="mr-1 h-3.5 w-3.5" /> Limpar
        </Button>
      )}
    </div>
  )
}
