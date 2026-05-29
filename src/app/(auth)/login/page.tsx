import Link from 'next/link'
import { Check } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { LoginForm } from './login-form'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Lado esquerdo — visual */}
      <aside className="hidden md:flex flex-col justify-between bg-sidebar-bg text-white p-10 relative">
        <div>
          <Logo variant="horizontal" theme="dark" size="lg" />
        </div>

        <div className="space-y-6 max-w-md">
          <h2 className="font-display text-4xl font-semibold leading-tight">
            Gestão de frotas.<br />
            <span className="text-brand">Do jeito</span> que transportadora precisa.
          </h2>
          <ul className="space-y-3 text-sm text-stone-300">
            <Bullet>Controle de frota, viagens e manutenções</Bullet>
            <Bullet>Alertas automáticos antes do problema</Bullet>
            <Bullet>Financeiro por veículo em tempo real</Bullet>
          </ul>
        </div>

        <div className="text-xs font-mono text-stone-500">
          v0.1.0 — © {new Date().getFullYear()} Frota 360
        </div>
      </aside>

      {/* Lado direito — formulário */}
      <main className="flex items-center justify-center p-6 md:p-10 bg-app">
        <div className="w-full max-w-sm">
          <div className="md:hidden mb-8">
            <Logo variant="horizontal" theme="light" size="md" />
          </div>

          <h1 className="font-display text-[28px] font-bold leading-none text-ink">
            Entrar na sua conta
          </h1>
          <p className="mt-2 text-sm text-ink-secondary">
            Não tem conta?{' '}
            <Link href="/cadastro" className="text-brand hover:text-brand-dark font-medium">
              Criar agora →
            </Link>
          </p>

          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </main>
    </div>
  )
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 inline-flex items-center justify-center h-5 w-5 rounded-full bg-brand/15 text-brand">
        <Check size={13} strokeWidth={3} />
      </span>
      <span>{children}</span>
    </li>
  )
}
