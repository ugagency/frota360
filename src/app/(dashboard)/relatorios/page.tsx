import Link from 'next/link'
import { Truck, Route, Users, DollarSign, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'

const RELATORIOS = [
  {
    href: '/relatorios/frota',
    icon: Truck,
    titulo: 'Frota',
    descricao: 'Utilização, dias parados, km rodado por veículo no período. Identifica veículos subutilizados.',
    color: 'bg-brand text-white',
  },
  {
    href: '/relatorios/viagens',
    icon: Route,
    titulo: 'Viagens',
    descricao: 'KPIs operacionais, top rotas e clientes, viagens por período. Base para precificação.',
    color: 'bg-accent text-white',
  },
  {
    href: '/relatorios/motoristas',
    icon: Users,
    titulo: 'Motoristas',
    descricao: 'Performance individual + status de toda a documentação (CNH, MOPP, extras).',
    color: 'bg-blue-600 text-white',
  },
  {
    href: '/relatorios/custos',
    icon: DollarSign,
    titulo: 'Custos',
    descricao: 'DRE simplificado, breakdown por categoria, custo/KM da frota.',
    color: 'bg-red-600 text-white',
  },
] as const

export default function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-ink leading-none">Relatórios</h1>
        <p className="mt-1.5 text-sm text-ink-muted">Análises consolidadas com filtros e exportação CSV.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {RELATORIOS.map((r) => {
          const Icon = r.icon
          return (
            <Link key={r.href} href={r.href} className="block group">
              <Card className="p-6 bg-app-card hover:border-brand transition-colors h-full">
                <div className="flex items-start gap-4">
                  <span className={`shrink-0 inline-flex items-center justify-center h-14 w-14 rounded-md ${r.color}`}>
                    <Icon size={26} strokeWidth={2} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-display text-2xl font-semibold text-ink group-hover:text-brand-dark leading-tight">{r.titulo}</h2>
                    <p className="mt-1.5 text-sm text-ink-secondary leading-snug">{r.descricao}</p>
                    <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand group-hover:text-brand-dark">
                      Abrir relatório <ChevronRight size={12} />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
