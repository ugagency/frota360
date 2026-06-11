import { z } from 'zod'
import { placaValida, normalizarPlaca } from '@/lib/format'

export const TIPO_VEICULO = ['truck', 'bitruck', 'carreta', 'vanderleia', 'outros'] as const
export const PROPRIETARIO = ['proprio', 'agregado'] as const
export const STATUS_VEICULO = ['ativo', 'em_viagem', 'em_manutencao', 'inativo'] as const
export const CATEGORIA_VEICULO = ['leve', 'medio', 'pesado', 'extra_pesado'] as const

export const MARCAS = [
  'Scania', 'Volvo', 'Mercedes-Benz', 'MAN', 'DAF', 'Iveco', 'Ford', 'Outros',
] as const

const anoAtual = new Date().getFullYear()

// Campos de data opcionais: string vazia → null (evita erro "invalid syntax for type date")
const dateOpt = z.string().optional().nullable().transform((v) => v || null)

// Base object — partial-safe for update schema
const veiculoBase = z.object({
  placa: z
    .string()
    .transform((v) => normalizarPlaca(v))
    .refine(placaValida, 'Placa inválida (ABC1234 ou ABC1D23)'),
  tipo: z.enum(TIPO_VEICULO),
  proprietario: z.enum(PROPRIETARIO).default('proprio'),

  marca: z.string().optional().nullable(),
  modelo: z.string().optional().nullable(),
  ano: z.number().int().min(1990).max(anoAtual + 1).optional().nullable(),
  cor: z.string().optional().nullable(),

  renavam: z.string().optional().nullable(),
  chassi: z.string().optional().nullable(),
  data_licenciamento: dateOpt,

  km_atual: z.number().min(0, 'KM não pode ser negativo'),
  km_proxima_revisao: z.number().min(0).optional().nullable(),
  data_proxima_revisao: dateOpt,

  observacoes: z.string().max(500, 'Máximo 500 caracteres').optional().nullable(),

  // Feature 1: Seguro (Profissional)
  seguro_apolice:    z.string().optional().nullable(),
  seguro_seguradora: z.string().optional().nullable(),
  seguro_validade:   dateOpt,

  // Feature 4: categoria para benchmark (Profissional)
  categoria_veiculo: z.enum(CATEGORIA_VEICULO).default('pesado'),
})

// Full schema with refinement for create/edit form
export const veiculoSchema = veiculoBase.superRefine((data, ctx) => {
  const temSeguro = data.seguro_apolice || data.seguro_seguradora
  if (temSeguro && !data.seguro_validade) {
    ctx.addIssue({ code: 'custom', message: 'Informe a validade do seguro', path: ['seguro_validade'] })
  }
})

export type VeiculoFormData = z.infer<typeof veiculoSchema>

// Partial update — uses base without superRefine (refinements don't apply on partial)
export const veiculoUpdateSchema = veiculoBase.partial()
export type VeiculoUpdateData = z.infer<typeof veiculoUpdateSchema>

// KM update isolado (modal rápido)
export const atualizarKmSchema = z.object({
  km: z.number().int().min(0, 'KM inválido'),
})

// ---------- Labels ----------
export const CATEGORIA_LABELS: Record<typeof CATEGORIA_VEICULO[number], string> = {
  leve:         'Leve (até 3,5t)',
  medio:        'Médio (3,5t – 10t)',
  pesado:       'Pesado (10t – 25t)',
  extra_pesado: 'Extra pesado (acima de 25t)',
}

export const TIPO_LABELS: Record<typeof TIPO_VEICULO[number], string> = {
  truck:      '🚛 Truck',
  bitruck:    '🚚 Bitruck',
  carreta:    '🚛 Carreta',
  vanderleia: '🚌 Vanderleia',
  outros:     '🔧 Outros',
}

export const PROPRIETARIO_LABELS: Record<typeof PROPRIETARIO[number], string> = {
  proprio: 'Próprio',
  agregado: 'Agregado',
}
