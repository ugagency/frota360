import { z } from 'zod'

export const STATUS_CLIENTE = ['prospect', 'ativo', 'inativo', 'suspenso'] as const
export const SEGMENTOS_CLIENTE = [
  'Agronegócio', 'Construção civil', 'E-commerce', 'Indústria', 'Mineração',
  'Papel e celulose', 'Químico', 'Refrigerado', 'Siderurgia', 'Varejo', 'Outro',
] as const

export const STATUS_LABELS: Record<typeof STATUS_CLIENTE[number], string> = {
  prospect: 'Prospect',
  ativo:    'Ativo',
  inativo:  'Inativo',
  suspenso: 'Suspenso',
}

const dateOpt = z.string().optional().nullable().transform((v) => v || null)

export const clienteSchema = z.object({
  razao_social:     z.string().min(2, 'Mínimo 2 caracteres'),
  cnpj:             z.string().optional().nullable(),
  telefone:         z.string().optional().nullable(),
  email:            z.preprocess((v) => (v === '' ? null : v), z.string().email('E-mail inválido').nullable().optional()),
  cidade:           z.string().optional().nullable(),
  estado:           z.string().optional().nullable(),
  status:           z.enum(STATUS_CLIENTE).default('ativo'),
  segmento:         z.string().optional().nullable(),
  proxima_acao:     dateOpt,
  valor_mensal_est: z.coerce.number().min(0).optional().nullable(),
  prazo_pagamento:  z.coerce.number().int().min(0).default(30),
  notas_internas:   z.string().optional().nullable(),
})

export type ClienteFormData = z.infer<typeof clienteSchema>
export const clienteUpdateSchema = clienteSchema.partial()
export type ClienteUpdateData = z.infer<typeof clienteUpdateSchema>

// ─── Interação ───────────────────────────────────────────────────────────────
export const TIPO_INTERACAO = ['ligacao', 'email', 'visita', 'proposta', 'outro'] as const
export const TIPO_INTERACAO_LABELS: Record<typeof TIPO_INTERACAO[number], string> = {
  ligacao:  'Ligação',
  email:    'E-mail',
  visita:   'Visita',
  proposta: 'Proposta',
  outro:    'Outro',
}

export const interacaoSchema = z.object({
  tipo:            z.enum(TIPO_INTERACAO),
  titulo:          z.string().min(2, 'Mínimo 2 caracteres'),
  descricao:       z.string().optional().nullable(),
  data_interacao:  z.string().min(1, 'Informe a data'),
  proximo_contato: dateOpt,
})

export type InteracaoFormData = z.infer<typeof interacaoSchema>

// ─── Contrato ────────────────────────────────────────────────────────────────
export const STATUS_CONTRATO = ['vigente', 'encerrado', 'em_negociacao'] as const
export const STATUS_CONTRATO_LABELS: Record<typeof STATUS_CONTRATO[number], string> = {
  vigente:        'Vigente',
  encerrado:      'Encerrado',
  em_negociacao:  'Em negociação',
}

export const contratoSchema = z.object({
  titulo:             z.string().min(2, 'Mínimo 2 caracteres'),
  status:             z.enum(STATUS_CONTRATO).default('vigente'),
  data_inicio:        dateOpt,
  data_fim:           dateOpt,
  prazo_pagamento:    z.coerce.number().int().min(0).default(30),
  valor_por_km:       z.coerce.number().min(0).optional().nullable(),
  valor_minimo_frete: z.coerce.number().min(0).optional().nullable(),
  rotas_cobertas:     z.string().optional().nullable(),
  observacoes:        z.string().optional().nullable(),
})

export type ContratoFormData = z.infer<typeof contratoSchema>
