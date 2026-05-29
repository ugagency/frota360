import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PeriodoPicker } from '@/components/financeiro/periodo-picker'
import { ExportCsvButton, PrintButton } from '@/components/relatorios/export-button'
import { AvatarIniciais } from '@/components/motoristas/avatar-iniciais'
import { DocumentoValidadeBadge } from '@/components/motoristas/documento-validade-badge'
import { formatCurrency, formatKm } from '@/lib/utils'

export const dynamic = 'force-dynamic'

type SearchParams = { de?: string; ate?: string }

function mesAtual() {
  const d = new Date()
  return {
    de: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10),
    ate: new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10),
  }
}

export default async function RelatorioMotoristasPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient()
  const def = mesAtual()
  const de = searchParams.de ?? def.de
  const ate = searchParams.ate ?? def.ate

  const [motoristas, viagens] = await Promise.all([
    supabase.from('motoristas')
      .select('id, nome, cnh_categoria, cnh_validade, mopp_validade, documentos, status')
      .order('nome')
      .returns<{
        id: string; nome: string; cnh_categoria: 'C' | 'D' | 'E' | null;
        cnh_validade: string | null; mopp_validade: string | null;
        documentos: { tipo: string; validade: string }[] | null; status: string
      }[]>(),
    supabase.from('viagens')
      .select('motorista_id, km_saida, km_chegada, valor_frete')
      .eq('status', 'concluida')
      .gte('data_chegada_real', de).lte('data_chegada_real', `${ate}T23:59:59`)
      .returns<{ motorista_id: string; km_saida: number | null; km_chegada: number | null; valor_frete: number | null }[]>(),
  ])

  const all = motoristas.data ?? []

  // Performance
  type Perf = { id: string; nome: string; viagens: number; kmRodados: number; frete: number; mediaKm: number }
  const perfMap = new Map<string, Perf>()
  for (const m of all) perfMap.set(m.id, { id: m.id, nome: m.nome, viagens: 0, kmRodados: 0, frete: 0, mediaKm: 0 })
  for (const v of viagens.data ?? []) {
    const p = perfMap.get(v.motorista_id)
    if (!p) continue
    p.viagens++
    if (v.km_saida != null && v.km_chegada != null) p.kmRodados += Number(v.km_chegada) - Number(v.km_saida)
    if (v.valor_frete != null) p.frete += Number(v.valor_frete)
  }
  const perf = Array.from(perfMap.values())
    .map((p) => ({ ...p, mediaKm: p.viagens > 0 ? p.kmRodados / p.viagens : 0 }))
    .filter((p) => p.viagens > 0)
    .sort((a, b) => b.viagens - a.viagens)

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-xs text-ink-muted print:hidden">
        <Link href="/relatorios" className="hover:text-ink">Relatórios</Link>
        <ChevronRight size={12} />
        <span className="text-ink">Motoristas</span>
      </nav>

      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink leading-none">Relatório de Motoristas</h1>
          <p className="mt-1.5 text-sm text-ink-muted font-mono">Performance no período {de} → {ate} · documentação completa.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <PeriodoPicker />
          <PrintButton />
          <ExportCsvButton
            data={all} filename={`motoristas-documentacao-${new Date().toISOString().slice(0, 10)}`}
            columns={[
              { header: 'Nome',        key: 'nome' },
              { header: 'Categoria CNH', key: 'cnh_categoria' },
              { header: 'CNH validade', key: 'cnh_validade',  format: 'date' },
              { header: 'MOPP validade', key: 'mopp_validade', format: 'date' },
              { header: 'Status',      key: 'status' },
            ]}
            label="Exportar documentação"
          />
        </div>
      </header>

      <Card className="bg-app-card overflow-hidden">
        <div className="p-5 pb-2">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">Performance no período</h3>
        </div>
        {perf.length === 0 ? (
          <p className="p-5 pt-2 text-sm text-ink-muted">Nenhum motorista realizou viagens no período.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-app-subtle/40 hover:bg-app-subtle/40">
                {['Motorista', 'Viagens', 'KM rodados', 'Frete gerado', 'Média KM/viagem'].map((h, i) => (
                  <TableHead key={i} className={`font-mono text-[11px] uppercase text-ink-muted ${i > 0 ? 'text-right' : ''}`}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {perf.map((p) => (
                <TableRow key={p.id} className="hover:bg-app-subtle/40">
                  <TableCell>
                    <Link href={`/motoristas/${p.id}`} className="flex items-center gap-2.5 group">
                      <AvatarIniciais nome={p.nome} size="sm" />
                      <span className="text-sm font-medium text-ink group-hover:text-brand-dark">{p.nome}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-bold">{p.viagens}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatKm(p.kmRodados)}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-accent">{formatCurrency(p.frete)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatKm(p.mediaKm)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="bg-app-card overflow-hidden">
        <div className="p-5 pb-2">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">Documentação — todos os motoristas</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-app-subtle/40 hover:bg-app-subtle/40">
              {['Motorista', 'CNH', 'MOPP', 'Outros documentos'].map((h) => (
                <TableHead key={h} className="font-mono text-[11px] uppercase text-ink-muted">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {all.map((m) => (
              <TableRow key={m.id} className="hover:bg-app-subtle/40">
                <TableCell>
                  <Link href={`/motoristas/${m.id}`} className="flex items-center gap-2.5">
                    <AvatarIniciais nome={m.nome} size="sm" />
                    <div>
                      <div className="text-sm font-medium text-ink">{m.nome}</div>
                      <div className="text-[11px] font-mono text-ink-muted uppercase">{m.status}</div>
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {m.cnh_categoria && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-brand-surface text-brand-dark border border-brand-border mr-1">
                        {m.cnh_categoria}
                      </span>
                    )}
                    <DocumentoValidadeBadge validade={m.cnh_validade} />
                  </div>
                </TableCell>
                <TableCell><DocumentoValidadeBadge validade={m.mopp_validade} /></TableCell>
                <TableCell>
                  {!m.documentos || m.documentos.length === 0 ? (
                    <span className="text-xs text-ink-muted">—</span>
                  ) : (
                    <ul className="space-y-1">
                      {m.documentos.map((d, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs">
                          <span className="text-ink truncate max-w-[160px]">{d.tipo}</span>
                          <DocumentoValidadeBadge validade={d.validade} compact />
                        </li>
                      ))}
                    </ul>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
