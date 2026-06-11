'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, CheckCircle2, XCircle, MinusCircle, Loader2, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { checklistSchema, type ChecklistFormData } from '@/lib/validations/checklist'
import { criarChecklist } from '@/app/actions/checklists'

const ITENS_PADRAO = [
  'Pneus (calibragem e estado)', 'Nível de óleo do motor', 'Nível de água do radiador',
  'Freios', 'Luzes (faróis, lanternas, seta, ré)', 'Limpador de para-brisa',
  'Espelhos retrovisores', 'Extintor de incêndio', 'Triângulo de sinalização',
  'Documentação do veículo', 'Tacógrafo', 'Estado da carroceria',
  'Cintos de segurança', 'Buzina', 'Estepe',
]

const STATUS_CONFIG = {
  aprovado:      { label: 'OK',                    className: 'bg-accent/10 text-accent border-accent/30' },
  com_ressalvas: { label: 'Com itens a verificar', className: 'bg-amber-100 text-amber-700 border-amber-300' },
  reprovado:     { label: 'Com problemas',         className: 'bg-red-100 text-red-700 border-red-300' },
} as const

type ChecklistRow = {
  id: string
  tipo: string
  data_realizacao: string
  status_geral: 'aprovado' | 'com_ressalvas' | 'reprovado'
  itens: Array<{ nome: string; resultado: string }>
  veiculos: { placa: string; modelo: string | null } | null
  motoristas: { nome: string } | null
}

type Props = {
  checklists: ChecklistRow[]
  veiculos: { id: string; placa: string; modelo: string | null }[]
  motoristas: { id: string; nome: string }[]
}

export function ChecklistsClient({ checklists, veiculos, motoristas }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink leading-none">Checklists</h1>
          <p className="mt-1.5 text-sm text-ink-muted">Inspeções de saída e chegada com rastreamento de itens não conformes.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-brand hover:bg-brand-dark text-white gap-2">
          <Plus size={16} />
          Novo checklist
        </Button>
      </header>

      {checklists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ClipboardList size={40} className="text-ink-muted mb-3" />
          <p className="font-medium text-ink">Nenhum checklist registrado</p>
          <p className="text-sm text-ink-muted mt-1">Registre a primeira inspeção clicando em &quot;Novo checklist&quot;.</p>
        </div>
      ) : (
        <div className="bg-app-card border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b bg-app-subtle">
                {['Data', 'Veículo', 'Motorista', 'Tipo', 'Status', 'Itens com problema'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-wider text-ink-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {checklists.map((c) => {
                const nc = c.itens.filter((i) => i.resultado === 'nao_conforme').length
                const cfg = STATUS_CONFIG[c.status_geral]
                return (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-app-subtle/50">
                    <td className="px-4 py-3 font-mono text-xs">
                      {new Date(c.data_realizacao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium">{c.veiculos?.placa ?? '—'}</td>
                    <td className="px-4 py-3">{c.motoristas?.nome ?? '—'}</td>
                    <td className="px-4 py-3">{c.tipo === 'saida' ? 'Vistoria de saída' : 'Vistoria de chegada'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {nc > 0 ? (
                        <span className="text-red-600 font-mono font-semibold">{nc}</span>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Novo checklist</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <ChecklistForm veiculos={veiculos} motoristas={motoristas} onSuccess={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function ChecklistForm({
  veiculos, motoristas, onSuccess,
}: {
  veiculos: Props['veiculos']
  motoristas: Props['motoristas']
  onSuccess: () => void
}) {
  const [submitting, setSubmitting] = useState(false)

  const nowLocal = () => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
  }

  const form = useForm<ChecklistFormData>({
    resolver: zodResolver(checklistSchema),
    defaultValues: {
      veiculo_id:      '',
      motorista_id:    null,
      tipo:            'saida',
      data_realizacao: nowLocal(),
      observacao_geral: '',
      itens: ITENS_PADRAO.map((nome) => ({ nome, resultado: 'nao_verificado', observacao: '' })),
    },
  })

  const { fields } = useFieldArray({ control: form.control, name: 'itens' })

  async function onSubmit(values: ChecklistFormData) {
    setSubmitting(true)
    const res = await criarChecklist(values)
    setSubmitting(false)
    if (!res.ok) { toast.error(res.error); return }
    toast.success('Checklist registrado.')
    onSuccess()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Cabeçalho */}
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="veiculo_id" render={({ field }) => (
            <FormItem>
              <FormLabel>Veículo *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger></FormControl>
                <SelectContent>
                  {veiculos.map((v) => <SelectItem key={v.id} value={v.id}>{v.placa}{v.modelo ? ` — ${v.modelo}` : ''}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="motorista_id" render={({ field }) => (
            <FormItem>
              <FormLabel>Motorista</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(v || null)}
                value={field.value ?? undefined}
              >
                <FormControl><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger></FormControl>
                <SelectContent>
                  {motoristas.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="tipo" render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="saida">Vistoria de saída</SelectItem>
                  <SelectItem value="chegada">Vistoria de chegada</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />

          <FormField control={form.control} name="data_realizacao" render={({ field }) => (
            <FormItem>
              <FormLabel>Data/hora *</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} className="font-mono text-sm" />
              </FormControl>
            </FormItem>
          )} />
        </div>

        {/* Itens */}
        <div>
          <p className="text-sm font-semibold text-ink mb-3">Itens de inspeção</p>
          <div className="space-y-2">
            {fields.map((field, i) => {
              const resultado = form.watch(`itens.${i}.resultado`)
              return (
                <div
                  key={field.id}
                  className={`rounded-lg border p-3 ${resultado === 'nao_conforme' ? 'border-red-300 bg-red-50' : 'border-border'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-ink flex-1">{field.nome}</span>
                    <div className="flex items-center gap-1">
                      {(['ok', 'nao_conforme', 'nao_verificado'] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => form.setValue(`itens.${i}.resultado`, r)}
                          className={`p-1.5 rounded transition-colors ${resultado === r ? 'bg-current' : 'opacity-30 hover:opacity-60'}`}
                          title={r === 'ok' ? 'OK' : r === 'nao_conforme' ? 'Não conforme' : 'Não verificado'}
                        >
                          {r === 'ok' && <CheckCircle2 size={18} className={resultado === r ? 'text-accent' : 'text-ink-muted'} />}
                          {r === 'nao_conforme' && <XCircle size={18} className={resultado === r ? 'text-red-600' : 'text-ink-muted'} />}
                          {r === 'nao_verificado' && <MinusCircle size={18} className={resultado === r ? 'text-ink-secondary' : 'text-ink-muted'} />}
                        </button>
                      ))}
                    </div>
                  </div>
                  {resultado === 'nao_conforme' && (
                    <div className="mt-2">
                      <Input
                        {...form.register(`itens.${i}.observacao`)}
                        placeholder="Descreva o problema *"
                        className="text-sm border-red-300 focus:border-red-500"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Observação geral */}
        <FormField control={form.control} name="observacao_geral" render={({ field }) => (
          <FormItem>
            <FormLabel>Observação geral</FormLabel>
            <FormControl>
              <Textarea {...field} value={field.value ?? ''} rows={2} placeholder="Observações adicionais…" />
            </FormControl>
          </FormItem>
        )} />

        <div className="flex gap-2 justify-end pt-2">
          <Button type="submit" disabled={submitting} className="bg-brand hover:bg-brand-dark text-white">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registrar checklist
          </Button>
        </div>
      </form>
    </Form>
  )
}
