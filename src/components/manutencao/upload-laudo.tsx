'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Paperclip, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { anexarLaudo } from '@/app/actions/manutencoes'

type Props = {
  manutencaoId: string
  transportadoraId: string
  laudoUrl: string | null
}

const BUCKET = 'laudos'

export function UploadLaudo({ manutencaoId, transportadoraId, laudoUrl }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [, startT] = useTransition()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const supabase = createClient()
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'pdf'
    const path = `${transportadoraId}/${manutencaoId}-${Date.now()}.${ext}`

    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (upErr) {
      setUploading(false)
      const msg = upErr.message.includes('not found')
        ? `Bucket "${BUCKET}" não existe — crie no Supabase Storage (acesso público de leitura).`
        : upErr.message
      toast.error(msg)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)

    startT(async () => {
      const r = await anexarLaudo(manutencaoId, publicUrl)
      setUploading(false)
      if (!r.ok) { toast.error(r.error); return }
      toast.success('Laudo anexado.')
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={handleUpload}
      />
      <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Paperclip className="mr-1.5 h-3.5 w-3.5" />}
        {laudoUrl ? 'Substituir laudo' : 'Anexar laudo'}
      </Button>
      {laudoUrl && (
        <Button asChild variant="ghost" size="sm">
          <a href={laudoUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Ver laudo
          </a>
        </Button>
      )}
    </div>
  )
}
