'use client'

import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ClienteStatusBadge } from './cliente-status-badge'
import { ClienteFormSheet } from './cliente-form-sheet'
import { formatDate } from '@/lib/utils'

export type ClienteLista = {
  id: string
  razao_social: string
  cnpj: string | null
  cidade: string | null
  estado: string | null
  status: string
  segmento: string | null
  proxima_acao: string | null
  prazo_pagamento: number
}

export function ClientesTabela({ clientes }: { clientes: ClienteLista[] }) {
  if (clientes.length === 0) {
    return (
      <Card className="p-12 text-center bg-app-card">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-brand-surface text-brand mb-3">
          <Building2 size={28} />
        </div>
        <div className="font-display text-lg font-semibold text-ink">Nenhum cliente encontrado.</div>
        <div className="mt-1 text-sm text-ink-secondary">Cadastre seu primeiro cliente usando o botão acima.</div>
      </Card>
    )
  }

  return (
    <Card className="bg-app-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-app-subtle/50">
              <th className="text-left px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-ink-muted">Empresa</th>
              <th className="text-left px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-ink-muted hidden sm:table-cell">Cidade/UF</th>
              <th className="text-left px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-ink-muted hidden md:table-cell">Segmento</th>
              <th className="text-left px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-ink-muted">Status</th>
              <th className="text-left px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-ink-muted hidden lg:table-cell">Próx. ação</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {clientes.map((c) => (
              <tr key={c.id} className="hover:bg-app-subtle/40 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/clientes/${c.id}`} className="font-medium text-ink hover:text-brand leading-tight">
                    {c.razao_social}
                  </Link>
                  {c.cnpj && <div className="font-mono text-xs text-ink-muted mt-0.5">{c.cnpj}</div>}
                </td>
                <td className="px-4 py-3 text-ink-secondary hidden sm:table-cell">
                  {c.cidade ? `${c.cidade}${c.estado ? ` / ${c.estado}` : ''}` : '—'}
                </td>
                <td className="px-4 py-3 text-ink-secondary hidden md:table-cell">
                  {c.segmento ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <ClienteStatusBadge status={c.status} />
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {c.proxima_acao ? (
                    <span className={isVencida(c.proxima_acao) ? 'text-red-600 font-medium text-xs' : 'text-ink-secondary text-xs'}>
                      {formatDate(c.proxima_acao)}
                    </span>
                  ) : <span className="text-ink-muted text-xs">—</span>}
                </td>
                <td className="px-4 py-3">
                  <ClienteFormSheet
                    mode="edit"
                    cliente={c as Parameters<typeof ClienteFormSheet>[0]['cliente']}
                    trigger={
                      <button className="p-1 rounded hover:bg-app-subtle text-ink-muted hover:text-ink">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                      </button>
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function isVencida(data: string) {
  return new Date(data) < new Date(new Date().toDateString())
}
