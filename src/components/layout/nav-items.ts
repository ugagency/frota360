import {
  LayoutDashboard, Truck, Users, Route, Wrench, DollarSign,
  BarChart3, Settings, Bot, type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  section?: 'OPERAÇÕES' | 'GESTÃO'
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',     href: '/',             icon: LayoutDashboard },

  { label: 'Frota',         href: '/frota',        icon: Truck,      section: 'OPERAÇÕES' },
  { label: 'Motoristas',    href: '/motoristas',   icon: Users,      section: 'OPERAÇÕES' },
  { label: 'Viagens',       href: '/viagens',      icon: Route,      section: 'OPERAÇÕES' },

  { label: 'Manutenção',    href: '/manutencao',   icon: Wrench,     section: 'GESTÃO' },
  { label: 'Financeiro',    href: '/financeiro',   icon: DollarSign, section: 'GESTÃO' },
  { label: 'Relatórios',    href: '/relatorios',   icon: BarChart3,  section: 'GESTÃO' },
  { label: 'Assistente',    href: '/assistente',   icon: Bot,        section: 'GESTÃO' },

  { label: 'Configurações', href: '/configuracoes', icon: Settings },
]

// Itens do bottom-tab (mobile)
export const MOBILE_TABS = NAV_ITEMS.filter((i) =>
  ['/', '/frota', '/viagens', '/manutencao'].includes(i.href),
)
