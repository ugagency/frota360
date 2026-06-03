'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { viagemCreateSchema, type ViagemCreateData, TIPOS_CARGA } from '@/lib/validations/viagem'
import { criarViagem } from '@/app/actions/viagens'
import { getDaysUntil } from '@/lib/utils'
import { formatarKmInput, parseKmInput } from '@/lib/format'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import {
  ViagemPreviewPanel,
  type VeiculoOption, type MotoristaOption,
} from './viagem-preview-panel'

type Props = {
  veiculos:   VeiculoOption[]
  motoristas: MotoristaOption[]
  plano?: 'demo' | 'basico' | 'profissional'
}

function nowLocalDateTime() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export function ViagemForm({ veiculos, motoristas, plano = 'demo' }: Props) {
  const isPro = plano === 'profissional'
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const defaultSaida = nowLocalDateTime()
  const defaultChegada = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
  })()

  const form = useForm<ViagemCreateData>({
    resolver: zodResolver(viagemCreateSchema),
    defaultValues: {
      veiculo_id: '',
      motorista_id: '',
      origem: '',
      destino: '',
      data_saida:   defaultSaida,
      data_chegada: defaultChegada,
      cliente: '',
      tipo_carga: '',
      peso_ton: undefined,
      cte_numero: '',
      cte_chave: '',
      cte_status: 'pendente',
      mdfe_numero: '',
      mdfe_chave: '',
      mdfe_status: 'pendente',
      ciot_codigo: '',
      valor_frete: 0,
      valor_adiantamento: 0,
      km_saida: 0,
      observacoes: '',
    },
  })

  const veiculoId   = form.watch('veiculo_id')
  const motoristaId = form.watch('motorista_id')
  const origem      = form.watch('origem')
  const destino     = form.watch('destino')
  const dataSaida   = form.watch('data_saida')
  const dataChegada = form.watch('data_chegada')
  const valorFrete  = form.watch('valor_frete') || 0
  const valorAdiantamento = form.watch('valor_adiantamento') || 0

  const veiculoSel   = useMemo(() => veiculos.find((v) => v.id === veiculoId) ?? null, [veiculoId, veiculos])
  const motoristaSel = useMemo(() => motoristas.find((m) => m.id === motoristaId) ?? null, [motoristaId, motoristas])

  const cnhVencida = !!(motoristaSel?.cnh_validade && getDaysUntil(motoristaSel.cnh_validade) < 0)
  const desabilitar = pending || cnhVencida

  // pré-preenche km_saida ao selecionar veículo
  function onVeiculoChange(id: string) {
    form.setValue('veiculo_id', id)
    const v = veiculos.find((x) => x.id === id)
    if (v) form.setValue('km_saida', v.km_atual)
  }

  function onSubmit(data: ViagemCreateData) {
    startTransition(async () => {
      const r = await criarViagem(data)
      if (!r.ok) { toast.error(r.error); return }
      toast.success(`Viagem aberta com sucesso.`)
      router.push(`/viagens/${r.data!.id}`)
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="lg:col-span-8 space-y-8">
          {/* VEÍCULO E MOTORISTA */}
          <Secao titulo="Veículo e motorista">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField control={form.control} name="veiculo_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Veículo *</FormLabel>
                  <Select onValueChange={onVeiculoChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um veículo ativo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {veiculos.length === 0 && (
                        <div className="px-2 py-3 text-center text-xs text-ink-muted">Nenhum veículo ativo disponível.</div>
                      )}
                      {veiculos.map((v) => (
                        <SelectItem key={v.id} value={v.id} className="font-mono">
                          {v.placa} {v.modelo && <span className="text-ink-muted">— {v.modelo}</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="motorista_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Motorista *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione um motorista ativo" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {motoristas.length === 0 && (
                        <div className="px-2 py-3 text-center text-xs text-ink-muted">Nenhum motorista ativo disponível.</div>
                      )}
                      {motoristas.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.nome} {m.cnh_categoria && <span className="text-ink-muted">({m.cnh_categoria})</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </Secao>

          <Separator />

          {/* ROTA */}
          <Secao titulo="Rota">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField control={form.control} name="origem" render={({ field }) => (
                <FormItem>
                  <FormLabel>Origem *</FormLabel>
                  <FormControl><Input {...field} placeholder="São Paulo/SP" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="destino" render={({ field }) => (
                <FormItem>
                  <FormLabel>Destino *</FormLabel>
                  <FormControl><Input {...field} placeholder="Belo Horizonte/MG" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField control={form.control} name="data_saida" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data e hora de saída *</FormLabel>
                  <FormControl><Input type="datetime-local" className="font-mono" value={field.value ?? ''} onChange={field.onChange} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="data_chegada" render={({ field }) => (
                <FormItem>
                  <FormLabel>Previsão de chegada *</FormLabel>
                  <FormControl><Input type="datetime-local" className="font-mono" value={field.value ?? ''} onChange={field.onChange} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </Secao>

          <Separator />

          {/* CARGA */}
          <Secao titulo="Carga">
            <FormField control={form.control} name="cliente" render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <FormControl><Input {...field} value={field.value ?? ''} placeholder="Indústrias Reunidas S.A." /></FormControl>
              </FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FormField control={form.control} name="tipo_carga" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Tipo de carga</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                    <FormControl><SelectTrigger><SelectValue placeholder="—" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {TIPOS_CARGA.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="peso_ton" render={({ field }) => (
                <FormItem>
                  <FormLabel>Peso (ton)</FormLabel>
                  <FormControl>
                    <Input
                      type="number" step="0.1" min="0"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )} />
            </div>

          </Secao>

          <Separator />

          {/* FINANCEIRO */}
          <Secao titulo="Financeiro">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField control={form.control} name="valor_frete" render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor do frete (R$) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number" step="0.01" min="0" className="font-mono"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="valor_adiantamento" render={({ field }) => (
                <FormItem>
                  <FormLabel>Adiantamento (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number" step="0.01" min="0" className="font-mono"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </Secao>

          <Separator />

          {/* DOCUMENTOS FISCAIS — Profissional */}
          <Secao titulo={isPro ? 'Documentos fiscais' : 'Documentos fiscais (Profissional)'}>
            {!isPro ? (
              <p className="text-xs text-ink-muted bg-app-subtle rounded px-3 py-2">
                CT-e, MDF-e e CIOT disponíveis no plano Profissional.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="cte_numero" render={({ field }) => (
                    <FormItem>
                      <FormLabel>CT-e número</FormLabel>
                      <FormControl><Input {...field} value={field.value ?? ''} className="font-mono" placeholder="Número" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="cte_status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status CT-e</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="emitido">Emitido</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="cte_chave" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chave de acesso CT-e</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ''} className="font-mono text-xs" placeholder="44 dígitos" maxLength={44} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="mdfe_numero" render={({ field }) => (
                    <FormItem>
                      <FormLabel>MDF-e número</FormLabel>
                      <FormControl><Input {...field} value={field.value ?? ''} className="font-mono" placeholder="Número" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="mdfe_status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status MDF-e</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="emitido">Emitido</SelectItem>
                          <SelectItem value="encerrado">Encerrado</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="ciot_codigo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CIOT</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ''} className="font-mono" placeholder="Código CIOT" /></FormControl>
                  </FormItem>
                )} />
              </>
            )}
          </Secao>

          <Separator />

          {/* KM */}
          <Secao titulo="Quilometragem">
            <FormField control={form.control} name="km_saida" render={({ field }) => (
              <FormItem>
                <FormLabel>KM de saída *</FormLabel>
                <FormControl>
                  <Input
                    inputMode="numeric" className="font-mono"
                    value={field.value ? formatarKmInput(field.value) : ''}
                    onChange={(e) => field.onChange(parseKmInput(e.target.value))}
                  />
                </FormControl>
                <p className="text-[11px] text-ink-muted">Pré-preenchido com KM atual do veículo. Ajuste se houver divergência.</p>
                <FormMessage />
              </FormItem>
            )} />
          </Secao>

          {/* RODAPÉ */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={pending}>Cancelar</Button>
            <Button type="submit" disabled={desabilitar} className="bg-brand hover:bg-brand-dark text-white">
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Abrir viagem
            </Button>
          </div>
        </form>
      </Form>

      <aside className="lg:col-span-4">
        <ViagemPreviewPanel
          veiculo={veiculoSel}
          motorista={motoristaSel}
          origem={origem}
          destino={destino}
          dataSaida={dataSaida}
          dataChegada={dataChegada}
          valorFrete={valorFrete}
          valorAdiantamento={valorAdiantamento}
          cnhVencida={cnhVencida}
        />
      </aside>
    </div>
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
