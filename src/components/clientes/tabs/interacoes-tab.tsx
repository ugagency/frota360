'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Plus, Phone, Mail, MapPin, FileText, MessageSquare } from 'lucide-react'
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
  interacaoSchema, TIPO_INTERACAO, TIPO_INTERACAO_LABELS, type InteracaoFormData,
} from '@/lib/validations/cliente'
import { criarInteracao } from '@/app/actions/clientes'
import { formatDate } from '@/lib/utils'

const TIPO_ICON: Record<typeof TIPO_INTERACAO[number], React.ReactNode> = {
  ligacao:  <Phone size={14} />,
  email:    <Mail size={14} />,
  visita:   <MapPin size={14} />,
  proposta: <FileText size={14} />,
  outro:    <MessageSquare size={14} />,
}

type InteracaoRow = {
  id: string
  tipo: string
  titulo: string
  descricao: string | null
  data_interacao: string
  proximo_contato: string | null
}

type Props = {
  clienteId: string
  interacoes: InteracaoRow[]
}

export function InteracoesTab({ clienteId, interacoes }: Props) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const router = useRouter()

  const hoje = new Date().toISOString().slice(0, 10)

  const form = useForm<InteracaoFormData>({
    resolver: zodResolver(interacaoSchema),
    defaultValues: {
      tipo:            'ligacao',
      titulo:          '',
      descricao:       '',
      data_interacao:  hoje,
      proximo_contato: '',
    },
  })

  async function onSubmit(data: InteracaoFormData) {
    setErro(null)
    const result = await criarInteracao(clienteId, data)
    if (!result.ok) { setErro(result.error); return }
    form.reset({ tipo: 'ligacao', titulo: '', descricao: '', data_interacao: hoje, proximo_contato: '' })
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
          <Plus className="mr-1.5 h-4 w-4" /> Nova interação
        </Button>
      </div>

      {mostrarForm && (
        <Card className="p-5 bg-app-card">
          <div className="text-sm font-semibold text-ink mb-4">Registrar interação</div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="tipo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIPO_INTERACAO.map((t) => (
                          <SelectItem key={t} value={t}>{TIPO_INTERACAO_LABELS[t]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="data_interacao" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="titulo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl><Input placeholder="Ex: Ligação de prospecção" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="descricao" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Detalhes da interação…" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="proximo_contato" render={({ field }) => (
                <FormItem>
                  <FormLabel>Próximo contato</FormLabel>
                  <FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

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

      {interacoes.length === 0 ? (
        <Card className="p-10 text-center bg-app-card">
          <div className="text-sm text-ink-secondary">Nenhuma interação registrada.</div>
        </Card>
      ) : (
        <div className="space-y-3">
          {interacoes.map((i) => (
            <Card key={i.id} className="p-4 bg-app-card">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-brand-surface text-brand mt-0.5">
                  {TIPO_ICON[i.tipo as typeof TIPO_INTERACAO[number]] ?? <MessageSquare size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-ink">{i.titulo}</span>
                    <span className="text-[11px] font-mono text-ink-muted uppercase">
                      {TIPO_INTERACAO_LABELS[i.tipo as typeof TIPO_INTERACAO[number]] ?? i.tipo}
                    </span>
                  </div>
                  {i.descricao && <p className="mt-1 text-xs text-ink-secondary leading-relaxed">{i.descricao}</p>}
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-ink-muted font-mono">
                    <span>{formatDate(i.data_interacao)}</span>
                    {i.proximo_contato && (
                      <span className="text-brand">Próx: {formatDate(i.proximo_contato)}</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
