'use client'

import { useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

const STATUS = [
  { value: 'pendente',    label: 'Pendentes' },
  { value: 'visualizado', label: 'Visualizados' },
  { value: 'resolvido',   label: 'Resolvidos' },
] as const

const TIPOS = [
  { value: 'manutencao_km',    label: 'Manutenção (KM)' },
  { value: 'manutencao_data',  label: 'Manutenção (data)' },
  { value: 'cnh_vencimento',   label: 'CNH' },
  { value: 'mopp_vencimento',  label: 'MOPP' },
  { value: 'licenciamento',    label: 'Licenciamento' },
] as const

const PRIORIDADES = [
  { value: 'critico', label: 'Crítico' },
  { value: 'alto',    label: 'Alto' },
  { value: 'medio',   label: 'Médio' },
  { value: 'baixo',   label: 'Baixo' },
] as const

export function AlertasFiltros() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [, startT] = useTransition()

  function atualizar(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (!v || v === 'todos') next.delete(k); else next.set(k, v)
    }
    startT(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }))
  }

  function limpar() {
    startT(() => router.replace(pathname, { scroll: false }))
  }

  const status = params.get('status') ?? 'pendente'
  const tipo   = params.get('tipo')   ?? 'todos'
  const prio   = params.get('prio')   ?? 'todos'
  const algum  = status !== 'pendente' || tipo !== 'todos' || prio !== 'todos'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={status} onValueChange={(v) => atualizar({ status: v })}>
        <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os status</SelectItem>
          {STATUS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={tipo} onValueChange={(v) => atualizar({ tipo: v })}>
        <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os tipos</SelectItem>
          {TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={prio} onValueChange={(v) => atualizar({ prio: v })}>
        <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas prioridades</SelectItem>
          {PRIORIDADES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
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
