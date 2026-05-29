'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Bot } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { deletarConversa } from '@/app/actions/assistente'
import { cn } from '@/lib/utils'

export type ConversaResumo = {
  id: string
  titulo: string | null
  updated_at: string
}

type Props = {
  conversas: ConversaResumo[]
  conversaAtivaId: string | null
  onSelect: (id: string | null) => void
}

export function ConversasSidebar({ conversas, conversaAtivaId, onSelect }: Props) {
  const router = useRouter()
  const [, startT] = useTransition()
  const grupos = agrupar(conversas)

  function deletar(id: string) {
    const fd = new FormData()
    fd.append('id', id)
    startT(async () => {
      const r = await deletarConversa(fd)
      if (!r.ok) { toast.error(r.error); return }
      toast.success('Conversa removida.')
      if (id === conversaAtivaId) onSelect(null)
      router.refresh()
    })
  }

  return (
    <aside className="hidden md:flex md:flex-col w-[280px] shrink-0 border-r bg-app-card">
      <div className="p-3 border-b">
        <Button
          onClick={() => onSelect(null)}
          variant="outline"
          className="w-full justify-start text-sm"
        >
          <Plus className="mr-2 h-4 w-4" /> Nova conversa
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {conversas.length === 0 ? (
          <div className="p-6 text-center text-xs text-ink-muted">
            <Bot size={24} className="mx-auto mb-2 opacity-40" />
            Nenhuma conversa ainda.
          </div>
        ) : (
          grupos.map((g) => (
            <div key={g.label} className="space-y-1">
              <div className="px-2 text-[10px] font-mono uppercase tracking-wider text-ink-muted">{g.label}</div>
              {g.items.map((c) => {
                const ativa = c.id === conversaAtivaId
                return (
                  <div
                    key={c.id}
                    className={cn(
                      'group flex items-center gap-1 rounded px-2 py-1.5 text-sm cursor-pointer transition-colors',
                      ativa
                        ? 'bg-brand-surface text-ink border-l-[3px] border-brand'
                        : 'hover:bg-app-subtle text-ink-secondary',
                    )}
                  >
                    <button
                      onClick={() => onSelect(c.id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="truncate">{c.titulo ?? 'Conversa'}</div>
                      <div className="text-[10px] font-mono text-ink-muted">{horaCurta(c.updated_at)}</div>
                    </button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost" size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-ink-muted hover:text-destructive"
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Excluir"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover conversa?</AlertDialogTitle>
                          <AlertDialogDescription>
                            <strong>{c.titulo ?? 'Conversa sem título'}</strong> será removida permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deletar(c.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>
    </aside>
  )
}

function horaCurta(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

type Grupo = { label: string; items: ConversaResumo[] }
function agrupar(conversas: ConversaResumo[]): Grupo[] {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const ontem = new Date(hoje); ontem.setDate(ontem.getDate() - 1)
  const semana = new Date(hoje); semana.setDate(semana.getDate() - 7)

  const buckets: Record<string, ConversaResumo[]> = { Hoje: [], Ontem: [], 'Esta semana': [], Anteriores: [] }
  for (const c of conversas) {
    const d = new Date(c.updated_at)
    if (d >= hoje) buckets['Hoje'].push(c)
    else if (d >= ontem) buckets['Ontem'].push(c)
    else if (d >= semana) buckets['Esta semana'].push(c)
    else buckets['Anteriores'].push(c)
  }
  return Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }))
}
