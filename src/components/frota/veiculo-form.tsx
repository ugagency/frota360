'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

import {
  veiculoSchema, type VeiculoFormData,
  TIPO_VEICULO, TIPO_LABELS, PROPRIETARIO, PROPRIETARIO_LABELS,
  CATEGORIA_VEICULO, CATEGORIA_LABELS,
} from '@/lib/validations/veiculo'
import { criarVeiculo, atualizarVeiculo } from '@/app/actions/veiculos'
import { formatarPlaca, normalizarPlaca, parseKmInput, formatarKmInput } from '@/lib/format'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { OCRUpload } from '@/components/ocr/ocr-upload'

type Veiculo = Partial<VeiculoFormData> & { id?: string }

type Props = {
  veiculo?: Veiculo
  onSuccess?: (id?: string) => void
  onCancel?: () => void
  plano?: 'demo' | 'basico' | 'profissional'
}

const anoAtual = new Date().getFullYear()

export function VeiculoForm({ veiculo, onSuccess, onCancel, plano = 'demo' }: Props) {
  const isEdit = Boolean(veiculo?.id)
  const [submitting, setSubmitting] = useState(false)
  const isPro = plano === 'profissional'

  const form = useForm<VeiculoFormData>({
    resolver: zodResolver(veiculoSchema),
    defaultValues: {
      placa: veiculo?.placa ?? '',
      tipo: veiculo?.tipo ?? 'truck',
      proprietario: veiculo?.proprietario ?? 'proprio',
      marca: veiculo?.marca ?? '',
      modelo: veiculo?.modelo ?? '',
      ano: veiculo?.ano ?? undefined,
      cor: veiculo?.cor ?? '',
      renavam: veiculo?.renavam ?? '',
      chassi: veiculo?.chassi ?? '',
      data_licenciamento: veiculo?.data_licenciamento ?? '',
      km_atual: veiculo?.km_atual ?? 0,
      km_proxima_revisao: veiculo?.km_proxima_revisao ?? undefined,
      data_proxima_revisao: veiculo?.data_proxima_revisao ?? '',
      observacoes: veiculo?.observacoes ?? '',
      categoria_veiculo: (veiculo as any)?.categoria_veiculo ?? 'pesado',
      seguro_apolice: (veiculo as any)?.seguro_apolice ?? '',
      seguro_seguradora: (veiculo as any)?.seguro_seguradora ?? '',
      seguro_validade: (veiculo as any)?.seguro_validade ?? '',
    },
  })

  async function onSubmit(values: VeiculoFormData) {
    setSubmitting(true)
    const result = isEdit && veiculo?.id
      ? await atualizarVeiculo(veiculo.id, values)
      : await criarVeiculo(values)

    setSubmitting(false)
    if (!result.ok) { toast.error(result.error); return }

    toast.success(isEdit ? 'Veículo atualizado.' : 'Veículo cadastrado.')
    const id = !isEdit && 'data' in result ? result.data?.id : veiculo?.id
    onSuccess?.(id)
  }

  const observacoes = form.watch('observacoes') ?? ''
  const kmAtual = form.watch('km_atual')
  const hasDocData = isEdit && Boolean(
    veiculo?.renavam || veiculo?.chassi || veiculo?.cor || veiculo?.data_licenciamento
  )

  useEffect(() => {
    if (!kmAtual || kmAtual <= 0) return
    if (!form.getValues('km_proxima_revisao')) {
      form.setValue('km_proxima_revisao', kmAtual + 50000)
    }
  }, [kmAtual, form])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-1 space-y-8 pb-4">
          {!isEdit && (
            <div className="pb-5 border-b">
              <p className="text-sm font-medium mb-1">Preencher automaticamente via CRLV</p>
              <p className="text-xs text-ink-muted mb-3">
                Tire uma foto do CRLV ou envie o arquivo — os campos serão preenchidos automaticamente.
              </p>
              <OCRUpload
                tipo="crlv"
                onExtraido={(dados) => {
                  if (dados.placa)          form.setValue('placa',   String(dados.placa))
                  if (dados.marca)          form.setValue('marca',   String(dados.marca))
                  if (dados.modelo)         form.setValue('modelo',  String(dados.modelo))
                  if (dados.ano_fabricacao) form.setValue('ano',     Number(dados.ano_fabricacao))
                  if (dados.cor)            form.setValue('cor',     String(dados.cor))
                  if (dados.renavam)        form.setValue('renavam', String(dados.renavam))
                  if (dados.chassi)         form.setValue('chassi',  String(dados.chassi))
                  if (dados.tipo) {
                    const t = String(dados.tipo).toLowerCase()
                    const mapa: Record<string, string> = {
                      bitruck: 'bitruck', vanderleia: 'vanderleia',
                      carreta: 'carreta', 'semi-reboque': 'carreta', reboque: 'carreta',
                      'caminhão': 'truck', caminhao: 'truck', cavalo: 'truck',
                    }
                    const mapped = Object.entries(mapa).find(([k]) => t.includes(k))?.[1] ?? 'outros'
                    form.setValue('tipo', mapped as typeof TIPO_VEICULO[number])
                  }
                  form.trigger(['placa', 'marca', 'modelo', 'ano'])
                }}
              />
            </div>
          )}

          {/* IDENTIFICAÇÃO */}
          <Secao titulo="Identificação">
            <FormField control={form.control} name="placa" render={({ field }) => (
              <FormItem>
                <FormLabel>Placa *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={formatarPlaca(field.value ?? '')}
                    onChange={(e) => field.onChange(normalizarPlaca(e.target.value))}
                    placeholder="ABC-1D23"
                    className="font-mono uppercase text-base"
                    maxLength={8}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="tipo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {TIPO_VEICULO.map((t) => <SelectItem key={t} value={t}>{TIPO_LABELS[t]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="proprietario" render={({ field }) => (
                <FormItem>
                  <FormLabel>Proprietário *</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2">
                      {PROPRIETARIO.map((p) => (
                        <label key={p} className="flex items-center gap-1.5 cursor-pointer text-sm">
                          <RadioGroupItem value={p} />
                          {PROPRIETARIO_LABELS[p]}
                        </label>
                      ))}
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )} />
            </div>
          </Secao>

          <Separator />

          {/* DADOS */}
          <Secao titulo="Dados">
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="marca" render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} placeholder="Scania, Volvo, VW…" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="modelo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ''} placeholder="Ex: FH 540" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="ano" render={({ field }) => (
              <FormItem>
                <FormLabel>Ano</FormLabel>
                <FormControl>
                  <Input
                    type="number" min={1990} max={anoAtual + 1}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="2024"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </Secao>

          <details open={hasDocData} className="mt-1 group">
            <summary className="flex items-center gap-2 text-sm text-ink-muted cursor-pointer hover:text-ink list-none py-1.5">
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              Dados completos do documento (opcional)
            </summary>
            <div className="pt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="renavam" render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      RENAVAM
                      <span className="text-ink-muted font-normal ml-1 text-xs">(impresso no CRLV)</span>
                    </FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ''} className="font-mono" placeholder="00000000000" /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="chassi" render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nº do Chassi
                      <span className="text-ink-muted font-normal ml-1 text-xs">(no CRLV — 17 car.)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={(field.value ?? '').toUpperCase()}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        className="font-mono uppercase"
                        placeholder="9BWHE21JX24..."
                      />
                    </FormControl>
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="cor" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ''} placeholder="Branco" /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="data_licenciamento" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de licenciamento</FormLabel>
                    <FormControl>
                      <Input type="date" value={field.value ?? ''} onChange={field.onChange} className="font-mono" />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
            </div>
          </details>

          <Separator />

          {/* MANUTENÇÃO */}
          <Secao titulo="Manutenção">
            <FormField control={form.control} name="km_atual" render={({ field }) => (
              <FormItem>
                <FormLabel>KM atual *</FormLabel>
                <FormControl>
                  <Input
                    inputMode="numeric"
                    className="font-mono"
                    value={field.value ? formatarKmInput(field.value) : ''}
                    onChange={(e) => field.onChange(parseKmInput(e.target.value))}
                    placeholder="0"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="km_proxima_revisao" render={({ field }) => (
                <FormItem>
                  <FormLabel>KM próxima revisão</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      className="font-mono"
                      value={field.value ? formatarKmInput(field.value) : ''}
                      onChange={(e) => {
                        const n = parseKmInput(e.target.value)
                        field.onChange(n === 0 ? null : n)
                      }}
                    />
                  </FormControl>
                  <p className="text-xs text-ink-muted mt-1">
                    {kmAtual && kmAtual > 0
                      ? `Sugestão: ${(kmAtual + 50000).toLocaleString('pt-BR')} km (KM atual + 50.000)`
                      : 'Preencha o KM atual primeiro para calcular automaticamente.'}
                  </p>
                </FormItem>
              )} />
              <FormField control={form.control} name="data_proxima_revisao" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data próxima revisão</FormLabel>
                  <FormControl>
                    <Input type="date" value={field.value ?? ''} onChange={field.onChange} className="font-mono" />
                  </FormControl>
                </FormItem>
              )} />
            </div>
          </Secao>

          <Separator />

          {/* CATEGORIA — para benchmark de custo/km (Pro) */}
          <Secao titulo="Categoria do veículo">
            <FormField control={form.control} name="categoria_veiculo" render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria (peso)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {CATEGORIA_VEICULO.map((c) => (
                      <SelectItem key={c} value={c}>{CATEGORIA_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </Secao>

          <Separator />

          {/* SEGURO — exclusivo plano Profissional */}
          <Secao titulo={isPro ? 'Seguro obrigatório' : 'Seguro obrigatório (Profissional)'}>
            {!isPro && (
              <p className="text-xs text-ink-muted bg-app-subtle rounded px-3 py-2">
                Alertas de vencimento de seguro disponíveis no plano Profissional.
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="seguro_apolice" render={({ field }) => (
                <FormItem>
                  <FormLabel>Apólice</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} placeholder="Nº da apólice" disabled={!isPro} />
                  </FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="seguro_seguradora" render={({ field }) => (
                <FormItem>
                  <FormLabel>Seguradora</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} placeholder="Ex: Porto Seguro" disabled={!isPro} />
                  </FormControl>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="seguro_validade" render={({ field }) => (
              <FormItem>
                <FormLabel>Validade do seguro</FormLabel>
                <FormControl>
                  <Input type="date" value={field.value ?? ''} onChange={field.onChange} className="font-mono" disabled={!isPro} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </Secao>

          <Separator />

          {/* OBSERVAÇÕES */}
          <Secao titulo="Observações">
            <FormField control={form.control} name="observacoes" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea {...field} value={field.value ?? ''} maxLength={500} rows={3} placeholder="Notas internas, históricos relevantes…" />
                </FormControl>
                <div className="text-right text-[11px] font-mono text-ink-muted">{observacoes.length}/500</div>
                <FormMessage />
              </FormItem>
            )} />
          </Secao>
        </div>

        {/* RODAPÉ FIXO */}
        <div className="sticky bottom-0 bg-app-card border-t pt-3 pb-1 flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>Cancelar</Button>
          <Button type="submit" disabled={submitting} className="bg-brand hover:bg-brand-dark text-white">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Salvar alterações' : 'Cadastrar veículo'}
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
