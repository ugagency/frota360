import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getTransportadoraId } from '@/lib/tenant'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizarPlaca(v: string): string {
  return v.toUpperCase().replace(/\s/g, '').replace(/^([A-Z]{3})([A-Z0-9]{4})$/, '$1-$2')
}

function normalizarCPF(v: string): string {
  const d = v.replace(/\D/g, '')
  return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
}

function normalizarData(v: string): string {
  // Aceita DD/MM/YYYY → YYYY-MM-DD; já no formato correto → passa direto
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  return v
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

const veiculoSchema = z.object({
  placa:    z.string().min(7, 'Placa obrigatória').max(8),
  tipo:     z.string().default('carreta'),
  marca:    z.string().optional().default(''),
  modelo:   z.string().optional().default(''),
  ano:      z.coerce.number().int().min(1980).max(2035).optional().nullable(),
  km_atual: z.coerce.number().min(0).default(0),
  renavam:  z.string().optional().nullable(),
  chassi:   z.string().optional().nullable(),
})

const motoristaSchema = z.object({
  nome:          z.string().min(2, 'Nome obrigatório'),
  cpf:           z.string().min(11, 'CPF obrigatório'),
  telefone:      z.string().optional().nullable(),
  cnh_categoria: z.string().optional().nullable(),
  cnh_validade:  z.string().optional().nullable(),
  tipo:          z.string().default('proprio'),
})

const clienteSchema = z.object({
  razao_social: z.string().min(2, 'Razão social obrigatória'),
  cnpj:         z.string().optional().nullable(),
  telefone:     z.string().optional().nullable(),
  email:        z.string().optional().nullable(),
  cidade:       z.string().optional().nullable(),
  estado:       z.string().optional().nullable(),
})

const SCHEMAS = { veiculos: veiculoSchema, motoristas: motoristaSchema, clientes: clienteSchema }

type Entidade = keyof typeof SCHEMAS

// ─── Route ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = createClient()

  let tid: string
  try {
    tid = await getTransportadoraId(supabase)
  } catch {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { entidade, linhas } = (await req.json()) as {
    entidade: Entidade
    linhas: Record<string, string>[]
  }

  const schema = SCHEMAS[entidade]
  if (!schema) {
    return NextResponse.json({ error: 'Entidade inválida' }, { status: 400 })
  }

  let okCount = 0
  const erros: Array<{ linha: number; erro: string }> = []

  for (let i = 0; i < linhas.length; i++) {
    const raw = linhas[i]
    const parsed = schema.safeParse(raw)

    if (!parsed.success) {
      erros.push({ linha: i + 2, erro: parsed.error.issues[0]?.message ?? 'Dados inválidos' })
      continue
    }

    const dados = parsed.data as Record<string, unknown>

    // Normalizar campos específicos por entidade
    if (entidade === 'veiculos' && typeof dados.placa === 'string') {
      dados.placa = normalizarPlaca(dados.placa)
    }
    if (entidade === 'motoristas') {
      if (typeof dados.cpf === 'string') dados.cpf = normalizarCPF(dados.cpf)
      if (typeof dados.cnh_validade === 'string' && dados.cnh_validade) {
        dados.cnh_validade = normalizarData(dados.cnh_validade)
      }
    }

    const { error } = await (supabase as any)
      .from(entidade)
      .insert({ ...dados, transportadora_id: tid })

    if (error) {
      const ehDup = error.message.includes('duplicate') || error.message.includes('unique') ||
                    error.code === '23505'
      const campo = entidade === 'veiculos' ? 'a placa' : entidade === 'motoristas' ? 'o CPF' : 'o CNPJ'
      erros.push({
        linha: i + 2,
        erro: ehDup ? `Já existe um registro com ${campo} informado` : 'Erro ao salvar linha',
      })
    } else {
      okCount++
    }
  }

  // Auditoria (fire-and-forget — não bloqueia a resposta)
  ;(supabase as any).from('importacoes').insert({
    transportadora_id: tid,
    entidade,
    total_linhas: linhas.length,
    importados:   okCount,
    erros:        erros.length,
  }).then(() => {})

  return NextResponse.json({ ok: okCount, erros })
}
