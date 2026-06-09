import { z } from 'zod'

const itemChecklistSchema = z.object({
  nome:       z.string(),
  resultado:  z.enum(['ok', 'nao_conforme', 'nao_verificado']),
  observacao: z.string().optional().nullable().transform((v) => v || null),
})

// UUID opcional — string vazia ou null → null
const uuidOpt = z.preprocess(
  (v) => (v === '' || v == null ? null : v),
  z.string().uuid().nullable().optional(),
)

export const checklistSchema = z.object({
  veiculo_id:       z.string().uuid('Selecione um veículo'),
  motorista_id:     uuidOpt,
  tipo:             z.enum(['saida', 'chegada']),
  data_realizacao:  z.string().min(1, 'Informe a data'),
  itens:            z.array(itemChecklistSchema).min(1, 'Adicione ao menos um item'),
  observacao_geral: z.string().optional().nullable().transform((v) => v || null),
})

export type ChecklistFormData = z.infer<typeof checklistSchema>
