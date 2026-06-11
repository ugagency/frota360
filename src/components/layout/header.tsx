'use client'

import { usePathname } from 'next/navigation'
import { Bell, Menu } from 'lucide-react'
import { UserNav } from '@/components/layout/user-nav'
import { NAV_ITEMS } from '@/components/layout/nav-items'
import { cn } from '@/lib/utils'
import type { Plano } from '@/lib/plano'

type Props = {
  userNome: string
  userEmail: string
  plano:       Plano
  planoStatus: string
  alertasCriticos?: number
  onOpenMobile?: () => void
}

const PAGE_TITLES: Record<string, string> = {
  '/':              'Dashboard',
  '/frota':         'Frota',
  '/motoristas':    'Motoristas',
  '/viagens':       'Viagens',
  '/manutencao':    'Manutenção',
  '/checklists':    'Checklists',
  '/financeiro':    'Financeiro',
  '/relatorios':    'Relatórios',
  '/alertas':       'Alertas',
  '/assistente':    'Assistente IA',
  '/configuracoes': 'Configurações',
  '/upgrade':       'Planos',
  '/importar':      'Importar dados',
}

export function Header({ userNome, userEmail, plano, planoStatus, alertasCriticos = 0, onOpenMobile }: Props) {
  const pathname = usePathname()
  const title = resolveTitle(pathname)

  return (
    <header className="sticky top-0 z-20 h-14 flex items-center justify-between px-4 md:px-6 bg-app-card border-b">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobile}
          className="md:hidden p-2 rounded hover:bg-app-subtle text-ink-secondary"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="font-display text-[20px] leading-none font-semibold text-ink truncate">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <PlanBadge plano={plano} status={planoStatus} />

        <button
          type="button"
          className="relative p-2 rounded hover:bg-app-subtle text-ink-secondary"
          aria-label="Notificações"
        >
          <Bell size={18} />
          {alertasCriticos > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-mono font-medium flex items-center justify-center">
              {alertasCriticos > 99 ? '99+' : alertasCriticos}
            </span>
          )}
        </button>

        <UserNav nome={userNome} email={userEmail} variant="header" />
      </div>
    </header>
  )
}

function resolveTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  const match = NAV_ITEMS.find((i) => i.href !== '/' && pathname.startsWith(i.href))
  return match?.label ?? 'Frota 360'
}

function PlanBadge({ plano, status }: { plano: Plano; status: string }) {
  const label =
    plano === 'demo'         ? 'DEMO' :
    plano === 'basico'       ? 'BÁSICO' :
    /* profissional */         'PRO'

  const cls = cn(
    'px-2 py-1 rounded text-[10px] font-mono font-medium tracking-wider border',
    plano === 'demo'                      && 'bg-brand-surface text-brand-dark border-brand-border',
    plano === 'basico'                    && 'bg-stone-100 text-stone-600 border-stone-200',
    plano === 'profissional'              && 'bg-accent-surface text-accent border-accent-border',
    status === 'inadimplente'             && 'bg-red-50 text-red-700 border-red-200',
    status === 'cancelado'                && 'bg-stone-100 text-stone-500 border-stone-200',
  )
  return <span className={cls}>{label}</span>
}
