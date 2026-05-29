'use client'

import { Fragment } from 'react'

// Parser simples de markdown → JSX.
// Suporta: parágrafos, **bold**, *itálico*, listas (- ou *), tabelas (linhas com |).
// Marca placas e valores em R$ com font-mono.

type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'table'; rows: string[][] }
  | { type: 'heading'; level: number; text: string }
  | { type: 'blank' }

function parseBlocks(input: string): Block[] {
  const lines = input.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      blocks.push({ type: 'blank' })
      i++; continue
    }

    // Heading: # ou ## ou ###
    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed)
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] })
      i++; continue
    }

    // Tabela: linhas começando com |
    if (trimmed.startsWith('|')) {
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = lines[i].split('|').slice(1, -1).map((c) => c.trim())
        // pula separador (| --- | --- |)
        if (!cells.every((c) => /^[:\-\s]*$/.test(c))) rows.push(cells)
        i++
      }
      if (rows.length > 0) blocks.push({ type: 'table', rows })
      continue
    }

    // Lista: linhas começando com - ou *
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''))
        i++
      }
      blocks.push({ type: 'list', items })
      continue
    }

    // Parágrafo: acumula até linha em branco / bloco novo
    const buf: string[] = [line]
    i++
    while (i < lines.length) {
      const t = lines[i].trim()
      if (!t || t.startsWith('|') || /^[-*]\s+/.test(t) || /^#{1,3}\s+/.test(t)) break
      buf.push(lines[i])
      i++
    }
    blocks.push({ type: 'paragraph', text: buf.join(' ').replace(/\s+/g, ' ').trim() })
  }

  return blocks
}

// ---------------------------------------------------------------------
// Inline tokens: **bold**, *italic*, R$ XX, placas
// ---------------------------------------------------------------------
const TOKEN_REGEX = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|R\$\s*[\d.,]+|\b[A-Z]{3}-?\d[A-Z0-9]\d{2}\b|\b[A-Z]{3}-?\d{4}\b)/g

function renderInline(text: string, baseKey: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let idx = 0
  let match: RegExpExecArray | null

  TOKEN_REGEX.lastIndex = 0
  while ((match = TOKEN_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const token = match[0]
    const k = `${baseKey}-${idx++}`

    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={k} className="font-semibold text-ink">{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(<em key={k}>{token.slice(1, -1)}</em>)
    } else if (/^R\$/.test(token)) {
      parts.push(<code key={k} className="font-mono text-brand-dark not-italic">{token}</code>)
    } else {
      // placa
      parts.push(<code key={k} className="font-mono text-brand-dark not-italic">{token}</code>)
    }

    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return <>{parts.map((p, i) => <Fragment key={`f-${baseKey}-${i}`}>{p}</Fragment>)}</>
}

// ---------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------
export function FormatResponse({ text }: { text: string }) {
  const blocks = parseBlocks(text)

  return (
    <div className="text-sm leading-relaxed space-y-2">
      {blocks.map((b, i) => {
        if (b.type === 'blank') return null
        if (b.type === 'heading') {
          const sizes = ['text-base font-display font-semibold',
                         'text-sm font-display font-semibold uppercase tracking-wider text-ink-muted',
                         'text-xs font-mono uppercase tracking-wider text-ink-muted']
          const cls = sizes[b.level - 1] ?? sizes[2]
          return <div key={i} className={cls}>{renderInline(b.text, `h-${i}`)}</div>
        }
        if (b.type === 'paragraph') {
          return <p key={i} className="text-ink">{renderInline(b.text, `p-${i}`)}</p>
        }
        if (b.type === 'list') {
          return (
            <ul key={i} className="list-disc list-inside space-y-0.5 text-ink">
              {b.items.map((it, j) => (
                <li key={j}>{renderInline(it, `l-${i}-${j}`)}</li>
              ))}
            </ul>
          )
        }
        if (b.type === 'table') {
          const [head, ...body] = b.rows
          return (
            <div key={i} className="overflow-x-auto -mx-1">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200">
                    {head.map((c, j) => (
                      <th key={j} className="text-left px-2 py-1.5 font-mono font-medium text-ink-muted uppercase text-[10px] tracking-wider">
                        {renderInline(c, `th-${i}-${j}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {body.map((row, ri) => (
                    <tr key={ri} className="border-b border-stone-100 last:border-0">
                      {row.map((c, ci) => (
                        <td key={ci} className="px-2 py-1.5 align-top">{renderInline(c, `td-${i}-${ri}-${ci}`)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        return null
      })}
    </div>
  )
}
