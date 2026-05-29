'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { solicitarResetSenha } from '@/app/actions/auth'

export function EsqueciSenhaForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [pending, setPending] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true); setErr(null)
    const r = await solicitarResetSenha(email)
    setPending(false)
    if (!r.ok) { setErr(r.error); return }
    setSent(true)
  }

  if (sent) {
    return (
      <Alert className="border-accent-border bg-accent-surface">
        <CheckCircle2 className="h-4 w-4 text-accent" />
        <AlertDescription className="text-accent text-sm">
          Se houver uma conta com <strong className="font-mono">{email}</strong>, um link de redefinição foi enviado.
          Confira sua caixa de entrada e a pasta de spam.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com.br"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      {err && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700 text-xs">{err}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={pending || !email} className="w-full bg-brand hover:bg-brand-dark text-white h-11">
        {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando…</> : 'Enviar link de redefinição'}
      </Button>
    </form>
  )
}
