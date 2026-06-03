'use client'

import { Clock, MessageCircle } from 'lucide-react'

const WA_BASICO = 'https://wa.me/5531975142675?text=Ol%C3%A1!%20Quero%20assinar%20o%20plano%20B%C3%A1sico%20do%20Frota%20360%20por%20R%24197%2C90%2Fm%C3%AAs.'
const WA_PRO    = 'https://wa.me/5531975142675?text=Ol%C3%A1!%20Quero%20assinar%20o%20plano%20Profissional%20do%20Frota%20360%20por%20R%24447%2Fm%C3%AAs.'

export function DemoExpirado() {
  return (
    <div className="fixed inset-0 z-[100] bg-[#211F1B]/90 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-app-card rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-brand-surface rounded-xl flex items-center justify-center mx-auto mb-5">
          <Clock className="h-7 w-7 text-brand" />
        </div>

        <h2 className="font-display font-bold text-2xl text-ink mb-2">Sua demo expirou.</h2>
        <p className="text-ink-secondary text-sm mb-2">
          Seus dados estão salvos. Escolha um plano para continuar usando o frota360.
        </p>
        <p className="text-ink-muted text-xs mb-8">
          Seus dados ficam disponíveis por 30 dias após o encerramento.
        </p>

        <div className="flex flex-col gap-3">
          <a
            href={WA_PRO}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-brand text-white
                       font-semibold py-3.5 px-4 rounded-lg hover:bg-brand-dark transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Assinar Profissional — R$447/mês
          </a>

          <a
            href={WA_BASICO}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-app border border-border
                       text-ink font-medium py-3.5 px-4 rounded-lg hover:bg-app-subtle transition-colors text-sm"
          >
            Assinar Básico — R$197,90/mês
          </a>
        </div>
      </div>
    </div>
  )
}
