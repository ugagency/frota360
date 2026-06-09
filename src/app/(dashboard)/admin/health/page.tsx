import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/card'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type CheckStatus = 'ok' | 'erro' | 'ausente' | 'nao_configurado'

interface CheckResult {
  nome: string
  status: CheckStatus
  latencia_ms?: number
  detalhe?: string
}

interface HealthData {
  timestamp: string
  resumo: { total: number; ok: number; erro: number; ausente: number; nao_configurado: number }
  checks: CheckResult[]
  variaveis_de_ambiente: { nome: string; configurado: boolean; valor_parcial: string | null }[]
}

const CORES: Record<CheckStatus, string> = {
  ok:             'bg-green-50 border-green-200 text-green-800',
  erro:           'bg-red-50  border-red-200  text-red-700',
  ausente:        'bg-amber-50 border-amber-200 text-amber-800',
  nao_configurado:'bg-gray-50  border-gray-200  text-gray-500',
}

const ICONE: Record<CheckStatus, string> = {
  ok:             '✓',
  erro:           '✗',
  ausente:        '—',
  nao_configurado:'?',
}

const RESUMO_COR: Record<string, string> = {
  ok:             'text-green-600',
  erro:           'text-red-600',
  ausente:        'text-amber-600',
  nao_configurado:'text-gray-500',
}

export default async function HealthPage() {
  // Verificar autenticação
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: n => cookieStore.get(n)?.value } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Buscar dados de health
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  let data: HealthData | null = null
  let fetchError: string | null = null

  try {
    const res = await fetch(`${baseUrl}/api/health`, { cache: 'no-store' })
    data = await res.json()
  } catch (e) {
    fetchError = String(e)
  }

  if (!data) {
    return (
      <div className="p-8 space-y-2">
        <h1 className="text-2xl font-display font-bold">Auditoria de APIs</h1>
        <p className="text-destructive text-sm">Erro ao carregar: {fetchError}</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink leading-none">Auditoria de APIs</h1>
          <p className="mt-1 text-sm text-ink-muted font-mono">
            {new Date(data.timestamp).toLocaleString('pt-BR')}
          </p>
        </div>
        <form action="/admin/health" method="get">
          <button
            type="submit"
            className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink border rounded px-2 py-1.5"
          >
            <RefreshCw size={12} /> Verificar novamente
          </button>
        </form>
      </header>

      {/* Resumo */}
      <div className="grid grid-cols-4 gap-3">
        {([
          ['OK', data.resumo.ok, 'ok'],
          ['Erro', data.resumo.erro, 'erro'],
          ['Ausente', data.resumo.ausente, 'ausente'],
          ['Não config.', data.resumo.nao_configurado, 'nao_configurado'],
        ] as const).map(([label, val, cor]) => (
          <Card key={label} className="p-4 text-center bg-app-card">
            <div className={`text-2xl font-bold font-display ${RESUMO_COR[cor]}`}>{val}</div>
            <div className="text-xs text-ink-muted mt-0.5">{label}</div>
          </Card>
        ))}
      </div>

      {/* Dependências */}
      <section className="space-y-2">
        <h2 className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">Dependências</h2>
        {data.checks.map(c => (
          <div
            key={c.nome}
            className={`flex items-start gap-3 p-3 rounded border text-sm ${CORES[c.status]}`}
          >
            <span className="font-bold w-4 text-center shrink-0">{ICONE[c.status]}</span>
            <div className="flex-1 min-w-0">
              <span className="font-medium">{c.nome}</span>
              {c.detalhe && (
                <span className="ml-2 opacity-70 text-xs">{c.detalhe}</span>
              )}
            </div>
            {c.latencia_ms !== undefined && (
              <span className="text-xs opacity-50 shrink-0 font-mono">{c.latencia_ms}ms</span>
            )}
          </div>
        ))}
      </section>

      {/* Variáveis de ambiente */}
      <section className="space-y-2">
        <h2 className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">Variáveis de ambiente</h2>
        <Card className="bg-app-card overflow-hidden divide-y">
          {data.variaveis_de_ambiente.map(v => (
            <div key={v.nome} className="flex items-center gap-3 px-4 py-2 text-sm">
              <span className={v.configurado ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>
                {v.configurado ? '✓' : '✗'}
              </span>
              <span className="font-mono text-xs flex-1 text-ink">{v.nome}</span>
              <span className="font-mono text-xs text-ink-muted">
                {v.valor_parcial ?? 'não configurado'}
              </span>
            </div>
          ))}
        </Card>
      </section>

      {/* Legenda */}
      <section className="text-xs text-ink-muted space-y-1 pt-2 border-t">
        <div className="grid grid-cols-2 gap-1">
          <span><strong>✓ ok</strong> — funcionando</span>
          <span><strong>✗ erro</strong> — existe mas com problema</span>
          <span><strong>— ausente</strong> — sprint não executada</span>
          <span><strong>? não config.</strong> — falta variável de ambiente</span>
        </div>
      </section>
    </div>
  )
}
