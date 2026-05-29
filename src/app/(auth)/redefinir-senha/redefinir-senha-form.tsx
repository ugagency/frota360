'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'

export function RedefinirSenhaForm() {
  const router = useRouter()
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [show, setShow] = useState(false)
  const [pending, setPending] = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  // Supabase processa o token do link automaticamente e cria sessão temporária
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session)
    })
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (senha.length < 8) { toast.error('Senha precisa de no mínimo 8 caracteres'); return }
    if (senha !== confirma) { toast.error('As senhas não conferem'); return }

    setPending(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: senha })
    setPending(false)

    if (error) { toast.error(error.message); return }
    toast.success('Senha atualizada. Bem-vindo de volta.')
    router.push('/')
  }

  if (hasSession === false) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertDescription className="text-red-700 text-xs">
          Link inválido ou expirado.{' '}
          <Link href="/esqueci-senha" className="underline">Solicite um novo →</Link>
        </AlertDescription>
      </Alert>
    )
  }

  if (hasSession === null) {
    return <div className="text-center text-sm text-ink-muted">Carregando…</div>
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="senha">Nova senha</Label>
        <div className="relative">
          <Input
            id="senha"
            type={show ? 'text' : 'password'}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            className="pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-secondary p-1"
            aria-label={show ? 'Ocultar' : 'Mostrar'}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirma">Confirmar nova senha</Label>
        <Input
          id="confirma"
          type={show ? 'text' : 'password'}
          value={confirma}
          onChange={(e) => setConfirma(e.target.value)}
          placeholder="Repita a senha"
          required
        />
      </div>

      <Button type="submit" disabled={pending} className="w-full bg-brand hover:bg-brand-dark text-white h-11">
        {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando…</> : 'Salvar nova senha'}
      </Button>
    </form>
  )
}
