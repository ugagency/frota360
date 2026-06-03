import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Check, Star } from 'lucide-react'
import type { Plano } from '@/lib/plano'

export const dynamic = 'force-dynamic'

const WA_BASICO = 'https://wa.me/5531975142675?text=Ol%C3%A1!%20Quero%20assinar%20o%20plano%20B%C3%A1sico%20do%20Frota%20360%20por%20R%24197%2C90%2Fm%C3%AAs.'
const WA_PRO    = 'https://wa.me/5531975142675?text=Ol%C3%A1!%20Quero%20assinar%20o%20plano%20Profissional%20do%20Frota%20360%20por%20R%24447%2Fm%C3%AAs.'

const COMPARATIVO = [
  { feature: 'Módulo Frota',          demo: true,  basico: true,  pro: true  },
  { feature: 'Módulo Motoristas',     demo: true,  basico: true,  pro: true  },
  { feature: 'Módulo Viagens',        demo: true,  basico: true,  pro: true  },
  { feature: 'Módulo Manutenção',     demo: false, basico: true,  pro: true  },
  { feature: 'Módulo Financeiro',     demo: false, basico: false, pro: true  },
  { feature: 'Módulo Relatórios',     demo: false, basico: false, pro: true  },
  { feature: 'Assistente IA',         demo: false, basico: false, pro: true  },
  { feature: 'Checklists com foto',   demo: false, basico: false, pro: true  },
  { feature: 'Custo/km benchmark',    demo: false, basico: false, pro: true  },
  { feature: 'Relatório contador',    demo: false, basico: false, pro: true  },
  { feature: 'CT-e / MDF-e / CIOT',  demo: false, basico: false, pro: true  },
  { feature: 'Importação planilha',   demo: false, basico: false, pro: true  },
  { feature: 'Alertas automáticos',   demo: true,  basico: true,  pro: true  },
  { feature: 'Alertas de seguro',     demo: false, basico: false, pro: true  },
  { feature: 'Suporte',               demo: '—',   basico: 'E-mail', pro: 'WhatsApp prioritário' },
]

export default async function UpgradePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vinculo } = await supabase
    .from('usuarios_transportadoras').select('transportadora_id').eq('user_id', user.id)
    .returns<{ transportadora_id: string }[]>().maybeSingle()

  const { data: transp } = await supabase
    .from('transportadoras').select('plano')
    .eq('id', vinculo?.transportadora_id ?? '').returns<{ plano: Plano }[]>().maybeSingle()

  const planoAtual = transp?.plano ?? 'demo'

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <header className="text-center space-y-2">
        <h1 className="font-display text-4xl font-bold text-ink">Escolha seu plano</h1>
        <p className="text-ink-secondary">Sem fidelidade. Cancele quando quiser.</p>
      </header>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Demo */}
        <PlanoCard
          nome="Demo"
          preco="Grátis"
          subtitulo="7 dias"
          atual={planoAtual === 'demo'}
          features={['5 veículos', '1 usuário', 'Frota + Motoristas + Viagens']}
        />

        {/* Básico */}
        <PlanoCard
          nome="Básico"
          preco="R$197,90"
          subtitulo="/mês"
          atual={planoAtual === 'basico'}
          ctaHref={WA_BASICO}
          ctaLabel="Assinar Básico"
          features={['Até 20 veículos', '2 usuários', 'Frota + Motoristas + Viagens', 'Manutenção inclusa', 'Suporte por e-mail']}
        />

        {/* Profissional */}
        <PlanoCard
          nome="Profissional"
          preco="R$447,00"
          subtitulo="/mês"
          destaque
          atual={planoAtual === 'profissional'}
          ctaHref={WA_PRO}
          ctaLabel="Assinar Profissional"
          features={[
            'Veículos ilimitados',
            'Usuários ilimitados',
            'Todos os módulos',
            'Assistente IA',
            'Checklists com foto',
            'Relatório para contador',
            'CT-e / MDF-e / CIOT',
            'Importação de planilhas',
            'Suporte WhatsApp prioritário',
          ]}
        />
      </div>

      {/* Tabela comparativa */}
      <div className="bg-app-card border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-display font-semibold text-ink">Comparativo completo</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-app-subtle">
                <th className="px-6 py-3 text-left text-ink-muted font-mono text-[11px] uppercase tracking-wider">Feature</th>
                <th className="px-4 py-3 text-center text-ink-muted font-mono text-[11px] uppercase tracking-wider">Demo</th>
                <th className="px-4 py-3 text-center text-ink-muted font-mono text-[11px] uppercase tracking-wider">Básico</th>
                <th className="px-4 py-3 text-center font-mono text-[11px] uppercase tracking-wider text-brand">Pro</th>
              </tr>
            </thead>
            <tbody>
              {COMPARATIVO.map((row) => (
                <tr key={row.feature} className="border-b border-border/50 hover:bg-app-subtle/40">
                  <td className="px-6 py-3 text-ink">{row.feature}</td>
                  <td className="px-4 py-3 text-center"><CellValue val={row.demo} /></td>
                  <td className="px-4 py-3 text-center"><CellValue val={row.basico} /></td>
                  <td className="px-4 py-3 text-center"><CellValue val={row.pro} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function PlanoCard({
  nome, preco, subtitulo, atual, ctaHref, ctaLabel, features, destaque,
}: {
  nome: string; preco: string; subtitulo: string
  atual?: boolean; ctaHref?: string; ctaLabel?: string
  features: string[]; destaque?: boolean
}) {
  return (
    <div className={`rounded-xl border p-6 flex flex-col gap-5 relative ${destaque ? 'border-brand shadow-md' : 'border-border'}`}>
      {destaque && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white text-[11px] font-semibold px-3 py-0.5 rounded-full flex items-center gap-1">
          <Star size={11} />
          Recomendado
        </div>
      )}
      {atual && (
        <div className="absolute top-3 right-3 bg-accent/10 text-accent text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">
          Plano atual
        </div>
      )}

      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-ink-muted mb-1">{nome}</p>
        <div className="flex items-end gap-1">
          <span className="font-display text-3xl font-bold text-ink">{preco}</span>
          <span className="text-ink-muted text-sm mb-0.5">{subtitulo}</span>
        </div>
      </div>

      <ul className="flex flex-col gap-2 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-ink">
            <Check size={14} className="text-accent flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      {ctaHref && (
        <a
          href={ctaHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center py-3 rounded-lg font-semibold text-sm transition-colors ${
            destaque
              ? 'bg-brand text-white hover:bg-brand-dark'
              : 'border border-border hover:bg-app-subtle text-ink'
          }`}
        >
          {ctaLabel}
        </a>
      )}
    </div>
  )
}

function CellValue({ val }: { val: boolean | string }) {
  if (typeof val === 'string') return <span className="text-ink-secondary text-xs">{val}</span>
  if (val) return <Check size={15} className="text-accent mx-auto" />
  return <span className="text-ink-muted text-lg leading-none">—</span>
}
