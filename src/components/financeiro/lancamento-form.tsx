'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  lancamentoSchema, type LancamentoFormData,
  CATEGORIAS_RECEITA, CATEGORIAS_DESPESA, CATEGORIA_LABEL,
} from '@/lib/validations/financeiro'
import { criarLancamento, atualizarLancamento } from '@/app/actions/financeiro'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type SelectOption = { id: string; label: string }

type Props = {
  veiculos: SelectOption[]
  viagens: Array<SelectOption & { veiculo_id: string }>
  lancamento?: Partial<LancamentoFormData> & { id?: string }
  onSuccess?: () => void
  onCancel?: () => void
}

export function LancamentoForm({ veiculos, viagens, lancamento, onSuccess, onCancel }: Props) {
  const isEdit = Boolean(lancamento?.id)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<LancamentoFormData>({
    resolver: zodResolver(lancamentoSchema),
    defaultValues: {
      tipo: lancamento?.tipo ?? 'despesa',
      categoria: lancamento?.categoria ?? 'outros',
      descricao: lancamento?.descricao ?? '',
      valor: lancamento?.valor ?? 0,
      data: lancamento?.data ?? new Date().toISOString().slice(0, 10),
      veiculo_id: lancamento?.veiculo_id ?? null,
      viagem_id: lancamento?.viagem_id ?? null,
      comprovante_url: lancamento?.comprovante_url ?? null,
    },
  })

  const tipo = form.watch('tipo')
  const veiculoId = form.watch('veiculo_id')
  const categoriasDisponiveis = tipo === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA

  const viagensFiltradas = useMemo(
    () => viagens.filter((v) => !veiculoId || v.veiculo_id === veiculoId),
    [viagens, veiculoId],
  )

  async function onSubmit(values: LancamentoFormData) {
    setSubmitting(true)
    const r = isEdit && lancamento?.id
      ? await atualizarLancamento(lancamento.id, values)
      : await criarLancamento(values)
    setSubmitting(false)
    if (!r.ok) { toast.error(r.error); return }
    toast.success(isEdit ? 'Lançamento atualizado.' : 'Lançamento criado.')
    onSuccess?.()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-1 space-y-6 pb-4">
          <FormField control={form.control} name="tipo" render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo *</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(v) => {
                    field.onChange(v)
                    // Reset categoria se não for válida pro novo tipo
                    const valid = v === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA
                    if (!valid.includes(form.getValues('categoria') as never)) {
                      form.setValue('categoria', v === 'receita' ? 'frete' : 'outros')
                    }
                  }}
                  value={field.value}
                  className="grid grid-cols-2 gap-2 pt-1"
                >
                  <RadioCard value="receita" current={field.value} label="Receita" color="accent" />
                  <RadioCard value="despesa" current={field.value} label="Despesa" color="danger" />
                </RadioGroup>
              </FormControl>
            </FormItem>
          )} />

          <div className="grid grid-cols-2 gap-3">
            <FormField control={form.control} name="categoria" render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {categoriasDisponiveis.map((c) => <SelectItem key={c} value={c}>{CATEGORIA_LABEL[c]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="data" render={({ field }) => (
              <FormItem>
                <FormLabel>Data *</FormLabel>
                <FormControl><Input type="date" className="font-mono" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="descricao" render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição *</FormLabel>
              <FormControl><Input {...field} placeholder="Ex: Abastecimento posto BR — V-2026-0002" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="valor" render={({ field }) => (
            <FormItem>
              <FormLabel>Valor (R$) *</FormLabel>
              <FormControl>
                <Input
                  type="number" step="0.01" min="0.01" className="font-mono text-base"
                  value={field.value || ''}
                  onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <FormField control={form.control} name="veiculo_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Veículo</FormLabel>
                <Select onValueChange={(v) => field.onChange(v || null)} value={field.value ?? ''}>
                  <FormControl><SelectTrigger><SelectValue placeholder="—" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {veiculos.map((v) => <SelectItem key={v.id} value={v.id} className="font-mono">{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />

            <FormField control={form.control} name="viagem_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Viagem</FormLabel>
                <Select onValueChange={(v) => field.onChange(v || null)} value={field.value ?? ''} disabled={!veiculoId}>
                  <FormControl><SelectTrigger><SelectValue placeholder={veiculoId ? '—' : 'Selecione um veículo'} /></SelectTrigger></FormControl>
                  <SelectContent>
                    {viagensFiltradas.map((v) => <SelectItem key={v.id} value={v.id} className="font-mono">{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
          </div>

          {/* Comprovante: Sprint futura (Storage) */}
          {/* TODO Sprint 10: upload de comprovante via Supabase Storage */}
        </div>

        <div className="sticky bottom-0 bg-app-card border-t pt-3 pb-1 flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>Cancelar</Button>
          <Button type="submit" disabled={submitting} className="bg-brand hover:bg-brand-dark text-white">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Salvar' : 'Criar lançamento'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

function RadioCard({ value, current, label, color }: { value: string; current: string; label: string; color: 'accent' | 'danger' }) {
  const active = current === value
  const activeCls = color === 'accent'
    ? 'border-accent bg-accent-surface/40 text-accent'
    : 'border-red-300 bg-red-50 text-red-700'
  return (
    <label className={`flex items-center gap-2 cursor-pointer rounded-md border p-2.5 transition-colors ${active ? activeCls : 'border-stone-200 hover:bg-app-subtle'}`}>
      <RadioGroupItem value={value} />
      <span className="text-sm font-medium">{label}</span>
    </label>
  )
}
