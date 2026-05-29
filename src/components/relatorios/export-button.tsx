'use client'

import { Download, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportToCSV, type CsvColumn } from '@/lib/export-csv'

type Row = Record<string, unknown>

export function ExportCsvButton({ data, filename, columns, label = 'Exportar CSV' }: {
  data: Row[]
  filename: string
  columns: CsvColumn[]
  label?: string
}) {
  return (
    <Button variant="outline" size="sm" onClick={() => exportToCSV(data, filename, columns)}>
      <Download className="mr-1.5 h-3.5 w-3.5" /> {label}
    </Button>
  )
}

export function PrintButton({ label = 'Imprimir' }: { label?: string }) {
  return (
    <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
      <Printer className="mr-1.5 h-3.5 w-3.5" /> {label}
    </Button>
  )
}
