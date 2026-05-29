'use client'

import { formatDate, formatCurrency } from '@/lib/utils'

type Row = Record<string, unknown>

/**
 * Colunas usam string `key` (não função) porque o componente que recebe é client
 * — funções não cruzam o boundary server→client. Pré-flatten os dados no server
 * antes de passar pra cá.
 */
export type CsvColumn = {
  header: string
  key: string
  format?: 'date' | 'currency' | 'number'
}

function escape(v: unknown): string {
  if (v == null) return ''
  const s = String(v)
  if (/[",;\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function formatCell(value: unknown, col: CsvColumn): string {
  if (value == null) return ''
  if (col.format === 'date')     return formatDate(value as string)
  if (col.format === 'currency') return formatCurrency(Number(value))
  if (col.format === 'number')   return Number(value).toLocaleString('pt-BR')
  return String(value)
}

export function exportToCSV(
  data: Row[],
  filename: string,
  columns: CsvColumn[],
): void {
  const sep = ';' // padrão Excel BR
  const headerLine = columns.map((c) => escape(c.header)).join(sep)
  const rows = data.map((row) =>
    columns.map((c) => escape(formatCell(row[c.key], c))).join(sep),
  )
  // BOM para Excel reconhecer UTF-8
  const csv = '﻿' + [headerLine, ...rows].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 100)
}
