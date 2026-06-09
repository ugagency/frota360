import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET /api/health — testa cada dependência em tempo real, sem expor dados sensíveis

interface CheckResult {
  nome: string
  status: 'ok' | 'erro' | 'ausente' | 'nao_configurado'
  latencia_ms?: number
  detalhe?: string
}

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: CheckResult[] = []

  // ─── 1. Supabase DB ────────────────────────────────────────────
  {
    const t = Date.now()
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      checks.push({ nome: 'Supabase (banco)', status: 'nao_configurado', detalhe: 'NEXT_PUBLIC_SUPABASE_URL ou ANON_KEY ausente' })
    } else {
      try {
        const sb = createClient(url, key)
        const { error } = await sb.from('transportadoras').select('id').limit(1)
        checks.push({
          nome: 'Supabase (banco)',
          status: error ? 'erro' : 'ok',
          latencia_ms: Date.now() - t,
          detalhe: error?.message,
        })
      } catch (e) {
        checks.push({ nome: 'Supabase (banco)', status: 'erro', latencia_ms: Date.now() - t, detalhe: String(e) })
      }
    }
  }

  // ─── 2. Supabase Auth ──────────────────────────────────────────
  {
    const t = Date.now()
    try {
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const { error } = await sb.auth.getSession()
      checks.push({
        nome: 'Supabase Auth',
        status: error ? 'erro' : 'ok',
        latencia_ms: Date.now() - t,
        detalhe: error?.message,
      })
    } catch (e) {
      checks.push({ nome: 'Supabase Auth', status: 'erro', detalhe: String(e) })
    }
  }

  // ─── 3. Supabase Storage ───────────────────────────────────────
  {
    const t = Date.now()
    try {
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const { data, error } = await sb.storage.listBuckets()
      if (error) {
        checks.push({ nome: 'Supabase Storage', status: 'erro', latencia_ms: Date.now() - t, detalhe: error.message })
      } else {
        const buckets = data?.map(b => b.name) ?? []
        checks.push({
          nome: 'Supabase Storage',
          status: 'ok',
          latencia_ms: Date.now() - t,
          detalhe: buckets.length ? `Buckets: ${buckets.join(', ')}` : 'Nenhum bucket criado',
        })
      }
    } catch (e) {
      checks.push({ nome: 'Supabase Storage', status: 'erro', detalhe: String(e) })
    }
  }

  // ─── 4. Gemini API ────────────────────────────────────────────
  {
    const t = Date.now()
    if (!process.env.GEMINI_API_KEY) {
      checks.push({ nome: 'Gemini API', status: 'nao_configurado', detalhe: 'GEMINI_API_KEY ausente no .env' })
    } else {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`,
          { signal: AbortSignal.timeout(6000) },
        )
        checks.push({
          nome: 'Gemini API',
          status: res.ok ? 'ok' : 'erro',
          latencia_ms: Date.now() - t,
          detalhe: res.ok ? 'Chave válida' : `HTTP ${res.status}`,
        })
      } catch (e) {
        checks.push({ nome: 'Gemini API', status: 'erro', latencia_ms: Date.now() - t, detalhe: String(e) })
      }
    }
  }

  // ─── 5. Resend ────────────────────────────────────────────────
  {
    const t = Date.now()
    if (!process.env.RESEND_API_KEY) {
      checks.push({ nome: 'Resend (email)', status: 'nao_configurado', detalhe: 'RESEND_API_KEY não configurado — sprint de notificações' })
    } else {
      try {
        const res = await fetch('https://api.resend.com/domains', {
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
          signal: AbortSignal.timeout(6000),
        })
        const data = await res.json()
        checks.push({
          nome: 'Resend (email)',
          status: res.ok ? 'ok' : 'erro',
          latencia_ms: Date.now() - t,
          detalhe: res.ok ? `${data.data?.length ?? 0} domínio(s)` : data.message,
        })
      } catch (e) {
        checks.push({ nome: 'Resend (email)', status: 'erro', latencia_ms: Date.now() - t, detalhe: String(e) })
      }
    }
  }

  // ─── 6. IBGE Municípios ───────────────────────────────────────
  {
    const t = Date.now()
    try {
      const res = await fetch(
        'https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome',
        { signal: AbortSignal.timeout(10000) },
      )
      const data = await res.json()
      checks.push({
        nome: 'IBGE API (municípios)',
        status: res.ok && Array.isArray(data) ? 'ok' : 'erro',
        latencia_ms: Date.now() - t,
        detalhe: Array.isArray(data) ? `${data.length} municípios` : 'Resposta inesperada',
      })
    } catch (e) {
      checks.push({ nome: 'IBGE API (municípios)', status: 'erro', detalhe: String(e) })
    }
  }

  // ─── 7. Nominatim (distância) ────────────────────────────────
  {
    const t = Date.now()
    try {
      const res = await fetch(
        'https://nominatim.openstreetmap.org/search?city=Belo+Horizonte&state=MG&country=Brazil&format=json&limit=1',
        {
          headers: { 'User-Agent': 'Frota360/1.0 (sistema de gestao de frotas)' },
          signal: AbortSignal.timeout(8000),
        },
      )
      const data = await res.json()
      checks.push({
        nome: 'Nominatim OSM (distância)',
        status: res.ok && data?.[0]?.lat ? 'ok' : 'erro',
        latencia_ms: Date.now() - t,
        detalhe: data?.[0]?.lat
          ? `BH: ${parseFloat(data[0].lat).toFixed(4)}, ${parseFloat(data[0].lon).toFixed(4)}`
          : 'Sem resultado',
      })
    } catch (e) {
      checks.push({ nome: 'Nominatim OSM (distância)', status: 'erro', detalhe: String(e) })
    }
  }

  // ─── 8. BrasilAPI (CNPJ) ─────────────────────────────────────
  {
    const t = Date.now()
    try {
      const res = await fetch(
        'https://brasilapi.com.br/api/cnpj/v1/00394460000141',
        { signal: AbortSignal.timeout(8000) },
      )
      checks.push({
        nome: 'BrasilAPI (CNPJ)',
        status: res.ok ? 'ok' : 'erro',
        latencia_ms: Date.now() - t,
        detalhe: res.ok ? 'CNPJ lookup funcionando' : `HTTP ${res.status}`,
      })
    } catch (e) {
      checks.push({ nome: 'BrasilAPI (CNPJ)', status: 'erro', detalhe: String(e) })
    }
  }

  // ─── 9. Rotas internas ────────────────────────────────────────
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  // /api/cidades
  {
    const t = Date.now()
    try {
      const res = await fetch(`${baseUrl}/api/cidades?q=belo`, { signal: AbortSignal.timeout(8000) })
      if (res.status === 404) {
        checks.push({ nome: '/api/cidades', status: 'ausente', detalhe: 'Sprint 14 — rota não criada' })
      } else {
        const data = await res.json()
        checks.push({
          nome: '/api/cidades',
          status: res.ok && Array.isArray(data) ? 'ok' : 'erro',
          latencia_ms: Date.now() - t,
          detalhe: Array.isArray(data) ? `${data.length} sugestões para "belo"` : 'Resposta inesperada',
        })
      }
    } catch {
      checks.push({ nome: '/api/cidades', status: 'ausente', detalhe: 'Erro ao acessar rota' })
    }
  }

  // /api/assistente
  {
    const t = Date.now()
    try {
      const res = await fetch(`${baseUrl}/api/assistente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: 'ping' }),
        signal: AbortSignal.timeout(5000),
      })
      checks.push({
        nome: '/api/assistente',
        status: res.status === 404 ? 'ausente' : 'ok',
        latencia_ms: Date.now() - t,
        detalhe: res.status === 401 ? 'Existe (401 sem auth — correto)' :
                 res.status === 404 ? 'Sprint 11 — rota não criada' :
                 `HTTP ${res.status}`,
      })
    } catch {
      checks.push({ nome: '/api/assistente', status: 'ausente', detalhe: 'Erro ao acessar rota' })
    }
  }

  // /api/billing/notificar
  {
    const t = Date.now()
    try {
      const res = await fetch(`${baseUrl}/api/billing/notificar`, { signal: AbortSignal.timeout(5000) })
      checks.push({
        nome: '/api/billing/notificar',
        status: res.status === 404 ? 'ausente' : 'ok',
        latencia_ms: Date.now() - t,
        detalhe: res.status === 401 ? 'Existe (401 sem CRON_SECRET — correto)' :
                 res.status === 404 ? 'Sprint 10b — rota não criada' :
                 `HTTP ${res.status}`,
      })
    } catch {
      checks.push({ nome: '/api/billing/notificar', status: 'ausente', detalhe: 'Sprint 10b — rota não criada' })
    }
  }

  // ─── 10. Variáveis de ambiente ────────────────────────────────
  const ENVS = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GEMINI_API_KEY',
    'RESEND_API_KEY',
    'RESEND_FROM_EMAIL',
    'CRON_SECRET',
    'NEXT_PUBLIC_SITE_URL',
  ]
  const variaveis_de_ambiente = ENVS.map(v => ({
    nome: v,
    configurado: !!process.env[v],
    valor_parcial: process.env[v] ? `${String(process.env[v]).slice(0, 8)}…` : null,
  }))

  // ─── Resumo ───────────────────────────────────────────────────
  const ok       = checks.filter(c => c.status === 'ok').length
  const erro     = checks.filter(c => c.status === 'erro').length
  const ausente  = checks.filter(c => c.status === 'ausente').length
  const naoConf  = checks.filter(c => c.status === 'nao_configurado').length

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    resumo: { total: checks.length, ok, erro, ausente, nao_configurado: naoConf },
    checks,
    variaveis_de_ambiente,
  }, { status: erro > 0 ? 207 : 200 })
}
