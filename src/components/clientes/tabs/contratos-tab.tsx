'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Plus, FileCheck } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  contratoSchema, STATUS_CONTRATO, STATUS_CONTRATO_LABELS, type ContratoFormData,
} from '@/lib/validations/cliente'
import { criarContrato } from '@/app/actions/clientes'
import { formatDate, formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

type ContratoRow = {
  id: string
  titulo: string
  status: string
  data_inicio: string | null
  data_fim: string | null
  prazo_pagamento: number
  valor_por_km: number | null
  valor_minimo_frete: number | null
  rotas_cobertas: string | null
  observacoes: string | null
}

const STATUS_CLS: Record<typeof STATUS_CONTRATO[number], string> = {
  vigente:       'bg-accent-surface text-accent border-accent-border',
  em_negociacao: 'bg-blue-50 text-blue-700 border-blue-200',
  encerrado:     'bg-stone-100 text-stone-500 border-stone-200',
}

type Props = {
  clienteId: string
  contratos: ContratoRow[]
}

export function ContratosTab({ clienteId, contratos }: Props) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const router = useRouter()

  const form = useForm<ContratoFormData>({
    resolver: zodResolver(contratoSchema),
    defaultValues: {
      titulo:             '',
      status:             'vigente',
      data_inicio:        '',
      data_fim:           '',
      prazo_pagamento:    30,
      valor_por_km:       undefined,
      valor_minimo_frete: undefined,
      rotas_cobertas:     '',
      observacoes:        '',
    },
  })

  async function onSubmit(data: ContratoFormData) {
    setErro(null)
    const result = await criarContrato(clienteId, data)
    if (!result.ok) { setErro(result.error); return }
    form.reset()
    setMostrarForm(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-brand hover:bg-brand-dark text-white"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Novo contrato
        </Button>
      </div>

      {mostrarForm && (
        <Card className="p-5 bg-app-card">
          <div className="text-sm font-semibold text-ink mb-4">Adicionar contrato</div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="titulo" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Título *</FormLabel>
                    <FormControl><Input placeholder="Ex: Contrato 2025 — Rota SP/MG" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_CONTRATO.map((s) => (
                          <SelectItem key={s} value={s}>{STATUS_CONTRATO_LABELS[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="prazo_pagamento" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo pagamento (dias)</FormLabel>
                    <FormControl><Input type="number" min={0} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="data_inicio" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vigência início</FormLabel>
                    <FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="data_fim" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vigência fim</FormLabel>
                    <FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="valor_por_km" render={({ field }) => (
                  <FormItem>
                    <FormLabel>R$/km</FormLabel>
                    <FormControl><Input type="number" min={0} step={0.01} placeholder="0,00" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="valor_minimo_frete" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frete mínimo (R$)</FormLabel>
                    <FormControl><Input type="number" min={0} step={0.01} placeholder="0,00" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="rotas_cobertas" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Rotas cobertas</FormLabel>
                    <FormControl><Input placeholder="Ex: SP, MG, RJ" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="observacoes" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="Observações adicionais…" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{erro}</p>}

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => setMostrarForm(false)}>Cancelar</Button>
                <Button type="submit" size="sm" disabled={form.formState.isSubmitting} className="bg-brand hover:bg-brand-dark text-white">
                  {form.formState.isSubmitting ? 'Salvando…' : 'Salvar'}
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      )}

      {contratos.length === 0 ? (
        <Card className="p-10 text-center bg-app-card">
          <div className="text-sm text-ink-secondary">Nenhum contrato cadastrado.</div>
        </Card>
      ) : (
        <div className="space-y-3">
          {contratos.map((c) => (
            <Card key={c.id} className="p-4 bg-app-card">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-accent-surface text-accent mt-0.5 shrink-0">
                  <FileCheck size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-ink">{c.titulo}</span>
                    <span className={cn(
                      'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium uppercase border',
                      STATUS_CLS[c.status as typeof STATUS_CONTRATO[number]] ?? STATUS_CLS.vigente,
                    )}>
                      {STATUS_CONTRATO_LABELS[c.status as typeof STATUS_CONTRATO[number]] ?? c.status}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-ink-secondary">
                    {c.data_inicio && <span>Início: {formatDate(c.data_inicio)}</span>}
                    {c.data_fim && <span>Fim: {formatDate(c.data_fim)}</span>}
                    {c.prazo_pagamento > 0 && <span>Prazo: {c.prazo_pagamento} dias</span>}
                    {c.valor_por_km && <span>R$/km: {formatCurrency(c.valor_por_km)}</span>}
                    {c.valor_minimo_frete && <span>Mín: {formatCurrency(c.valor_minimo_frete)}</span>}
                    {c.rotas_cobertas && <span>Rotas: {c.rotas_cobertas}</span>}
                  </div>
                  {c.observacoes && (
                    <p className="mt-2 text-xs text-ink-muted leading-relaxed">{c.observacoes}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
