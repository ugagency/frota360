'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { transportadoraUpdateSchema, type TransportadoraUpdateData } from '@/lib/validations/transportadora'
import { atualizarTransportadora } from '@/app/actions/configuracoes'
import { UF } from '@/lib/validations/auth'
import { formatarCNPJ, formatarTelefone } from '@/lib/format'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Props = {
  initial: TransportadoraUpdateData
}

export function TransportadoraForm({ initial }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<TransportadoraUpdateData>({
    resolver: zodResolver(transportadoraUpdateSchema),
    defaultValues: initial,
  })

  async function onSubmit(values: TransportadoraUpdateData) {
    setSubmitting(true)
    const r = await atualizarTransportadora(values)
    setSubmitting(false)
    if (!r.ok) { toast.error(r.error); return }
    toast.success('Dados atualizados.')
    router.refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="nome" render={({ field }) => (
          <FormItem>
            <FormLabel>Razão social / Nome fantasia *</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField control={form.control} name="cnpj" render={({ field }) => (
            <FormItem>
              <FormLabel>CNPJ</FormLabel>
              <FormControl>
                <Input
                  className="font-mono"
                  placeholder="12.345.678/0001-90"
                  inputMode="numeric"
                  maxLength={18}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(formatarCNPJ(e.target.value))}
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

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <FormField control={form.control} name="cidade" render={({ field }) => (
              <FormItem>
                <FormLabel>Cidade</FormLabel>
                <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <FormField control={form.control} name="estado" render={({ field }) => (
            <FormItem>
              <FormLabel>UF</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                <FormControl><SelectTrigger className="font-mono"><SelectValue placeholder="—" /></SelectTrigger></FormControl>
                <SelectContent className="max-h-72">
                  {UF.map((uf) => <SelectItem key={uf} value={uf} className="font-mono">{uf}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="flex justify-end pt-2 border-t">
          <Button type="submit" disabled={submitting} className="bg-brand hover:bg-brand-dark text-white">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar alterações
          </Button>
        </div>
      </form>
    </Form>
  )
}
