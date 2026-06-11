'use client'

import { useState, useRef } from 'react'
import { Camera, FileUp, Download, ChevronRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button'

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Entidade = 'veiculos' | 'motoristas' | 'clientes'
type Etapa = 'upload' | 'mapeamento' | 'preview' | 'importando' | 'resultado'

type ColDef = { campo: string; label: string; obrigatorio: boolean }

const COLUNAS: Record<Entidade, ColDef[]> = {
  veiculos: [
    { campo: 'placa',    label: 'Placa',       obrigatorio: true  },
    { campo: 'tipo',     label: 'Tipo',         obrigatorio: false },
    { campo: 'marca',    label: 'Marca',        obrigatorio: false },
    { campo: 'modelo',   label: 'Modelo',       obrigatorio: false },
    { campo: 'ano',      label: 'Ano',          obrigatorio: false },
    { campo: 'km_atual', label: 'KM Atual',     obrigatorio: false },
    { campo: 'renavam',  label: 'RENAVAM',      obrigatorio: false },
    { campo: 'chassi',   label: 'Chassi',       obrigatorio: false },
  ],
  motoristas: [
    { campo: 'nome',          label: 'Nome',           obrigatorio: true  },
    { campo: 'cpf',           label: 'CPF',            obrigatorio: true  },
    { campo: 'telefone',      label: 'Telefone',       obrigatorio: false },
    { campo: 'cnh_categoria', label: 'Categoria CNH',  obrigatorio: false },
    { campo: 'cnh_validade',  label: 'Validade CNH',   obrigatorio: false },
    { campo: 'tipo',          label: 'Vínculo',        obrigatorio: false },
  ],
  clientes: [
    { campo: 'razao_social', label: 'Razão Social', obrigatorio: true  },
    { campo: 'cnpj',         label: 'CNPJ',         obrigatorio: false },
    { campo: 'telefone',     label: 'Telefone',     obrigatorio: false },
    { campo: 'email',        label: 'E-mail',       obrigatorio: false },
    { campo: 'cidade',       label: 'Cidade',       obrigatorio: false },
    { campo: 'estado',       label: 'Estado',       obrigatorio: false },
  ],
}

const MODELOS: Record<Entidade, { nome: string; header: string; exemplo: string }> = {
  veiculos: {
    nome: 'modelo-veiculos.csv',
    header: 'Placa;Tipo;Marca;Modelo;Ano;KM Atual;RENAVAM;Chassi',
    exemplo: 'ABC-1234;Carreta;Scania;R450;2022;125000;;',
  },
  motoristas: {
    nome: 'modelo-motoristas.csv',
    header: 'Nome;CPF;Telefone;Categoria CNH;Validade CNH;Vínculo',
    exemplo: 'João da Silva;000.000.000-00;(31)99999-9999;E;31/12/2026;Próprio',
  },
  clientes: {
    nome: 'modelo-clientes.csv',
    header: 'Razão Social;CNPJ;Telefone;E-mail;Cidade;Estado',
    exemplo: 'Mineradora ABC Ltda;00.000.000/0001-00;(31)88888-8888;contato@abc.com.br;Betim;MG',
  },
}

const LABEL: Record<Entidade, string> = {
  veiculos: 'veículos', motoristas: 'motoristas', clientes: 'clientes',
}

// ─── Wizard ──────────────────────────────────────────────────────────────────

export function ImportacaoWizard({ entidade }: { entidade: Entidade }) {
  const [etapa,      setEtapa]      = useState<Etapa>('upload')
  const [linhas,     setLinhas]     = useState<Record<string, string>[]>([])
  const [headers,    setHeaders]    = useState<string[]>([])
  const [mapeamento, setMapeamento] = useState<Record<string, string>>({})
  const [resultado,  setResultado]  = useState<{ ok: number; erros: Array<{ linha: number; erro: string }> } | null>(null)
  const [extraindo,  setExtraindo]  = useState(false)

  const fileRef   = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const colunas = COLUNAS[entidade]
  const label   = LABEL[entidade]

  // ─── Processar arquivo Excel / CSV ─────────────────────────────────────────

  async function processarArquivo(arquivo: File) {
    try {
      const buffer = await arquivo.arrayBuffer()
      const wb     = XLSX.read(buffer, { type: 'array', cellDates: true })
      const ws     = wb.Sheets[wb.SheetNames[0]]
      const dados  = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '', raw: false })

      if (dados.length === 0) { alert('Planilha vazia ou sem dados.'); return }

      const hdrs = Object.keys(dados[0])
      setHeaders(hdrs)
      setLinhas(dados)
      setMapeamento(autoMapear(colunas, hdrs))
      setEtapa('mapeamento')
    } catch {
      alert('Não foi possível ler o arquivo. Verifique se é um Excel ou CSV válido.')
    }
  }

  // ─── Processar foto via Gemini ──────────────────────────────────────────────

  async function processarFoto(arquivo: File) {
    setExtraindo(true)
    try {
      const fd = new FormData()
      fd.append('arquivo', arquivo)
      fd.append('tipo', 'lista_' + entidade)

      const res  = await fetch('/api/ocr/lista', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Erro ao processar a foto.')
      if (!data.linhas?.length) throw new Error('Nenhum dado encontrado na imagem.')

      const hdrs = colunas.map(c => c.campo)
      setLinhas(data.linhas)
      setHeaders(hdrs)
      const autoMap: Record<string, string> = {}
      colunas.forEach(c => { autoMap[c.campo] = c.campo })
      setMapeamento(autoMap)
      setEtapa('preview')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Não foi possível extrair os dados da foto. Tente com melhor qualidade.')
    }
    setExtraindo(false)
  }

  function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.type.startsWith('image/')) processarFoto(f)
    else processarArquivo(f)
    e.target.value = ''
  }

  // ─── Download do modelo ────────────────────────────────────────────────────

  function baixarModelo() {
    const m    = MODELOS[entidade]
    const csv  = '﻿' + m.header + '\n' + m.exemplo
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a    = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob), download: m.nome,
    })
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(a.href)
  }

  // ─── Importar ──────────────────────────────────────────────────────────────

  async function importar() {
    setEtapa('importando')

    const linhasMapeadas = linhas.map(linha => {
      const obj: Record<string, string> = {}
      Object.entries(mapeamento).forEach(([campo, col]) => {
        if (col && linha[col] !== undefined) obj[campo] = String(linha[col])
      })
      return obj
    })

    try {
      const res  = await fetch('/api/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entidade, linhas: linhasMapeadas }),
      })
      const data = await res.json()
      setResultado(data)
    } catch {
      setResultado({ ok: 0, erros: [{ linha: 0, erro: 'Erro de conexão. Tente novamente.' }] })
    }
    setEtapa('resultado')
  }

  function reiniciar() {
    setEtapa('upload'); setLinhas([]); setHeaders([])
    setMapeamento({}); setResultado(null)
  }

  // ─── Etapa: upload ─────────────────────────────────────────────────────────

  if (etapa === 'upload') return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <button
          type="button"
          disabled={extraindo}
          onClick={() => cameraRef.current?.click()}
          className="flex flex-col items-center gap-2 p-5 border-2 border-dashed rounded-xl hover:border-brand transition-colors disabled:opacity-60"
        >
          {extraindo
            ? <Loader2 className="h-8 w-8 animate-spin text-ink-muted" />
            : <Camera className="h-8 w-8 text-ink-muted" />}
          <span className="text-sm font-medium">Foto da lista</span>
          <span className="text-xs text-ink-muted text-center">Fotografe uma lista impressa</span>
        </button>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center gap-2 p-5 border-2 border-dashed rounded-xl hover:border-brand transition-colors"
        >
          <FileUp className="h-8 w-8 text-ink-muted" />
          <span className="text-sm font-medium">Planilha Excel ou CSV</span>
          <span className="text-xs text-ink-muted">.xlsx · .xls · .csv</span>
        </button>

        <button
          type="button"
          onClick={baixarModelo}
          className="flex flex-col items-center gap-2 p-5 border-2 rounded-xl hover:bg-app-subtle transition-colors"
        >
          <Download className="h-8 w-8 text-ink-muted" />
          <span className="text-sm font-medium">Baixar modelo</span>
          <span className="text-xs text-ink-muted">CSV pronto para preencher</span>
        </button>
      </div>

      <p className="text-xs text-ink-muted text-center">
        Dica: use o modelo CSV para garantir que os dados sejam importados corretamente.
      </p>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment"
        className="hidden" onChange={handleArquivo} />
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.tsv"
        className="hidden" onChange={handleArquivo} />
    </div>
  )

  // ─── Etapa: mapeamento ────────────────────────────────────────────────────

  if (etapa === 'mapeamento') return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">{linhas.length} {label} encontrados</p>
        <span className="text-xs text-ink-muted">· Confirme o mapeamento das colunas</span>
      </div>

      <div className="space-y-2">
        {colunas.map(col => (
          <div key={col.campo} className="flex items-center gap-3">
            <div className="w-36 text-sm shrink-0">
              {col.label}
              {col.obrigatorio && <span className="text-red-500 ml-1">*</span>}
            </div>
            <select
              value={mapeamento[col.campo] ?? ''}
              onChange={e => setMapeamento(m => ({ ...m, [col.campo]: e.target.value }))}
              className="flex-1 border rounded px-2 py-1.5 text-sm bg-background"
            >
              <option value="">— não importar —</option>
              {headers.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => setEtapa('upload')}>Voltar</Button>
        <Button
          type="button"
          disabled={colunas.filter(c => c.obrigatorio).some(c => !mapeamento[c.campo])}
          onClick={() => setEtapa('preview')}
          className="bg-brand hover:bg-brand-dark text-white"
        >
          Visualizar <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )

  // ─── Etapa: preview ───────────────────────────────────────────────────────

  if (etapa === 'preview') {
    const colsVisiveis = colunas.filter(c => mapeamento[c.campo])
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium">
          Prévia — {linhas.length} {label} serão importados
        </p>

        <div className="overflow-x-auto rounded-lg border max-h-64">
          <table className="w-full text-xs min-w-[400px]">
            <thead className="bg-app-subtle sticky top-0">
              <tr>
                {colsVisiveis.map(c => (
                  <th key={c.campo} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.slice(0, 20).map((linha, i) => (
                <tr key={i} className="border-t hover:bg-app-subtle/40">
                  {colsVisiveis.map(c => (
                    <td key={c.campo} className="px-3 py-1.5 text-ink-secondary whitespace-nowrap">
                      {linha[mapeamento[c.campo]] || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {linhas.length > 20 && (
          <p className="text-xs text-ink-muted text-center">
            Mostrando 20 de {linhas.length} linhas
          </p>
        )}

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setEtapa('mapeamento')}>
            Voltar
          </Button>
          <Button type="button" onClick={importar} className="bg-brand hover:bg-brand-dark text-white">
            Importar {linhas.length} {label}
          </Button>
        </div>
      </div>
    )
  }

  // ─── Etapa: importando ────────────────────────────────────────────────────

  if (etapa === 'importando') return (
    <div className="flex flex-col items-center gap-4 py-10">
      <Loader2 className="h-10 w-10 animate-spin text-brand" />
      <p className="text-sm font-medium">Importando {label}…</p>
      <p className="text-xs text-ink-muted">Isso pode levar alguns segundos.</p>
    </div>
  )

  // ─── Etapa: resultado ─────────────────────────────────────────────────────

  if (etapa === 'resultado' && resultado) return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-accent-surface border border-accent-border rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <CheckCircle2 className="h-5 w-5 text-accent" />
            <span className="text-3xl font-display font-bold text-accent">{resultado.ok}</span>
          </div>
          <div className="text-sm text-accent">Importados com sucesso</div>
        </div>
        <div className={`border rounded-xl p-4 text-center ${resultado.erros.length > 0 ? 'bg-red-50 border-red-200' : 'bg-app-subtle border-stone-200'}`}>
          <div className="flex items-center justify-center gap-2 mb-1">
            {resultado.erros.length > 0 && <AlertCircle className="h-5 w-5 text-red-600" />}
            <span className={`text-3xl font-display font-bold ${resultado.erros.length > 0 ? 'text-red-600' : 'text-ink-muted'}`}>
              {resultado.erros.length}
            </span>
          </div>
          <div className="text-sm text-ink-muted">Com erro</div>
        </div>
      </div>

      {resultado.erros.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <div className="bg-red-50 px-4 py-2 border-b">
            <p className="text-sm font-medium text-red-800">Linhas com erro — corrija e reimporte:</p>
          </div>
          <div className="max-h-48 overflow-y-auto divide-y">
            {resultado.erros.map((e, i) => (
              <div key={i} className="px-4 py-2 text-sm flex gap-3">
                <span className="font-mono text-ink-muted w-16 shrink-0">
                  {e.linha > 0 ? `Linha ${e.linha}` : 'Geral'}
                </span>
                <span className="text-red-700">{e.erro}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button type="button" variant="outline" className="w-full" onClick={reiniciar}>
        Nova importação
      </Button>
    </div>
  )

  return null
}

// ─── Helper: auto-mapear colunas ──────────────────────────────────────────────

function autoMapear(colunas: ColDef[], headers: string[]): Record<string, string> {
  const mapa: Record<string, string> = {}
  colunas.forEach(col => {
    const colNorm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
    const match = headers.find(h =>
      colNorm(h) === colNorm(col.label) ||
      colNorm(h) === colNorm(col.campo) ||
      colNorm(h).includes(colNorm(col.campo))
    )
    if (match) mapa[col.campo] = match
  })
  return mapa
}
