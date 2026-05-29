import { z } from 'zod'
import { UF } from '@/lib/validations/auth'

export const transportadoraUpdateSchema = z.object({
  nome: z.string().min(2, 'Mínimo 2 caracteres'),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'Formato: 12.345.678/0001-90').or(z.literal('')).optional(),
  telefone: z.string().optional().nullable(),
  cidade: z.string().min(2, 'Mínimo 2 caracteres').optional().nullable(),
  estado: z.enum(UF).optional().nullable(),
})
export type TransportadoraUpdateData = z.infer<typeof transportadoraUpdateSchema>
