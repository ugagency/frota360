'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface CheckResult {
  nome: string
  status: 'ok' | 'erro' | 'ausente' | 'nao_configurado'
  latencia_ms?: number
  detalhe?: string
}

interface EnvVar {
  nome: string
  configurado: boolean
  valor_parcial: string | null
}

interface HealthData {
  timestamp: string
  resumo: { total: number; ok: number; erro: number; ausente: number; nao_configurado: number }
  checks: CheckResult[]
  variaveis_de_ambiente: EnvVar[]
}

export default function HealthPage() {
  const [data, setData] = useState<HealthData | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  async function carregar() {
    setCarregando(true)
    setErro(null)
    try {
      const res = await fetch('/api/health')
      if (!res.ok && res.status !== 207) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
    } catch (e) {
      setErro(String(e))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Auditoria de APIs</h1>
          {data && (
            <p className="text-xs text-ink-muted font-mono mt-0.5">
              Última verificação: {new Date(data.timestamp).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={carregar} disabled={carregando} className="gap-2">
          <RefreshCw size={14} className={carregando ? 'animate-spin' : ''} />
          {carregando ? 'Verificando…' : 'Atualizar'}
        </Button>
      </div>

      {erro && (
        <Card className="p-4 border-red-200 bg-red-50 text-red-700 text-sm">
          Erro ao carregar: {erro}
        </Card>
      )}

      {data && (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'OK', valor: data.resumo.ok, cor: 'text-green-600 bg-green-50 border-green-200' },
              { label: 'Erro', valor: data.resumo.erro, cor: 'text-red-600 bg-red-50 border-red-200' },
              { label: 'Não config.', valor: data.resumo.nao_configurado, cor: 'text-amber-600 bg-amber-50 border-amber-200' },
              { label: 'Total', valor: data.resumo.total, cor: 'text-ink bg-app-card border' },
            ].map(({ label, valor, cor }) => (
              <Card key={label} className={`p-3 text-center border ${cor}`}>
                <div className="text-2xl font-bold font-mono">{valor}</div>
                <div className="text-xs mt-0.5">{label}</div>
              </Card>
            ))}
          </div>

          {/* Checks */}
          <Card className="divide-y">
            {data.checks.map((c) => (
              <div key={c.nome} className="flex items-start gap-3 px-4 py-3">
                <StatusIcon status={c.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-ink">{c.nome}</span>
                    {c.latencia_ms !== undefined && (
                      <span className="text-[10px] font-mono text-ink-muted flex items-center gap-0.5">
                        <Clock size={9} /> {c.latencia_ms}ms
                      </span>
                    )}
                    <StatusBadge status={c.status} />
                  </div>
                  {c.detalhe && <p className="text-xs text-ink-secondary mt-0.5 truncate">{c.detalhe}</p>}
                </div>
              </div>
            ))}
          </Card>

          {/* Env vars */}
          <div>
            <h2 className="text-sm font-semibold text-ink-muted mb-2 font-mono uppercase tracking-wider">
              Variáveis de ambiente
            </h2>
            <Card className="divide-y">
              {data.variaveis_de_ambiente.map((v) => (
                <div key={v.nome} className="flex items-center gap-3 px-4 py-2">
                  {v.configurado
                    ? <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                    : <XCircle size={14} className="text-red-400 shrink-0" />}
                  <span className="font-mono text-xs text-ink flex-1">{v.nome}</span>
                  {v.valor_parcial
                    ? <span className="font-mono text-[10px] text-ink-muted">{v.valor_parcial}</span>
                    : <span className="text-[10px] text-red-400 italic">ausente</span>}
                </div>
              ))}
            </Card>
          </div>
        </>
      )}

      {carregando && !data && (
        <div className="flex items-center justify-center py-16 text-ink-muted gap-2">
          <RefreshCw size={16} className="animate-spin" />
          <span className="text-sm">Verificando dependências…</span>
        </div>
      )}
    </div>
  )
}

function StatusIcon({ status }: { status: CheckResult['status'] }) {
  if (status === 'ok') return <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
  if (status === 'erro') return <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
  return <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
}

function StatusBadge({ status }: { status: CheckResult['status'] }) {
  const map = {
    ok: 'bg-green-100 text-green-700',
    erro: 'bg-red-100 text-red-700',
    ausente: 'bg-gray-100 text-gray-600',
    nao_configurado: 'bg-amber-100 text-amber-700',
  }
  const label = { ok: 'ok', erro: 'erro', ausente: 'ausente', nao_configurado: 'não configurado' }
  return (
    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase ${map[status]}`}>
      {label[status]}
    </span>
  )
}
