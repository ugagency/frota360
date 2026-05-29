import { FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { DocumentoValidadeBadge } from '../documento-validade-badge'

type Doc = { tipo: string; validade: string }

export function DocumentosExtrasTab({ documentos }: { documentos: Doc[] }) {
  if (!documentos || documentos.length === 0) {
    return (
      <Card className="p-10 text-center bg-app-card">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-app-subtle text-ink-muted mb-3">
          <FileText size={22} />
        </div>
        <div className="text-sm font-medium text-ink">Nenhum documento extra cadastrado.</div>
        <div className="mt-1 text-xs text-ink-muted">
          Use o botão <strong>Editar</strong> no topo para adicionar carteira de trabalho, ASO, etc.
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-app-card">
      <ul className="divide-y">
        {documentos.map((d, i) => (
          <li key={i} className="flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-app-subtle text-ink-secondary">
                <FileText size={16} />
              </span>
              <div className="text-sm text-ink truncate">{d.tipo}</div>
            </div>
            <DocumentoValidadeBadge validade={d.validade} />
          </li>
        ))}
      </ul>
    </Card>
  )
}
