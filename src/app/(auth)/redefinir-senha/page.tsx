import { Logo } from '@/components/brand/logo'
import { RedefinirSenhaForm } from './redefinir-senha-form'

export const dynamic = 'force-dynamic'

export default function RedefinirSenhaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-app">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Logo variant="horizontal" theme="light" size="md" />
        </div>

        <h1 className="font-display text-[28px] font-bold leading-none text-ink">
          Nova senha
        </h1>
        <p className="mt-2 text-sm text-ink-secondary">
          Escolha uma senha forte. Você ficará logado depois de salvar.
        </p>

        <div className="mt-8">
          <RedefinirSenhaForm />
        </div>
      </div>
    </div>
  )
}
