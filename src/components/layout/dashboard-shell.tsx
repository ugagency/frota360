'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'
import { useSidebar } from '@/lib/stores/sidebar'
import { cn } from '@/lib/utils'

type Props = {
  userNome: string
  userEmail: string
  transportadoraNome: string
  plano: 'starter' | 'pro'
  planoStatus: 'trial' | 'ativo' | 'cancelado' | 'inadimplente'
  alertasCriticos?: number
  children: React.ReactNode
}

export function DashboardShell({
  userNome, userEmail, transportadoraNome, plano, planoStatus, alertasCriticos, children,
}: Props) {
  const { collapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-app">
      <Sidebar
        transportadoraNome={transportadoraNome}
        userNome={userNome}
        userEmail={userEmail}
      />
      <div className={cn('flex flex-col min-h-screen transition-[margin] duration-200', collapsed ? 'md:ml-[64px]' : 'md:ml-[240px]')}>
        <Header
          userNome={userNome}
          userEmail={userEmail}
          plano={plano}
          planoStatus={planoStatus}
          alertasCriticos={alertasCriticos}
        />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">{children}</main>
      </div>
      <MobileNav />
    </div>
  )
}
