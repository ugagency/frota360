'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, Trash2, Calendar as CalendarIcon, AlertOctagon } from 'lucide-react'
import { toast } from 'sonner'

import {
  manutencaoSchema, type ManutencaoFormData,
  TIPO_MANUTENCAO, TIPO_LABELS,
} from '@/lib/validations/manutencao'
import { criarManutencao, atualizarManutencao } from '@/app/actions/manutencoes'
import { formatCurrency, formatKm } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { parseKmInput, formatarKmInput } from '@/lib/format'

export type VeiculoOption = { id: string; placa: string; modelo: string | null; km_atual: number; status: string }

type Props = {
  veiculos: VeiculoOption[]
  manutencao?: Partial<ManutencaoFormData> & { id?: string }
  onSuccess?: (id?: string) => void
  onCancel?: () => void
}

export function ManutencaoForm({ veiculos, manutencao, onSuccess, onCancel }: Props) {
  const isEdit = Boolean(manutencao?.id)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<ManutencaoFormData>({
    resolver: zodResolver(manutencaoSchema),
    defaultValues: {
      veiculo_id: manutencao?.veiculo_id ?? '',
      tipo: manutencao?.tipo ?? 'preventiva',
      descricao: manutencao?.descricao ?? '',
      oficina: manutencao?.oficina ?? '',
      mecanico: manutencao?.mecanico ?? '',
      km_na_manutencao: manutencao?.km_na_manutencao ?? null,
      data_entrada: manutencao?.data_entrada ?? new Date().toISOString().slice(0, 10),
      data_saida: manutencao?.data_saida ?? '',
      km_proxima: manutencao?.km_proxima ?? null,
      data_proxima: manutencao?.data_proxima ?? '',
      itens: manutencao?.itens ?? [],
    },
  })

  const itens = useFieldArray({ control: form.control, name: 'itens' })
  const veiculoId = form.watch('veiculo_id')
  const tipo = form.watch('tipo')
  const itensWatch = form.watch('itens') ?? []
  const total = itensWatch.reduce((acc, it) => acc + Number(it.valor || 0), 0)

  const veiculoSel = veiculos.find((v) => v.id === veiculoId)

  function onVeiculoChange(id: string) {
    form.setValue('veiculo_id', id)
    const v = veiculos.find((x) => x.id === id)
    if (v && !form.getValues('km_na_manutencao')) form.setValue('km_na_manutencao', v.km_atual)
  }

  async function onSubmit(values: ManutencaoFormData) {
    setSubmitting(true)
    const r = isEdit && manutencao?.id
      ? await atualizarManutencao(manutencao.id, values)
      : await criarManutencao(values)
    setSubmitting(false)
    if (!r.ok) { toast.error(r.error); return }
    toast.success(isEdit ? 'Manutenção atualizada.' : 'Manutenção registrada.')
    const id = !isEdit && 'data' in r ? r.data?.id : manutencao?.id
    onSuccess?.(id)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-1 space-y-8 pb-4">
          {/* PRINCIPAL */}
          <Secao titulo="Principal">
            <FormField control={form.control} name="veiculo_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Veículo *</FormLabel>
                <Select onValueChange={onVeiculoChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione o veículo" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {veiculos.map((v) => (
                      <SelectItem key={v.id} value={v.id} className="font-mono">
                        {v.placa} {v.modelo && <span className="text-ink-muted">— {v.modelo}</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
                {veiculoSel && (
                  <p className="text-xs text-ink-muted mt-1">
                    KM atual: <span className="font-mono">{formatKm(veiculoSel.km_atual)}</span>
                    {veiculoSel.status === 'ativo' && (
                      <span className="ml-2 text-yellow-700">— ficará como Em Manutenção até conclusão.</span>
                    )}
                  </p>
                )}
              </FormItem>
            )} />

            <FormField control={form.control} name="tipo" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo *</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-2 pt-1">
                    <RadioCard value="preventiva" current={tipo} label="Preventiva" icon={<CalendarIcon size={16} className="text-brand" />} />
                    <RadioCard value="corretiva"  current={tipo} label="Corretiva"  icon={<AlertOctagon size={16} className="text-red-600" />} />
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="descricao" render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição *</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={2} placeholder="Ex: Revisão dos 50.000 km — óleo, filtros e correias" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="oficina" render={({ field }) => (
                <FormItem>
                  <FormLabel>Oficina</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ''} placeholder="Nome da oficina" /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="mecanico" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mecânico</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ''} placeholder="Responsável" /></FormControl>
                </FormItem>
              )} />
            </div>
          </Secao>

          <Separator />

          {/* KM E DATAS */}
          <Secao titulo="KM e datas">
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="km_na_manutencao" render={({ field }) => (
                <FormItem>
                  <FormLabel>KM na entrada</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric" className="font-mono"
                      value={field.value ? formatarKmInput(field.value) : ''}
                      onChange={(e) => {
                        const n = parseKmInput(e.target.value)
                        field.onChange(n === 0 ? null : n)
                      }}
                    />
                  </FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="data_entrada" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de entrada *</FormLabel>
                  <FormControl><Input type="date" className="font-mono" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="km_proxima" render={({ field }) => (
                <FormItem>
                  <FormLabel>KM próx. revisão</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric" className="font-mono"
                      value={field.value ? formatarKmInput(field.value) : ''}
                      onChange={(e) => {
                        const n = parseKmInput(e.target.value)
                        field.onChange(n === 0 ? null : n)
                      }}
                    />
                  </FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="data_proxima" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data próx. revisão</FormLabel>
                  <FormControl><Input type="date" className="font-mono" value={field.value ?? ''} onChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </div>
          </Secao>

          <Separator />

          {/* ITENS DE SERVIÇO */}
          <Secao titulo="Itens de serviço">
            <div className="space-y-2">
              {itens.fields.map((field, i) => (
                <div key={field.id} className="flex items-end gap-2">
                  <FormField control={form.control} name={`itens.${i}.descricao`} render={({ field: f }) => (
                    <FormItem className="flex-1">
                      {i === 0 && <FormLabel className="text-xs">Descrição</FormLabel>}
                      <FormControl><Input {...f} placeholder="Ex: Óleo motor 15W40 — 40L" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name={`itens.${i}.valor`} render={({ field: f }) => (
                    <FormItem className="w-32">
                      {i === 0 && <FormLabel className="text-xs">Valor (R$)</FormLabel>}
                      <FormControl>
                        <Input
                          type="number" step="0.01" min="0" className="font-mono"
                          value={f.value || ''}
                          onChange={(e) => f.onChange(Number(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button
                    type="button" variant="ghost" size="icon"
                    className="h-9 w-9 text-ink-muted hover:text-destructive"
                    onClick={() => itens.remove(i)} aria-label="Remover"
                  ><Trash2 size={15} /></Button>
                </div>
              ))}

              <Button
                type="button" variant="outline" size="sm"
                disabled={itens.fields.length >= 20}
                onClick={() => itens.append({ descricao: '', valor: 0 })}
                className="w-full"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Adicionar item {itens.fields.length > 0 && `(${itens.fields.length}/20)`}
              </Button>
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <span className="text-sm font-medium text-ink-secondary">Total</span>
              <span className="font-display text-xl font-bold text-brand-dark tabular-nums">{formatCurrency(total)}</span>
            </div>
          </Secao>
        </div>

        {/* RODAPÉ */}
        <div className="sticky bottom-0 bg-app-card border-t pt-3 pb-1 flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>Cancelar</Button>
          <Button type="submit" disabled={submitting} className="bg-brand hover:bg-brand-dark text-white">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Salvar alterações' : 'Registrar manutenção'}
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

function RadioCard({ value, current, label, icon }: { value: string; current: string; label: string; icon: React.ReactNode }) {
  const active = current === value
  return (
    <label className={`flex items-center gap-2 cursor-pointer rounded-md border p-2.5 transition-colors ${active ? 'border-brand bg-brand-surface/40' : 'border-stone-200 hover:bg-app-subtle'}`}>
      <RadioGroupItem value={value} />
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </label>
  )
}
