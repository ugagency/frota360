import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { EsqueciSenhaForm } from './esqueci-senha-form'

export const dynamic = 'force-dynamic'

export default function EsqueciSenhaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-app">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-between">
          <Logo variant="horizontal" theme="light" size="md" />
          <Link href="/login" className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink">
            <ChevronLeft size={14} /> Voltar
          </Link>
        </div>

        <h1 className="font-display text-[28px] font-bold leading-none text-ink">
          Esqueceu a senha?
        </h1>
        <p className="mt-2 text-sm text-ink-secondary">
          Digite seu e-mail e vamos te enviar um link pra criar uma nova senha.
        </p>

        <div className="mt-8">
          <EsqueciSenhaForm />
        </div>
      </div>
    </div>
  )
}
