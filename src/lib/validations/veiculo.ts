import { z } from 'zod'
import { placaValida, normalizarPlaca } from '@/lib/format'

export const TIPO_VEICULO = ['truck', 'bitruck', 'carreta', 'vanderleia', 'outros'] as const
export const PROPRIETARIO = ['proprio', 'agregado'] as const
export const STATUS_VEICULO = ['ativo', 'em_viagem', 'em_manutencao', 'inativo'] as const

export const MARCAS = [
  'Scania', 'Volvo', 'Mercedes-Benz', 'MAN', 'DAF', 'Iveco', 'Ford', 'Outros',
] as const

const anoAtual = new Date().getFullYear()

export const veiculoSchema = z.object({
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
  data_licenciamento: z.string().optional().nullable(),

  km_atual: z.number().min(0, 'KM não pode ser negativo'),
  km_proxima_revisao: z.number().min(0).optional().nullable(),
  data_proxima_revisao: z.string().optional().nullable(),

  observacoes: z.string().max(500, 'Máximo 500 caracteres').optional().nullable(),
})

export type VeiculoFormData = z.infer<typeof veiculoSchema>

// Atualização parcial — todos os campos opcionais, mas se vierem precisam ser válidos
export const veiculoUpdateSchema = veiculoSchema.partial()
export type VeiculoUpdateData = z.infer<typeof veiculoUpdateSchema>

// KM update isolado (modal rápido)
export const atualizarKmSchema = z.object({
  km: z.number().int().min(0, 'KM inválido'),
})

// ---------- Labels ----------
export const TIPO_LABELS: Record<typeof TIPO_VEICULO[number], string> = {
  truck: 'Truck',
  bitruck: 'Bitruck',
  carreta: 'Carreta',
  vanderleia: 'Vanderleia',
  outros: 'Outros',
}

export const PROPRIETARIO_LABELS: Record<typeof PROPRIETARIO[number], string> = {
  proprio: 'Próprio',
  agregado: 'Agregado',
}
