import { z } from 'zod'

export const TIPO_MANUTENCAO = ['preventiva', 'corretiva'] as const
export const STATUS_MANUTENCAO = ['agendada', 'em_andamento', 'concluida'] as const

// String vazia → null para campos de data opcionais
const dateOpt = z.string().optional().nullable().transform((v) => v || null)

const itemSchema = z.object({
  descricao: z.string().min(1, 'Descreva o item'),
  valor: z.number().min(0, 'Valor inválido'),
})

export const manutencaoSchema = z.object({
  veiculo_id: z.string().uuid('Selecione um veículo'),
  tipo: z.enum(TIPO_MANUTENCAO),
  descricao: z.string().min(3, 'Mínimo 3 caracteres'),
  oficina: z.string().optional().nullable(),
  mecanico: z.string().optional().nullable(),

  km_na_manutencao: z.number().min(0).optional().nullable(),
  data_entrada: z.string().min(1, 'Informe a data de entrada'),
  data_saida: dateOpt,

  km_proxima: z.number().min(0).optional().nullable(),
  data_proxima: dateOpt,

  itens: z.array(itemSchema).max(20, 'Máximo 20 itens').default([]),
})

export type ManutencaoFormData = z.infer<typeof manutencaoSchema>
export type ItemManutencao = z.infer<typeof itemSchema>

export const manutencaoUpdateSchema = manutencaoSchema.partial()
export type ManutencaoUpdateData = z.infer<typeof manutencaoUpdateSchema>

export const concluirManutencaoSchema = z.object({
  data_saida: z.string().min(1, 'Informe a data de saída'),
  km_proxima: z.number().min(0).optional().nullable(),
  data_proxima: dateOpt,
  valor_total_final: z.number().min(0, 'Valor inválido'),
})
export type ConcluirManutencaoData = z.infer<typeof concluirManutencaoSchema>

export const TIPO_LABELS: Record<typeof TIPO_MANUTENCAO[number], string> = {
  preventiva: 'Preventiva',
  corretiva: 'Corretiva',
}
