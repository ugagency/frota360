import { z } from 'zod'

export const STATUS_VIAGEM = ['planejada', 'em_andamento', 'concluida', 'cancelada'] as const

export const TIPOS_CARGA = [
  'Carga geral', 'Granel sólido', 'Granel líquido', 'Frigorificado',
  'Perigosa', 'Viva', 'Veículos', 'Outro',
] as const

export const destinoItemSchema = z.object({
  ordem: z.number().int().min(1),
  cidade: z.string().min(1),
  cidade_label: z.string().optional().default(''),
  observacao: z.string().optional().nullable().default(''),
})

export type DestinoItem = z.infer<typeof destinoItemSchema>

export const viagemCreateSchema = z.object({
  veiculo_id:   z.string().uuid('Selecione um veículo'),
  motorista_id: z.string().uuid('Selecione um motorista'),

  origem:  z.string().min(3, 'Mínimo 3 caracteres'),
  destino: z.string().min(1, 'Informe o destino'),

  destinos: z.array(destinoItemSchema).optional().default([]),
  distancia_km: z.number().int().min(0).optional().nullable(),
  data_saida:   z.string().min(1, 'Informe a data de saída'),
  data_chegada: z.string().min(1, 'Informe a previsão de chegada'),

  cliente:    z.string().optional().nullable(),
  tipo_carga: z.string().optional().nullable(),
  peso_ton:   z.number().min(0).optional().nullable(),
  cte_numero: z.string().optional().nullable(),

  // Campos fiscais — Profissional (Feature 5)
  cte_chave:   z.string().regex(/^\d{44}$/, 'Chave deve ter 44 dígitos').optional().nullable().or(z.literal('')),
  cte_status:  z.enum(['pendente', 'emitido', 'cancelado']).default('pendente'),
  mdfe_numero: z.string().optional().nullable(),
  mdfe_chave:  z.string().regex(/^\d{44}$/, 'Chave deve ter 44 dígitos').optional().nullable().or(z.literal('')),
  mdfe_status: z.enum(['pendente', 'emitido', 'encerrado', 'cancelado']).default('pendente'),
  ciot_codigo: z.string().optional().nullable(),

  valor_frete:        z.number().min(0, 'Frete inválido'),
  valor_adiantamento: z.number().min(0).default(0),

  km_saida: z.number().min(0, 'KM inválido'),

  observacoes: z.string().optional().nullable(),
}).refine(
  (d) => d.valor_adiantamento <= d.valor_frete * 0.8,
  { message: 'Adiantamento não pode ultrapassar 80% do frete', path: ['valor_adiantamento'] },
)

export type ViagemCreateData = z.infer<typeof viagemCreateSchema>

// ---------- Encerramento ----------
export const encerrarViagemSchemaBase = z.object({
  km_chegada: z.number().min(0, 'KM inválido'),
  data_chegada_real: z.string().min(1, 'Informe a data/hora de chegada'),
  observacoes: z.string().optional().nullable(),
})

export function encerrarViagemSchema(kmSaida: number) {
  return encerrarViagemSchemaBase.refine(
    (d) => d.km_chegada > kmSaida,
    { message: `KM de chegada deve ser maior que ${kmSaida.toLocaleString('pt-BR')}`, path: ['km_chegada'] },
  )
}

export type EncerrarViagemData = z.infer<typeof encerrarViagemSchemaBase>

// ---------- Cancelamento ----------
export const cancelarViagemSchema = z.object({
  motivo: z.string().min(5, 'Informe o motivo (mínimo 5 caracteres)'),
})
export type CancelarViagemData = z.infer<typeof cancelarViagemSchema>
