'use client'

import { useRef, useState } from 'react'
import { Camera, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type TipoOCR = 'cnh' | 'crlv' | 'nf' | 'documento'
type Status = 'idle' | 'lendo' | 'ok' | 'erro'

type Props = {
  tipo: TipoOCR
  onExtraido: (dados: Record<string, unknown>) => void
  className?: string
  compact?: boolean
}

const TIPO_LABEL: Record<TipoOCR, string> = {
  cnh:       'CNH',
  crlv:      'CRLV',
  nf:        'nota fiscal',
  documento: 'documento',
}

export function OCRUpload({ tipo, onExtraido, className, compact }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [erro, setErro]     = useState('')
  const cameraRef  = useRef<HTMLInputElement>(null)
  const arquivoRef = useRef<HTMLInputElement>(null)

  async function processar(file: File) {
    setStatus('lendo')
    setErro('')
    try {
      const fd = new FormData()
      fd.append('arquivo', file)
      fd.append('tipo', tipo)

      const res  = await fetch('/api/ocr', { method: 'POST', body: fd })
      const json = await res.json().catch(() => ({ ok: false, error: 'Resposta inválida do servidor.' }))

      if (!json.ok) {
        setErro(json.error ?? 'Erro ao processar.')
        setStatus('erro')
        return
      }

      onExtraido(json.dados)
      setStatus('ok')
    } catch {
      setErro('Erro de conexão. Tente novamente.')
      setStatus('erro')
    }
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processar(file)
    e.target.value = ''
  }

  const label = TIPO_LABEL[tipo]

  const hiddenInputs = (
    <>
      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={onChange} />
      <input ref={arquivoRef} type="file" accept="image/*,application/pdf"        className="hidden" onChange={onChange} />
    </>
  )

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {hiddenInputs}
        {status === 'lendo' ? (
          <span className="flex items-center gap-1.5 text-xs text-ink-secondary">
            <Loader2 size={13} className="animate-spin" /> Lendo {label}…
          </span>
        ) : status === 'ok' ? (
          <span className="flex items-center gap-1.5 text-xs text-accent">
            <CheckCircle2 size={13} /> Dados extraídos
          </span>
        ) : status === 'erro' ? (
          <span
            title={erro}
            className="flex items-center gap-1.5 text-xs text-red-600 cursor-pointer"
            onClick={() => setStatus('idle')}
          >
            <AlertCircle size={13} /> Erro — tentar novamente
          </span>
        ) : (
          <>
            <button type="button" onClick={() => cameraRef.current?.click()}
              className="flex items-center gap-1 text-xs text-brand hover:text-brand-dark font-medium">
              <Camera size={13} /> Foto
            </button>
            <span className="text-ink-muted text-xs">·</span>
            <button type="button" onClick={() => arquivoRef.current?.click()}
              className="flex items-center gap-1 text-xs text-brand hover:text-brand-dark font-medium">
              <FileText size={13} /> Arquivo
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {hiddenInputs}
      {status === 'lendo' ? (
        <div className="flex items-center gap-2 text-sm text-ink-secondary py-3">
          <Loader2 size={16} className="animate-spin" />
          <span>Lendo {label}…</span>
        </div>
      ) : status === 'ok' ? (
        <div className="flex items-center gap-2 py-2">
          <CheckCircle2 size={16} className="text-accent shrink-0" />
          <span className="text-sm text-accent font-medium">Dados extraídos com sucesso</span>
          <button type="button" onClick={() => setStatus('idle')}
            className="ml-auto text-xs text-ink-muted hover:text-ink">
            Tentar outro
          </button>
        </div>
      ) : status === 'erro' ? (
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm text-red-600">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{erro}</span>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => cameraRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded hover:bg-app-subtle text-ink-secondary">
              <Camera size={13} /> Câmera
            </button>
            <button type="button" onClick={() => arquivoRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded hover:bg-app-subtle text-ink-secondary">
              <FileText size={13} /> Arquivo
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex items-center justify-center gap-2 h-10 px-3 text-sm border border-dashed rounded-lg hover:bg-app-subtle text-ink-secondary hover:text-brand hover:border-brand transition-colors"
          >
            <Camera size={16} />
            <span>Tirar foto</span>
          </button>
          <button
            type="button"
            onClick={() => arquivoRef.current?.click()}
            className="flex items-center justify-center gap-2 h-10 px-3 text-sm border border-dashed rounded-lg hover:bg-app-subtle text-ink-secondary hover:text-brand hover:border-brand transition-colors"
          >
            <FileText size={16} />
            <span>Enviar arquivo</span>
          </button>
        </div>
      )}
    </div>
  )
}
