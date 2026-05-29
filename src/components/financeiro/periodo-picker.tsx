'use client'

import { useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function PeriodoPicker() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [, startT] = useTransition()

  const de  = params.get('de')  ?? defaultDe()
  const ate = params.get('ate') ?? defaultAte()

  function atualizar(patch: { de?: string; ate?: string }) {
    const next = new URLSearchParams(params.toString())
    if (patch.de  !== undefined) patch.de  ? next.set('de',  patch.de)  : next.delete('de')
    if (patch.ate !== undefined) patch.ate ? next.set('ate', patch.ate) : next.delete('ate')
    startT(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }))
  }

  function presetMesAtual() {
    atualizar({ de: defaultDe(), ate: defaultAte() })
  }

  function presetMesAnterior() {
    const d = new Date()
    const inicio = new Date(d.getFullYear(), d.getMonth() - 1, 1)
    const fim    = new Date(d.getFullYear(), d.getMonth(), 0)
    atualizar({ de: inicio.toISOString().slice(0, 10), ate: fim.toISOString().slice(0, 10) })
  }

  function presetUltimos90() {
    const fim = new Date()
    const inicio = new Date()
    inicio.setDate(inicio.getDate() - 90)
    atualizar({ de: inicio.toISOString().slice(0, 10), ate: fim.toISOString().slice(0, 10) })
  }

  return (
    <div className="flex flex-wrap items-center gap-2 bg-app-card border rounded-md p-2">
      <Calendar size={14} className="text-ink-muted ml-1" />
      <Input type="date" className="w-[150px] font-mono" value={de}  onChange={(e) => atualizar({ de:  e.target.value })} />
      <span className="text-xs text-ink-muted">até</span>
      <Input type="date" className="w-[150px] font-mono" value={ate} onChange={(e) => atualizar({ ate: e.target.value })} />
      <div className="flex gap-1 ml-1">
        <Button variant="ghost" size="sm" onClick={presetMesAtual} className="text-xs h-8">Mês atual</Button>
        <Button variant="ghost" size="sm" onClick={presetMesAnterior} className="text-xs h-8">Mês anterior</Button>
        <Button variant="ghost" size="sm" onClick={presetUltimos90} className="text-xs h-8">90 dias</Button>
      </div>
    </div>
  )
}

function defaultDe() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}
function defaultAte() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)
}
