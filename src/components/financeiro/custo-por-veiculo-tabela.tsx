'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Download, ArrowUpDown } from 'lucide-react'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatKm } from '@/lib/utils'
import { exportToCSV } from '@/lib/export-csv'

export type CustoVeiculoRow = {
  veiculo_id: string
  placa: string
  modelo: string | null
  combustivel: number
  manutencao: number
  pedagio: number
  multa: number
  outros: number
  total: number
  kmRodados: number
  custoPorKm: number
}

type SortKey = 'placa' | 'total' | 'custoPorKm' | 'kmRodados'

export function CustoPorVeiculoTabela({ rows, periodo }: { rows: CustoVeiculoRow[]; periodo: string }) {
  const [sortKey, setSortKey] = useState<SortKey>('total')
  const [asc, setAsc] = useState(false)

  const sorted = useMemo(() => {
    const copy = [...rows]
    copy.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      if (typeof av === 'number' && typeof bv === 'number') return asc ? av - bv : bv - av
      return asc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })
    return copy
  }, [rows, sortKey, asc])

  const totais = useMemo(() => rows.reduce((acc, r) => ({
    combustivel: acc.combustivel + r.combustivel,
    manutencao:  acc.manutencao  + r.manutencao,
    pedagio:     acc.pedagio     + r.pedagio,
    multa:       acc.multa       + r.multa,
    outros:      acc.outros      + r.outros,
    total:       acc.total       + r.total,
    kmRodados:   acc.kmRodados   + r.kmRodados,
  }), { combustivel: 0, manutencao: 0, pedagio: 0, multa: 0, outros: 0, total: 0, kmRodados: 0 }), [rows])

  function toggleSort(k: SortKey) {
    if (sortKey === k) setAsc(!asc); else { setSortKey(k); setAsc(false) }
  }

  function exportar() {
    exportToCSV(sorted, `custo-por-veiculo-${periodo}.csv`, [
      { header: 'Placa',       key: 'placa' },
      { header: 'Modelo',      key: 'modelo' },
      { header: 'Combustível', key: 'combustivel', format: 'currency' },
      { header: 'Manutenção',  key: 'manutencao',  format: 'currency' },
      { header: 'Pedágio',     key: 'pedagio',     format: 'currency' },
      { header: 'Multas',      key: 'multa',       format: 'currency' },
      { header: 'Outros',      key: 'outros',      format: 'currency' },
      { header: 'Total',       key: 'total',       format: 'currency' },
      { header: 'KM rodados',  key: 'kmRodados',   format: 'number' },
      { header: 'Custo/KM',    key: 'custoPorKm',  format: 'currency' },
    ])
  }

  if (rows.length === 0) {
    return <div className="rounded-md border bg-app-card p-8 text-center text-sm text-ink-muted">Sem dados no período.</div>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <Button onClick={exportar} variant="outline" size="sm">
          <Download className="mr-1.5 h-3.5 w-3.5" /> Exportar CSV
        </Button>
      </div>

      <div className="rounded-md border bg-app-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-app-subtle/40 hover:bg-app-subtle/40">
              <Sortable label="Placa"   active={sortKey === 'placa'}     asc={asc} onClick={() => toggleSort('placa')} />
              <TableHead className="font-mono text-[11px] uppercase text-ink-muted">Modelo</TableHead>
              <TableHead className="font-mono text-[11px] uppercase text-ink-muted text-right">Combustível</TableHead>
              <TableHead className="font-mono text-[11px] uppercase text-ink-muted text-right">Manutenção</TableHead>
              <TableHead className="font-mono text-[11px] uppercase text-ink-muted text-right">Pedágio</TableHead>
              <TableHead className="font-mono text-[11px] uppercase text-ink-muted text-right">Multas</TableHead>
              <TableHead className="font-mono text-[11px] uppercase text-ink-muted text-right">Outros</TableHead>
              <Sortable label="Total"      active={sortKey === 'total'}      asc={asc} onClick={() => toggleSort('total')}      align="right" />
              <Sortable label="KM rodados" active={sortKey === 'kmRodados'}  asc={asc} onClick={() => toggleSort('kmRodados')}  align="right" />
              <Sortable label="Custo/KM"   active={sortKey === 'custoPorKm'} asc={asc} onClick={() => toggleSort('custoPorKm')} align="right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((r) => (
              <TableRow key={r.veiculo_id} className="hover:bg-app-subtle/40">
                <TableCell>
                  <Link href={`/frota/${r.veiculo_id}`} className="font-mono font-bold text-brand-dark hover:underline">{r.placa}</Link>
                </TableCell>
                <TableCell className="text-sm text-ink-secondary">{r.modelo ?? '—'}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatCurrency(r.combustivel)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatCurrency(r.manutencao)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatCurrency(r.pedagio)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatCurrency(r.multa)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatCurrency(r.outros)}</TableCell>
                <TableCell className="text-right font-mono text-sm font-bold text-brand-dark">{formatCurrency(r.total)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{r.kmRodados > 0 ? formatKm(r.kmRodados) : '—'}</TableCell>
                <TableCell className="text-right font-mono text-sm">{r.custoPorKm > 0 ? formatCurrency(r.custoPorKm) : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-app-subtle/60 hover:bg-app-subtle/60">
              <TableCell colSpan={2} className="font-display font-semibold text-ink">TOTAIS</TableCell>
              <TableCell className="text-right font-mono font-bold">{formatCurrency(totais.combustivel)}</TableCell>
              <TableCell className="text-right font-mono font-bold">{formatCurrency(totais.manutencao)}</TableCell>
              <TableCell className="text-right font-mono font-bold">{formatCurrency(totais.pedagio)}</TableCell>
              <TableCell className="text-right font-mono font-bold">{formatCurrency(totais.multa)}</TableCell>
              <TableCell className="text-right font-mono font-bold">{formatCurrency(totais.outros)}</TableCell>
              <TableCell className="text-right font-mono font-bold text-brand-dark">{formatCurrency(totais.total)}</TableCell>
              <TableCell className="text-right font-mono font-bold">{totais.kmRodados > 0 ? formatKm(totais.kmRodados) : '—'}</TableCell>
              <TableCell className="text-right font-mono font-bold">
                {totais.kmRodados > 0 ? formatCurrency(totais.total / totais.kmRodados) : '—'}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  )
}

function Sortable({ label, active, asc, onClick, align = 'left' }: {
  label: string; active: boolean; asc: boolean; onClick: () => void; align?: 'left' | 'right'
}) {
  return (
    <TableHead className={`font-mono text-[11px] uppercase text-ink-muted ${align === 'right' ? 'text-right' : ''}`}>
      <button onClick={onClick} className={`inline-flex items-center gap-1 ${active ? 'text-ink' : ''}`}>
        {label} <ArrowUpDown size={10} className={active ? (asc ? 'rotate-180' : '') : 'opacity-40'} />
      </button>
    </TableHead>
  )
}
