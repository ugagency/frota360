import { z } from 'zod'
import { cpfValido } from '@/lib/format'

export const CNH_CATEGORIAS = ['C', 'D', 'E'] as const
export const TIPO_MOTORISTA = ['proprio', 'agregado'] as const
export const STATUS_MOTORISTA = ['ativo', 'afastado', 'inativo'] as const

// String vazia → null para campos de data opcionais
const dateOpt = z.string().optional().nullable().transform((v) => v || null)

const documentoSchema = z.object({
  tipo: z.string().min(1, 'Informe o tipo do documento'),
  validade: z.string().min(1, 'Informe a validade'),
})

export const motoristaSchema = z.object({
  nome: z.string().min(2, 'Mínimo 2 caracteres'),
  cpf: z.string().refine(cpfValido, 'CPF inválido'),
  telefone: z.string().optional().nullable(),
  tipo: z.enum(TIPO_MOTORISTA).default('proprio'),

  cnh_numero: z.string().optional().nullable(),
  cnh_categoria: z.enum(CNH_CATEGORIAS).optional().nullable(),
  cnh_validade: dateOpt,

  mopp_validade: dateOpt,
  nr_validade:   dateOpt,

  documentos: z.array(documentoSchema).max(10, 'Máximo 10 documentos').default([]),
})

export type MotoristaFormData = z.infer<typeof motoristaSchema>
export type DocumentoExtra = z.infer<typeof documentoSchema>

export const motoristaUpdateSchema = motoristaSchema.partial()
export type MotoristaUpdateData = z.infer<typeof motoristaUpdateSchema>

export const TIPO_LABELS: Record<typeof TIPO_MOTORISTA[number], string> = {
  proprio:  'Funcionário da empresa',
  agregado: 'Autônomo / Terceirizado',
}
