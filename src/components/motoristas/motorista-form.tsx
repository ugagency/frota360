'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, Trash2, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

import {
  motoristaSchema, type MotoristaFormData,
  CNH_CATEGORIAS, TIPO_MOTORISTA, TIPO_LABELS,
} from '@/lib/validations/motorista'
import { criarMotorista, atualizarMotorista } from '@/app/actions/motoristas'
import { formatarCPF, formatarTelefone } from '@/lib/format'
import { getDaysUntil } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle } from 'lucide-react'
import { OCRUpload } from '@/components/ocr/ocr-upload'

type Motorista = Partial<MotoristaFormData> & { id?: string }

type Props = {
  motorista?: Motorista
  onSuccess?: (id?: string) => void
  onCancel?: () => void
}

export function MotoristaForm({ motorista, onSuccess, onCancel }: Props) {
  const isEdit = Boolean(motorista?.id)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<MotoristaFormData>({
    resolver: zodResolver(motoristaSchema),
    defaultValues: {
      nome: motorista?.nome ?? '',
      cpf: motorista?.cpf ?? '',
      telefone: motorista?.telefone ?? '',
      tipo: motorista?.tipo ?? 'proprio',
      cnh_numero: motorista?.cnh_numero ?? '',
      cnh_categoria: motorista?.cnh_categoria ?? undefined,
      cnh_validade: motorista?.cnh_validade ?? '',
      mopp_validade: motorista?.mopp_validade ?? '',
      nr_validade: motorista?.nr_validade ?? '',
      documentos: motorista?.documentos ?? [],
    },
  })

  const docsArray = useFieldArray({ control: form.control, name: 'documentos' })
  const cnhValidade = form.watch('cnh_validade')

  async function onSubmit(values: MotoristaFormData) {
    setSubmitting(true)
    const r = isEdit && motorista?.id
      ? await atualizarMotorista(motorista.id, values)
      : await criarMotorista(values)
    setSubmitting(false)

    if (!r.ok) { toast.error(r.error); return }
    toast.success(isEdit ? 'Motorista atualizado.' : 'Motorista cadastrado.')
    const id = !isEdit && 'data' in r ? r.data?.id : motorista?.id
    onSuccess?.(id)
  }

  const cnhAlerta = cnhAlertContent(cnhValidade)
  const hasExtraData = isEdit && Boolean(
    motorista?.cnh_numero || motorista?.mopp_validade ||
    motorista?.nr_validade || (motorista?.documentos?.length ?? 0) > 0
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-1 space-y-8 pb-4">
          {!isEdit && (
            <div className="pb-5 border-b">
              <p className="text-sm font-medium mb-1">Preencher automaticamente via CNH</p>
              <p className="text-xs text-ink-muted mb-3">
                Tire uma foto da CNH ou envie o arquivo — os campos serão preenchidos automaticamente.
              </p>
              <OCRUpload
                tipo="cnh"
                onExtraido={(dados) => {
                  if (dados.nome)          form.setValue('nome',          String(dados.nome))
                  if (dados.cpf)           form.setValue('cpf',           String(dados.cpf))
                  if (dados.cnh_numero)    form.setValue('cnh_numero',    String(dados.cnh_numero))
                  if (dados.cnh_categoria) form.setValue('cnh_categoria', String(dados.cnh_categoria) as typeof CNH_CATEGORIAS[number])
                  if (dados.cnh_validade)  form.setValue('cnh_validade',  String(dados.cnh_validade))
                  form.trigger(['nome', 'cpf', 'cnh_categoria', 'cnh_validade'])
                }}
              />
            </div>
          )}

          {/* DADOS PESSOAIS */}
          <Secao titulo="Dados pessoais">
            <FormField control={form.control} name="nome" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome completo *</FormLabel>
                <FormControl><Input {...field} placeholder="João Silva Oliveira" autoComplete="name" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="cpf" render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF *</FormLabel>
                  <FormControl>
                    <Input
                      className="font-mono"
                      placeholder="000.000.000-00"
                      inputMode="numeric"
                      maxLength={14}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(formatarCPF(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="telefone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input
                      className="font-mono"
                      placeholder="(11) 98765-4321"
                      inputMode="tel"
                      maxLength={15}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(formatarTelefone(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="tipo" render={({ field }) => (
              <FormItem>
                <FormLabel>Vínculo *</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-1">
                    {TIPO_MOTORISTA.map((t) => (
                      <label key={t} className="flex items-center gap-1.5 cursor-pointer text-sm">
                        <RadioGroupItem value={t} />
                        {TIPO_LABELS[t]}
                      </label>
                    ))}
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )} />
          </Secao>

          <Separator />

          {/* HABILITAÇÃO */}
          <Secao titulo="Habilitação">
            <FormField control={form.control} name="cnh_categoria" render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                  <FormControl><SelectTrigger><SelectValue placeholder="—" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {CNH_CATEGORIAS.map((c) => <SelectItem key={c} value={c} className="font-mono">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />

            <FormField control={form.control} name="cnh_validade" render={({ field }) => (
              <FormItem>
                <FormLabel>Validade da CNH</FormLabel>
                <FormControl>
                  <Input type="date" value={field.value ?? ''} onChange={field.onChange} className="font-mono" />
                </FormControl>
              </FormItem>
            )} />

            {cnhAlerta && (
              <Alert className={cnhAlerta.cls}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{cnhAlerta.msg}</AlertDescription>
              </Alert>
            )}
          </Secao>

          <details open={hasExtraData} className="mt-1 group">
            <summary className="flex items-center gap-2 text-sm text-ink-muted cursor-pointer hover:text-ink list-none py-1.5">
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              Documentos e certificações (opcional)
            </summary>
            <div className="pt-3 space-y-6">
              <div className="space-y-3">
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">Nº da CNH</h3>
                <FormField control={form.control} name="cnh_numero" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número da CNH</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ''} className="font-mono" placeholder="00000000000" /></FormControl>
                  </FormItem>
                )} />
              </div>

              <div className="space-y-3">
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">Certificações</h3>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="mopp_validade" render={({ field }) => (
                    <FormItem>
                      <FormLabel>MOPP — validade</FormLabel>
                      <FormControl>
                        <Input type="date" value={field.value ?? ''} onChange={field.onChange} className="font-mono" />
                      </FormControl>
                      <p className="text-xs text-ink-muted">Transporte de produtos perigosos. Validade conforme certificado ANTT.</p>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="nr_validade" render={({ field }) => (
                    <FormItem>
                      <FormLabel>NR — validade</FormLabel>
                      <FormControl>
                        <Input type="date" value={field.value ?? ''} onChange={field.onChange} className="font-mono" />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">Documentos extras</h3>
                <div className="space-y-2">
                  {docsArray.fields.map((field, i) => (
                    <div key={field.id} className="flex items-end gap-2">
                      <FormField control={form.control} name={`documentos.${i}.tipo`} render={({ field: f }) => (
                        <FormItem className="flex-1">
                          {i === 0 && <FormLabel className="text-xs">Tipo do documento</FormLabel>}
                          <FormControl><Input {...f} placeholder="Ex: Carteira de trabalho" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`documentos.${i}.validade`} render={({ field: f }) => (
                        <FormItem className="w-40">
                          {i === 0 && <FormLabel className="text-xs">Validade</FormLabel>}
                          <FormControl>
                            <Input type="date" value={f.value ?? ''} onChange={f.onChange} className="font-mono" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-ink-muted hover:text-destructive"
                        onClick={() => docsArray.remove(i)}
                        aria-label="Remover documento"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={docsArray.fields.length >= 10}
                    onClick={() => docsArray.append({ tipo: '', validade: '' })}
                    className="w-full"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Adicionar documento {docsArray.fields.length > 0 && `(${docsArray.fields.length}/10)`}
                  </Button>
                </div>
              </div>
            </div>
          </details>
        </div>

        {/* RODAPÉ */}
        <div className="sticky bottom-0 bg-app-card border-t pt-3 pb-1 flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>Cancelar</Button>
          <Button type="submit" disabled={submitting} className="bg-brand hover:bg-brand-dark text-white">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Salvar alterações' : 'Cadastrar motorista'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">{titulo}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function cnhAlertContent(validade: string | null | undefined) {
  if (!validade) return null
  const dias = getDaysUntil(validade)
  if (dias < 0) {
    return {
      cls: 'border-red-200 bg-red-50 text-red-700',
      msg: `CNH vencida há ${Math.abs(dias)} dias. Motorista não poderá ser associado a viagens.`,
    }
  }
  if (dias <= 30) {
    return {
      cls: 'border-yellow-200 bg-yellow-50 text-yellow-800',
      msg: `CNH vence em ${dias} dias. Um alerta será criado automaticamente.`,
    }
  }
  return null
}
