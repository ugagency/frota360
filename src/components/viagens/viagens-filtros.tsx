'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { STATUS_VIAGEM } from '@/lib/validations/viagem'

const STATUS_LABEL: Record<string, string> = {
  planejada: 'Planejada', em_andamento: 'Em andamento', concluida: 'Concluída', cancelada: 'Cancelada',
}

const DEBOUNCE_MS = 300

type Option = { id: string; label: string }

type Props = {
  motoristas: Option[]
  veiculos: Option[]
}

export function ViagensFiltros({ motoristas, veiculos }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [, startTransition] = useTransition()
  const [busca, setBusca] = useState(params.get('q') ?? '')

  useEffect(() => {
    const t = setTimeout(() => {
      const cur = params.get('q') ?? ''
      if (busca === cur) return
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
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }))
  }

  function limpar() {
    setBusca('')
    startTransition(() => router.replace(pathname, { scroll: false }))
  }

  const status   = params.get('status')   ?? 'todos'
  const motId    = params.get('motorista') ?? 'todos'
  const veiId    = params.get('veiculo')  ?? 'todos'
  const de       = params.get('de')       ?? ''
  const ate      = params.get('ate')      ?? ''
  const algum    = busca || status !== 'todos' || motId !== 'todos' || veiId !== 'todos' || de || ate

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[220px] max-w-md">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
        <Input value={busca} onChange={(e) => setBusca(e.target.value)}
               placeholder="Buscar por nº, origem, destino ou cliente…" className="pl-8" />
      </div>

      <Select value={status} onValueChange={(v) => atualizar({ status: v })}>
        <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os status</SelectItem>
          {STATUS_VIAGEM.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={motId} onValueChange={(v) => atualizar({ motorista: v })}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Motorista" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos motoristas</SelectItem>
          {motoristas.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={veiId} onValueChange={(v) => atualizar({ veiculo: v })}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Veículo" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos veículos</SelectItem>
          {veiculos.map((v) => <SelectItem key={v.id} value={v.id} className="font-mono">{v.label}</SelectItem>)}
        </SelectContent>
      </Select>

      <Input type="date" className="w-[140px] font-mono"
             value={de} onChange={(e) => atualizar({ de: e.target.value || null })} />
      <span className="text-xs text-ink-muted">até</span>
      <Input type="date" className="w-[140px] font-mono"
             value={ate} onChange={(e) => atualizar({ ate: e.target.value || null })} />

      {algum && (
        <Button variant="ghost" size="sm" onClick={limpar} className="text-ink-muted">
          <X className="mr-1 h-3.5 w-3.5" /> Limpar
        </Button>
      )}
    </div>
  )
}
