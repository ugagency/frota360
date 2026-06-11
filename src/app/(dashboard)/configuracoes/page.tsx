import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getTransportadoraId } from '@/lib/tenant'
import { TransportadoraForm } from '@/components/configuracoes/transportadora-form'
import { PlanoSwitcher } from '@/components/configuracoes/plano-switcher'
import { AvatarIniciais } from '@/components/motoristas/avatar-iniciais'
import { Building2, Crown, Users } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

type Transp = {
  id: string
  nome: string
  cnpj: string | null
  telefone: string | null
  cidade: string | null
  estado: string | null
  plano: 'demo' | 'basico' | 'profissional'
  plano_status: string
  trial_ends_at: string | null
  created_at: string
}

type Membro = {
  user_id: string
  role: 'admin' | 'gestor' | 'operador'
  email: string
  nome: string
  created_at: string
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador', gestor: 'Gestor', operador: 'Operador',
}

const PLANO_LABEL: Record<string, string> = {
  trial: 'Período de teste', ativo: 'Ativo', cancelado: 'Cancelado', inadimplente: 'Inadimplente',
}

const PLANO_CLS: Record<string, string> = {
  trial:        'bg-brand-surface text-brand-dark border-brand-border',
  ativo:        'bg-accent-surface text-accent border-accent-border',
  cancelado:    'bg-stone-100 text-stone-600 border-stone-200',
  inadimplente: 'bg-red-50 text-red-700 border-red-200',
}

export default async function ConfiguracoesPage() {
  const supabase = createClient()
  const tid = await getTransportadoraId(supabase)

  const [transpRes, membrosRes, currentUserRes] = await Promise.all([
    supabase.from('transportadoras')
      .select('id, nome, cnpj, telefone, cidade, estado, plano, plano_status, trial_ends_at, created_at')
      .eq('id', tid)
      .returns<Transp[]>()
      .single(),
    (supabase as any).rpc('get_membros_transportadora', { p_transportadora_id: tid }) as Promise<{ data: Membro[] | null }>,
    supabase.auth.getUser(),
  ])

  const t = transpRes.data!
  const membros = (membrosRes.data ?? []) as Membro[]
  const currentUserId = currentUserRes.data.user?.id

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-ink leading-none">Configurações</h1>
        <p className="mt-1.5 text-sm text-ink-muted">Dados da transportadora, plano e equipe.</p>
      </header>

      {/* Dados da empresa */}
      <Card className="bg-app-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={16} className="text-ink-muted" />
          <h2 className="font-display text-xl font-semibold text-ink">Dados da empresa</h2>
        </div>
        <TransportadoraForm initial={{
          nome: t.nome,
          cnpj: t.cnpj ?? '',
          telefone: t.telefone ?? '',
          cidade: t.cidade ?? '',
          estado: (t.estado as never) ?? undefined,
        }} />
      </Card>

      {/* Plano */}
      <Card className="bg-app-card p-6">
        <div className="flex items-center justify-between gap-2 mb-5">
          <div className="flex items-center gap-2">
            <Crown size={16} className="text-ink-muted" />
            <h2 className="font-display text-xl font-semibold text-ink">Plano</h2>
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase border ${PLANO_CLS[t.plano_status] ?? ''}`}>
            {t.plano_status}
          </span>
        </div>

        <PlanoSwitcher planoAtual={t.plano} />
      </Card>

      {/* Equipe */}
      <Card className="bg-app-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} className="text-ink-muted" />
          <h2 className="font-display text-xl font-semibold text-ink">Equipe</h2>
          <span className="ml-1 text-xs font-mono text-ink-muted">{membros.length}</span>
        </div>

        {membros.length === 0 ? (
          <p className="text-sm text-ink-muted">Nenhum usuário vinculado.</p>
        ) : (
          <ul className="divide-y">
            {membros.map((m) => (
              <li key={m.user_id} className="flex items-center gap-3 py-3">
                <AvatarIniciais nome={m.nome} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ink font-medium">
                    {m.nome}
                    {m.user_id === currentUserId && <span className="ml-2 text-[10px] font-mono uppercase text-brand">VOCÊ</span>}
                  </div>
                  <div className="text-xs text-ink-muted">{m.email}</div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase bg-stone-100 text-stone-700 border border-stone-200">
                  {ROLE_LABEL[m.role]}
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 text-xs text-ink-muted border-t pt-3">
          Convite de novos usuários e gestão de roles chegam em sprint futura.
          {/* TODO Sprint 11: convite por email + gestão de roles */}
        </p>
      </Card>
    </div>
  )
}

function Info({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">{label}</dt>
      <dd className={`mt-1 text-base text-ink ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  )
}
