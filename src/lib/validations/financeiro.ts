import { z } from 'zod'

export const TIPO_LANCAMENTO = ['receita', 'despesa'] as const
export const CATEGORIAS = ['combustivel', 'manutencao', 'pedagio', 'multa', 'frete', 'adiantamento', 'outros'] as const

export const CATEGORIAS_RECEITA = ['frete', 'outros'] as const
export const CATEGORIAS_DESPESA = ['combustivel', 'manutencao', 'pedagio', 'multa', 'adiantamento', 'outros'] as const

export const lancamentoSchema = z.object({
  tipo:      z.enum(TIPO_LANCAMENTO),
  categoria: z.enum(CATEGORIAS),
  descricao: z.string().min(2, 'Descreva o lançamento'),
  valor:     z.number().min(0.01, 'Valor deve ser > 0'),
  data:      z.string().min(1, 'Informe a data'),
  veiculo_id: z.string().uuid().optional().nullable(),
  viagem_id:  z.string().uuid().optional().nullable(),
  comprovante_url: z.string().optional().nullable(),
})
export type LancamentoFormData = z.infer<typeof lancamentoSchema>

export const lancamentoUpdateSchema = lancamentoSchema.partial()
export type LancamentoUpdateData = z.infer<typeof lancamentoUpdateSchema>

export const CATEGORIA_LABEL: Record<typeof CATEGORIAS[number], string> = {
  combustivel:  'Combustível',
  manutencao:   'Manutenção',
  pedagio:      'Pedágio',
  multa:        'Multa',
  frete:        'Frete',
  adiantamento: 'Adiantamento',
  outros:       'Outros',
}
