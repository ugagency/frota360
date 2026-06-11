'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { clienteSchema, STATUS_CLIENTE, STATUS_LABELS, SEGMENTOS_CLIENTE, type ClienteFormData } from '@/lib/validations/cliente'
import { criarCliente, atualizarCliente } from '@/app/actions/clientes'
import { useState } from 'react'

type Props = {
  cliente?: Partial<ClienteFormData> & { id?: string }
  onCancel: () => void
  onSuccess: (id?: string) => void
}

export function ClienteForm({ cliente, onCancel, onSuccess }: Props) {
  const isEdit = !!cliente?.id
  const [erro, setErro] = useState<string | null>(null)

  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      razao_social:     cliente?.razao_social    ?? '',
      cnpj:             cliente?.cnpj            ?? '',
      telefone:         cliente?.telefone        ?? '',
      email:            cliente?.email           ?? '',
      cidade:           cliente?.cidade          ?? '',
      estado:           cliente?.estado          ?? '',
      status:           (cliente?.status as typeof STATUS_CLIENTE[number]) ?? 'ativo',
      segmento:         cliente?.segmento        ?? '',
      proxima_acao:     cliente?.proxima_acao    ?? '',
      valor_mensal_est: cliente?.valor_mensal_est ?? undefined,
      prazo_pagamento:  cliente?.prazo_pagamento ?? 30,
      notas_internas:   cliente?.notas_internas  ?? '',
    },
  })

  async function onSubmit(data: ClienteFormData) {
    setErro(null)
    const result = isEdit
      ? await atualizarCliente(cliente!.id!, data)
      : await criarCliente(data)

    if (!result.ok) {
      setErro(result.error)
      return
    }
    onSuccess(isEdit ? cliente!.id : (result as { ok: true; data?: { id: string } }).data?.id)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto max-h-[calc(100vh-160px)] pr-1">

        {/* Dados principais */}
        <FormField control={form.control} name="razao_social" render={({ field }) => (
          <FormItem>
            <FormLabel>Razão social *</FormLabel>
            <FormControl><Input placeholder="Nome da empresa" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="cnpj" render={({ field }) => (
            <FormItem>
              <FormLabel>CNPJ</FormLabel>
              <FormControl><Input placeholder="00.000.000/0001-00" {...field} value={field.value ?? ''} /></FormControl>
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
                  {STATUS_CLIENTE.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="telefone" render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl><Input placeholder="(00) 00000-0000" {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl><Input type="email" placeholder="contato@empresa.com" {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="cidade" render={({ field }) => (
            <FormItem>
              <FormLabel>Cidade</FormLabel>
              <FormControl><Input placeholder="São Paulo" {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="estado" render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <FormControl><Input placeholder="SP" maxLength={2} {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* CRM */}
        <div className="pt-2 border-t">
          <p className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-3">CRM</p>
          <div className="space-y-3">
            <FormField control={form.control} name="segmento" render={({ field }) => (
              <FormItem>
                <FormLabel>Segmento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SEGMENTOS_CLIENTE.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="proxima_acao" render={({ field }) => (
                <FormItem>
                  <FormLabel>Próxima ação</FormLabel>
                  <FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl>
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
            </div>

            <FormField control={form.control} name="valor_mensal_est" render={({ field }) => (
              <FormItem>
                <FormLabel>Faturamento mensal estimado (R$)</FormLabel>
                <FormControl><Input type="number" min={0} step={0.01} placeholder="0,00" {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="notas_internas" render={({ field }) => (
              <FormItem>
                <FormLabel>Notas internas</FormLabel>
                <FormControl><Textarea rows={3} placeholder="Observações internas sobre o cliente…" {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{erro}</p>}

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancelar</Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="flex-1 bg-brand hover:bg-brand-dark text-white"
          >
            {form.formState.isSubmitting ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar cliente'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
