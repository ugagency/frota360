'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { CATEGORIAS, CATEGORIA_LABEL } from '@/lib/validations/financeiro'

const DEBOUNCE = 300

type Option = { id: string; label: string }

export function FinanceiroFiltros({ veiculos }: { veiculos: Option[] }) {
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
    const next = new URLSearchParams(params.toString())
    ;['q', 'tipo', 'categoria', 'veiculo'].forEach((k) => next.delete(k))
    startT(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }))
  }

  const tipo = params.get('tipo') ?? 'todos'
  const cat = params.get('categoria') ?? 'todos'
  const vei = params.get('veiculo') ?? 'todos'
  const algum = busca || tipo !== 'todos' || cat !== 'todos' || vei !== 'todos'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[220px] max-w-md">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
        <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por descrição…" className="pl-8" />
      </div>

      <Select value={tipo} onValueChange={(v) => atualizar({ tipo: v })}>
        <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os tipos</SelectItem>
          <SelectItem value="receita">Receita</SelectItem>
          <SelectItem value="despesa">Despesa</SelectItem>
        </SelectContent>
      </Select>

      <Select value={cat} onValueChange={(v) => atualizar({ categoria: v })}>
        <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas as categorias</SelectItem>
          {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{CATEGORIA_LABEL[c]}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={vei} onValueChange={(v) => atualizar({ veiculo: v })}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Veículo" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos veículos</SelectItem>
          {veiculos.map((v) => <SelectItem key={v.id} value={v.id} className="font-mono">{v.label}</SelectItem>)}
        </SelectContent>
      </Select>

      {algum && (
        <Button variant="ghost" size="sm" onClick={limpar} className="text-ink-muted">
          <X className="mr-1 h-3.5 w-3.5" /> Limpar
        </Button>
      )}
    </div>
  )
}
