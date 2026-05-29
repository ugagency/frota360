import { z } from 'zod'

// ---------- Login ----------
export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Mínimo 6 caracteres'),
  lembrar: z.boolean().optional().default(false),
})
export type LoginInput = z.infer<typeof loginSchema>

// ---------- Cadastro — etapa 1 ----------
const step1Base = z.object({
  nome: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmar_senha: z.string(),
})
export const cadastroStep1Schema = step1Base.refine(
  (d) => d.senha === d.confirmar_senha,
  { message: 'Senhas não conferem', path: ['confirmar_senha'] },
)
export type CadastroStep1Input = z.infer<typeof cadastroStep1Schema>

// ---------- Cadastro — etapa 2 ----------
export const UF = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO',
] as const

export const cadastroStep2Schema = z.object({
  nome_empresa: z.string().min(2, 'Mínimo 2 caracteres'),
  cnpj: z
    .string()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'Formato: 12.345.678/0001-90'),
  telefone: z.string().optional(),
  cidade: z.string().min(2, 'Mínimo 2 caracteres'),
  estado: z.enum(UF, { message: 'Selecione um estado' }),
})
export type CadastroStep2Input = z.infer<typeof cadastroStep2Schema>

// ---------- Cadastro completo (server action) ----------
export const criarContaSchema = step1Base
  .merge(cadastroStep2Schema)
  .refine((d) => d.senha === d.confirmar_senha, {
    message: 'Senhas não conferem',
    path: ['confirmar_senha'],
  })
export type CriarContaInput = z.infer<typeof criarContaSchema>
