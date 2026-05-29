'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  cadastroStep1Schema, cadastroStep2Schema,
  type CadastroStep1Input, type CadastroStep2Input, UF,
} from '@/lib/validations/auth'
import { criarConta } from '@/app/actions/auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { formatarCNPJ, formatarTelefone } from '@/lib/format'

type Step = 1 | 2 | 3

export function CadastroWizard() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [step1, setStep1] = useState<CadastroStep1Input | null>(null)
  const [step2, setStep2] = useState<CadastroStep2Input | null>(null)
  const [aceite, setAceite] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function finalizar() {
    if (!step1 || !step2) return
    setSubmitting(true)
    const result = await criarConta({ ...step1, ...step2 })
    if (!result.ok) {
      toast.error(result.error)
      setSubmitting(false)
      return
    }
    toast.success('Conta criada! Bem-vindo ao Frota 360.')
    router.refresh()
    router.push('/')
  }

  return (
    <div>
      <Stepper step={step} />
      <Card className="mt-6 p-6 md:p-8 bg-app-card">
        {step === 1 && (
          <StepConta
            initial={step1}
            onNext={(d) => { setStep1(d); setStep(2) }}
          />
        )}
        {step === 2 && (
          <StepEmpresa
            initial={step2}
            onBack={() => setStep(1)}
            onNext={(d) => { setStep2(d); setStep(3) }}
          />
        )}
        {step === 3 && step1 && step2 && (
          <StepConfirmacao
            step1={step1}
            step2={step2}
            aceite={aceite}
            setAceite={setAceite}
            submitting={submitting}
            onBack={() => setStep(2)}
            onSubmit={finalizar}
          />
        )}
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------
function Stepper({ step }: { step: Step }) {
  const items = [
    { n: 1, label: 'Sua conta' },
    { n: 2, label: 'Transportadora' },
    { n: 3, label: 'Confirmação' },
  ] as const

  return (
    <ol className="flex items-center gap-2">
      {items.map((it, i) => {
        const isDone   = step > it.n
        const isActive = step === it.n
        return (
          <li key={it.n} className="flex-1 flex items-center gap-2">
            <div
              className={cn(
                'flex items-center justify-center h-8 w-8 rounded-full text-sm font-mono font-medium border-2 shrink-0',
                isDone   && 'bg-accent text-white border-accent',
                isActive && 'bg-brand text-white border-brand',
                !isDone && !isActive && 'bg-app-card text-ink-muted border-stone-300',
              )}
            >
              {isDone ? <Check size={14} /> : it.n}
            </div>
            <span className={cn(
              'text-xs font-medium hidden sm:inline',
              isActive ? 'text-ink' : 'text-ink-muted',
            )}>
              {it.label}
            </span>
            {i < items.length - 1 && (
              <span className={cn('flex-1 h-0.5', step > it.n ? 'bg-accent' : 'bg-stone-200')} />
            )}
          </li>
        )
      })}
    </ol>
  )
}

// ---------------------------------------------------------------------
function StepConta({
  initial, onNext,
}: { initial: CadastroStep1Input | null; onNext: (d: CadastroStep1Input) => void }) {
  const form = useForm<CadastroStep1Input>({
    resolver: zodResolver(cadastroStep1Schema),
    defaultValues: initial ?? { nome: '', email: '', senha: '', confirmar_senha: '' },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-5">
        <header>
          <h2 className="font-display text-2xl font-semibold text-ink">Sua conta</h2>
          <p className="text-sm text-ink-secondary mt-1">Vamos começar pelos seus dados.</p>
        </header>

        <FormField control={form.control} name="nome" render={({ field }) => (
          <FormItem>
            <FormLabel>Seu nome completo</FormLabel>
            <FormControl><Input placeholder="João da Silva" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>E-mail</FormLabel>
            <FormControl><Input type="email" placeholder="voce@empresa.com.br" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="senha" render={({ field }) => (
          <FormItem>
            <FormLabel>Senha</FormLabel>
            <FormControl><Input type="password" placeholder="Mínimo 8 caracteres" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="confirmar_senha" render={({ field }) => (
          <FormItem>
            <FormLabel>Confirmar senha</FormLabel>
            <FormControl><Input type="password" placeholder="Repita a senha" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <Button type="submit" className="w-full bg-brand hover:bg-brand-dark text-white h-11">
          Próximo →
        </Button>
      </form>
    </Form>
  )
}

// ---------------------------------------------------------------------
function StepEmpresa({
  initial, onBack, onNext,
}: {
  initial: CadastroStep2Input | null
  onBack: () => void
  onNext: (d: CadastroStep2Input) => void
}) {
  const form = useForm<CadastroStep2Input>({
    resolver: zodResolver(cadastroStep2Schema),
    defaultValues: initial ?? { nome_empresa: '', cnpj: '', telefone: '', cidade: '', estado: undefined as never },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-5">
        <header>
          <h2 className="font-display text-2xl font-semibold text-ink">Sua transportadora</h2>
          <p className="text-sm text-ink-secondary mt-1">Esses dados aparecem em relatórios e CT-es.</p>
        </header>

        <FormField control={form.control} name="nome_empresa" render={({ field }) => (
          <FormItem>
            <FormLabel>Razão social / Nome fantasia</FormLabel>
            <FormControl><Input placeholder="Transportes Silva Ltda" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

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
            <FormLabel>Telefone <span className="text-ink-muted font-normal">(opcional)</span></FormLabel>
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

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <FormField control={form.control} name="cidade" render={({ field }) => (
              <FormItem>
                <FormLabel>Cidade</FormLabel>
                <FormControl><Input placeholder="São Paulo" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <FormField control={form.control} name="estado" render={({ field }) => (
            <FormItem>
              <FormLabel>UF</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="font-mono"><SelectValue placeholder="—" /></SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-72">
                  {UF.map((uf) => <SelectItem key={uf} value={uf} className="font-mono">{uf}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1 h-11">← Voltar</Button>
          <Button type="submit" className="flex-1 h-11 bg-brand hover:bg-brand-dark text-white">Próximo →</Button>
        </div>
      </form>
    </Form>
  )
}

// ---------------------------------------------------------------------
function StepConfirmacao({
  step1, step2, aceite, setAceite, submitting, onBack, onSubmit,
}: {
  step1: CadastroStep1Input
  step2: CadastroStep2Input
  aceite: boolean
  setAceite: (v: boolean) => void
  submitting: boolean
  onBack: () => void
  onSubmit: () => void
}) {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-2xl font-semibold text-ink">Confirmação</h2>
        <p className="text-sm text-ink-secondary mt-1">Confira os dados antes de criar a conta.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Resumo title="Sua conta">
          <Linha label="Nome"  value={step1.nome} />
          <Linha label="Email" value={step1.email} />
        </Resumo>
        <Resumo title="Transportadora">
          <Linha label="Empresa"  value={step2.nome_empresa} />
          <Linha label="CNPJ"     value={step2.cnpj}      mono />
          {step2.telefone && <Linha label="Telefone" value={step2.telefone} mono />}
          <Linha label="Cidade/UF" value={`${step2.cidade} — ${step2.estado}`} />
        </Resumo>
      </div>

      <div className="rounded-md border bg-brand-surface/40 border-brand-border p-3 text-xs text-brand-dark">
        Plano <strong>Starter</strong> com <strong>14 dias grátis</strong>. Sem cartão de crédito.
      </div>

      <label className="flex items-start gap-2 cursor-pointer text-sm text-ink-secondary">
        <input
          type="checkbox"
          checked={aceite}
          onChange={(e) => setAceite(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-stone-300 text-brand focus:ring-brand"
        />
        Concordo com os <a href="#" className="text-brand hover:underline">Termos de Uso</a> e a{' '}
        <a href="#" className="text-brand hover:underline">Política de Privacidade</a>.
        {/* TODO Sprint 7: páginas de termos e política */}
      </label>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={submitting} className="flex-1 h-11">
          ← Voltar
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={!aceite || submitting}
          className="flex-1 h-11 bg-brand hover:bg-brand-dark text-white"
        >
          {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...</> : 'Criar minha conta'}
        </Button>
      </div>
    </div>
  )
}

function Resumo({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-app-subtle p-4">
      <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">{title}</div>
      <dl className="mt-2 space-y-1.5">{children}</dl>
    </div>
  )
}

function Linha({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <dt className="text-ink-muted">{label}</dt>
      <dd className={cn('text-ink text-right truncate', mono && 'font-mono')}>{value}</dd>
    </div>
  )
}
