import {
  LayoutDashboard, Truck, Users, Route, Wrench, DollarSign,
  BarChart3, Settings, Bot, ClipboardList, Building2, type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  label:    string
  href:     string
  icon:     LucideIcon
  section?: 'OPERAÇÕES' | 'GESTÃO'
  modulo:   string
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',     href: '/',             icon: LayoutDashboard, modulo: 'dashboard' },

  { label: 'Frota',         href: '/frota',        icon: Truck,         section: 'OPERAÇÕES', modulo: 'frota' },
  { label: 'Motoristas',    href: '/motoristas',   icon: Users,         section: 'OPERAÇÕES', modulo: 'motoristas' },
  { label: 'Clientes',      href: '/clientes',     icon: Building2,     section: 'OPERAÇÕES', modulo: 'clientes' },
  { label: 'Viagens',       href: '/viagens',      icon: Route,         section: 'OPERAÇÕES', modulo: 'viagens' },

  { label: 'Manutenção',    href: '/manutencao',   icon: Wrench,        section: 'GESTÃO', modulo: 'manutencao' },
  { label: 'Checklists',    href: '/checklists',   icon: ClipboardList, section: 'GESTÃO', modulo: 'checklists' },
  { label: 'Financeiro',    href: '/financeiro',   icon: DollarSign,    section: 'GESTÃO', modulo: 'financeiro' },
  { label: 'Relatórios',    href: '/relatorios',   icon: BarChart3,     section: 'GESTÃO', modulo: 'relatorios' },
  { label: 'Assistente',    href: '/assistente',   icon: Bot,           section: 'GESTÃO', modulo: 'assistente' },

  { label: 'Configurações', href: '/configuracoes', icon: Settings, modulo: 'configuracoes' },
]

// Itens do bottom-tab (mobile)
export const MOBILE_TABS = NAV_ITEMS.filter((i) =>
  ['/', '/frota', '/viagens', '/manutencao'].includes(i.href),
)
