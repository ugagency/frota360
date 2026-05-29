import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'frota360 — Gestão de Frotas para Transportadoras',
  description:
    'Controle veículos, motoristas, viagens e manutenções em uma plataforma. IA integrada. 14 dias grátis, sem cartão.',
  openGraph: {
    title: 'frota360 — Gestão de Frotas para Transportadoras',
    description: 'Controle veículos, motoristas, viagens e manutenções em uma plataforma. IA integrada.',
    type: 'website',
    locale: 'pt_BR',
  },
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
