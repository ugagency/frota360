'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronsLeft, ChevronsRight, Lock } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { UserNav } from '@/components/layout/user-nav'
import { useSidebar } from '@/lib/stores/sidebar'
import { NAV_ITEMS, type NavItem } from '@/components/layout/nav-items'
import { moduloDisponivel, type Plano } from '@/lib/plano'
import { cn } from '@/lib/utils'

type Props = {
  transportadoraNome: string
  userNome:  string
  userEmail: string
  plano:     Plano
  diasRestantes: number | null
}

export function Sidebar({ transportadoraNome, userNome, userEmail, plano, diasRestantes }: Props) {
  const { collapsed, toggle } = useSidebar()
  const pathname = usePathname()

  const dashboard = NAV_ITEMS.filter((i) => !i.section && i.href === '/')
  const operacoes  = NAV_ITEMS.filter((i) => i.section === 'OPERAÇÕES')
  const gestao     = NAV_ITEMS.filter((i) => i.section === 'GESTÃO')
  const config     = NAV_ITEMS.filter((i) => !i.section && i.href !== '/')

  return (
    <aside
      className={cn(
        'hidden md:flex fixed inset-y-0 left-0 z-30 flex-col bg-sidebar-bg border-r border-sidebar-border',
        'transition-[width] duration-200 ease-out',
        collapsed ? 'w-[64px]' : 'w-[240px]',
      )}
    >
      {/* Header */}
      <div className={cn('flex items-center px-3 py-4 border-b border-sidebar-border', collapsed ? 'justify-center' : 'justify-between')}>
        <Logo variant={collapsed ? 'symbol' : 'horizontal'} theme="dark" size="md" />
        {!collapsed && (
          <button
            type="button"
            onClick={toggle}
            className="text-sidebar-text hover:text-white p-1 rounded hover:bg-sidebar-hover"
            aria-label="Recolher menu"
          >
            <ChevronsLeft size={18} />
          </button>
        )}
      </div>

      {/* Transportadora + badge de plano */}
      {!collapsed && (
        <div className="px-4 py-2 space-y-1">
          <p className="text-[11px] font-mono uppercase text-sidebar-text/70 truncate" title={transportadoraNome}>
            {transportadoraNome}
          </p>
          <PlanoBadge plano={plano} diasRestantes={diasRestantes} />
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
        <NavGroup items={dashboard} pathname={pathname} collapsed={collapsed} plano={plano} />
        <NavGroup items={operacoes} pathname={pathname} collapsed={collapsed} label="OPERAÇÕES" plano={plano} />
        <NavGroup items={gestao}    pathname={pathname} collapsed={collapsed} label="GESTÃO"    plano={plano} />
        <NavGroup items={config}    pathname={pathname} collapsed={collapsed} plano={plano} />
      </nav>

      {/* Dev-only: health check */}
      {process.env.NODE_ENV === 'development' && !collapsed && (
        <div className="px-3 pb-2">
          <Link
            href="/admin/health"
            className="flex items-center gap-2 px-2 py-1.5 rounded text-[11px] font-mono text-sidebar-text/50 hover:text-sidebar-text hover:bg-sidebar-hover"
          >
            <span>⚙</span> Health Check
          </Link>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2">
        {collapsed ? (
          <button
            type="button"
            onClick={toggle}
            className="w-full flex items-center justify-center text-sidebar-text hover:text-white p-2 rounded hover:bg-sidebar-hover"
            aria-label="Expandir menu"
          >
            <ChevronsRight size={18} />
          </button>
        ) : (
          <UserNav nome={userNome} email={userEmail} variant="sidebar" />
        )}
      </div>
    </aside>
  )
}

// ------------------------------------------------------------------
function PlanoBadge({ plano, diasRestantes }: { plano: Plano; diasRestantes: number | null }) {
  if (plano === 'demo') {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase
                       bg-amber-900/40 text-amber-300 px-2 py-0.5 rounded tracking-wider">
        Demo{diasRestantes !== null ? ` · ${diasRestantes}d` : ''}
      </span>
    )
  }
  if (plano === 'basico') {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase
                       bg-stone-700/40 text-stone-400 px-2 py-0.5 rounded tracking-wider">
        Básico
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase
                     bg-green-900/40 text-green-400 px-2 py-0.5 rounded tracking-wider">
      Profissional
    </span>
  )
}

// ------------------------------------------------------------------
function NavGroup({
  items, pathname, collapsed, label, plano,
}: { items: NavItem[]; pathname: string; collapsed: boolean; label?: string; plano: Plano }) {
  if (items.length === 0) return null
  return (
    <div className="space-y-1">
      {label && !collapsed && (
        <div className="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-sidebar-text/60">
          {label}
        </div>
      )}
      {items.map((it) => {
        const active   = it.href === '/' ? pathname === '/' : pathname.startsWith(it.href)
        const bloqueado = !moduloDisponivel(plano, it.modulo)
        const Icon = it.icon
        return (
          <Link
            key={it.href}
            href={it.href}
            title={collapsed ? it.label : undefined}
            className={cn(
              'group relative flex items-center gap-3 rounded px-2 py-2 text-sm transition-colors',
              active
                ? 'bg-sidebar-active text-sidebar-active-text font-medium'
                : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white',
              collapsed && 'justify-center',
              bloqueado && 'opacity-40',
            )}
          >
            {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-brand-dark" />}
            <Icon size={18} strokeWidth={2} className="shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1">{it.label}</span>
                {bloqueado && <Lock size={11} className="text-brand opacity-70 shrink-0" />}
              </>
            )}
          </Link>
        )
      })}
    </div>
  )
}
