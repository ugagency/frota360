import { Card } from '@/components/ui/card'
import { PriorityBadge, type Priority } from '@/components/ui/priority-badge'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatKm } from '@/lib/utils'
import { TIPO_LABELS, PROPRIETARIO_LABELS } from '@/lib/validations/veiculo'

type VeiculoDetalhe = {
  id: string
  marca: string | null
  modelo: string | null
  tipo: keyof typeof TIPO_LABELS
  cor: string | null
  renavam: string | null
  chassi: string | null
  data_licenciamento: string | null
  km_proxima_revisao: number | null
  data_proxima_revisao: string | null
  proprietario: 'proprio' | 'agregado'
  observacoes: string | null
}

export async function VisaoGeralTab({ veiculo }: { veiculo: VeiculoDetalhe }) {
  const supabase = createClient()
  const { data: alertas } = await supabase
    .from('alertas')
    .select('id, titulo, descricao, prioridade, data_alerta')
    .eq('referencia_id', veiculo.id)
    .eq('referencia_tipo', 'veiculo')
    .eq('status', 'pendente')
    .returns<{ id: string; titulo: string; descricao: string | null; prioridade: Priority; data_alerta: string }[]>()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="p-5 bg-app-card lg:col-span-2">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">Dados do veículo</h3>
        <dl className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Info label="Marca"          value={veiculo.marca ?? '—'} />
          <Info label="Tipo"           value={TIPO_LABELS[veiculo.tipo]} />
          <Info label="Cor"            value={veiculo.cor ?? '—'} />
          <Info label="Proprietário"   value={PROPRIETARIO_LABELS[veiculo.proprietario]} />
          <Info label="RENAVAM"        value={veiculo.renavam ?? '—'} mono />
          <Info label="Chassi"         value={veiculo.chassi ?? '—'} mono />
          <Info label="Licenciamento"  value={veiculo.data_licenciamento ? formatDate(veiculo.data_licenciamento) : '—'} mono />
          <Info label="KM próx. rev."  value={veiculo.km_proxima_revisao != null ? formatKm(veiculo.km_proxima_revisao) : '—'} mono />
          <Info label="Data próx. rev." value={veiculo.data_proxima_revisao ? formatDate(veiculo.data_proxima_revisao) : '—'} mono />
        </dl>

        {veiculo.observacoes && (
          <div className="mt-6 pt-4 border-t">
            <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">Observações</div>
            <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{veiculo.observacoes}</p>
          </div>
        )}
      </Card>

      <Card className="p-5 bg-app-card">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">
          Alertas ativos {alertas && alertas.length > 0 && (
            <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-red-600 text-white text-[10px] font-mono">{alertas.length}</span>
          )}
        </h3>

        {!alertas || alertas.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">Nenhum alerta pendente para este veículo.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {alertas.map((a) => (
              <li key={a.id} className="border-l-2 border-stone-200 pl-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <PriorityBadge prioridade={a.prioridade} />
                  <span className="font-mono text-[11px] text-ink-muted">{formatDate(a.data_alerta)}</span>
                </div>
                <div className="text-sm font-medium text-ink leading-tight">{a.titulo}</div>
                {a.descricao && <div className="text-xs text-ink-secondary mt-0.5">{a.descricao}</div>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">{label}</dt>
      <dd className={`mt-0.5 text-sm text-ink ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  )
}
