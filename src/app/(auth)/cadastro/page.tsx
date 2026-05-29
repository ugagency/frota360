import Link from 'next/link'
import { Logo } from '@/components/brand/logo'
import { CadastroWizard } from './cadastro-form'

export const dynamic = 'force-dynamic'

export default function CadastroPage() {
  return (
    <div className="min-h-screen bg-app">
      <header className="px-6 py-4 border-b bg-app-card">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Logo variant="horizontal" theme="light" size="md" />
          <Link href="/login" className="text-sm text-ink-secondary hover:text-ink">
            Já tem conta? <span className="text-brand font-medium">Entrar</span>
          </Link>
        </div>
      </header>

      <main className="px-6 py-10">
        <div className="max-w-[520px] mx-auto">
          <CadastroWizard />
        </div>
      </main>
    </div>
  )
}
