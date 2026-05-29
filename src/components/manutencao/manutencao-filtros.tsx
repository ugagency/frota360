'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { TIPO_MANUTENCAO, STATUS_MANUTENCAO, TIPO_LABELS } from '@/lib/validations/manutencao'

const STATUS_LABEL: Record<string, string> = {
  agendada: 'Agendada', em_andamento: 'Em andamento', concluida: 'Concluída',
}

const DEBOUNCE = 300

export function ManutencaoFiltros() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [, startT] = useTransition()
  const [busca, setBusca] = useState(params.get('q') ?? '')

  useEffect(() => {
    const t = setTimeout(() => {
      if (busca === (params.get('q') ?? '')) return
      atualizar({ q: busca || null })
    }, DEBOUNCE)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca])

  function atualizar(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (!v || v === 'todos') next.delete(k); else next.set(k, v)
    }
    startT(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }))
  }

  function limpar() {
    setBusca('')
    startT(() => router.replace(pathname, { scroll: false }))
  }

  const tipo = params.get('tipo') ?? 'todos'
  const status = params.get('status') ?? 'todos'
  const de = params.get('de') ?? ''
  const ate = params.get('ate') ?? ''
  const algum = busca || tipo !== 'todos' || status !== 'todos' || de || ate

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[220px] max-w-md">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
        <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por placa ou oficina…" className="pl-8" />
      </div>

      <Select value={tipo} onValueChange={(v) => atualizar({ tipo: v })}>
        <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os tipos</SelectItem>
          {TIPO_MANUTENCAO.map((t) => <SelectItem key={t} value={t}>{TIPO_LABELS[t]}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={(v) => atualizar({ status: v })}>
        <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os status</SelectItem>
          {STATUS_MANUTENCAO.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
        </SelectContent>
      </Select>

      <Input type="date" className="w-[140px] font-mono" value={de} onChange={(e) => atualizar({ de: e.target.value || null })} />
      <span className="text-xs text-ink-muted">até</span>
      <Input type="date" className="w-[140px] font-mono" value={ate} onChange={(e) => atualizar({ ate: e.target.value || null })} />

      {algum && (
        <Button variant="ghost" size="sm" onClick={limpar} className="text-ink-muted">
          <X className="mr-1 h-3.5 w-3.5" /> Limpar
        </Button>
      )}
    </div>
  )
}
