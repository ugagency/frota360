import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Frota 360 — Gestão de frotas',
  description: 'Plataforma de gestão para transportadoras: frota, motoristas, viagens, manutenção e financeiro.',
  icons: {
    icon: '/logo/svg/frota360-simbolo-ambar.svg',
    apple: '/logo/png/frota360-simbolo-ambar.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="font-body bg-app text-ink antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
