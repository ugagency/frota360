'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'
import { DemoExpirado } from '@/components/plano/demo-expirado'
import { useSidebar } from '@/lib/stores/sidebar'
import { diasRestantesDemo, type Plano } from '@/lib/plano'
import { cn } from '@/lib/utils'

type Props = {
  userNome:  string
  userEmail: string
  transportadoraNome: string
  plano:          Plano
  planoStatus:    string
  planoValidade:  string | null
  alertasCriticos?: number
  children: React.ReactNode
}

export function DashboardShell({
  userNome, userEmail, transportadoraNome,
  plano, planoStatus, planoValidade,
  alertasCriticos, children,
}: Props) {
  const { collapsed } = useSidebar()

  const diasDemo = plano === 'demo'
    ? diasRestantesDemo({ plano, plano_status: planoStatus, plano_inicio: null, plano_validade: planoValidade })
    : null

  const expirado =
    plano === 'demo' && planoValidade != null && new Date(planoValidade) < new Date()

  return (
    <div className="min-h-screen bg-app">
      <Sidebar
        transportadoraNome={transportadoraNome}
        userNome={userNome}
        userEmail={userEmail}
        plano={plano}
        diasRestantes={diasDemo}
      />
      <div className={cn(
        'flex flex-col min-h-screen transition-[margin] duration-200',
        collapsed ? 'md:ml-[64px]' : 'md:ml-[240px]',
      )}>
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

      {expirado && <DemoExpirado />}
    </div>
  )
}
