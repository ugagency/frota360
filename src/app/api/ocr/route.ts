import 'server-only'
import { NextRequest, NextResponse } from 'next/server'

const MIME_PERMITIDOS = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'application/pdf',
])
const MAX_BYTES = 20 * 1024 * 1024

type TipoOCR = 'cnh' | 'crlv' | 'nf' | 'documento'

const PROMPTS: Record<TipoOCR, string> = {
  crlv: `Analise esta imagem de CRLV (Certificado de Registro e Licenciamento de Veículo) brasileiro.
Extraia os dados e retorne SOMENTE um JSON válido com estes campos (null para não encontrados):
{"placa":"","chassi":"","renavam":"","marca":"","modelo":"","ano_fabricacao":0,"ano_modelo":0,"cor":"","tipo":"","combustivel":"","proprietario":""}
Sem texto fora do JSON.`,

  cnh: `Analise esta imagem de CNH (Carteira Nacional de Habilitação) brasileira.
Extraia os dados e retorne SOMENTE um JSON válido com estes campos (null para não encontrados):
{"nome":"","cpf":"","data_nascimento":"DD/MM/YYYY","cnh_numero":"","cnh_categoria":"","cnh_validade":"YYYY-MM-DD","cnh_primeira_habilitacao":"YYYY-MM-DD"}
cnh_categoria deve ser a letra(s) da categoria (ex: B, C, D, E, AB, AC, AD, AE).
cnh_validade e cnh_primeira_habilitacao devem estar no formato YYYY-MM-DD.
Sem texto fora do JSON.`,

  nf: `Analise este documento fiscal (Nota Fiscal ou DANFE) brasileiro.
Extraia os dados e retorne SOMENTE um JSON válido com estes campos (null para não encontrados):
{"numero_nf":"","serie":"","chave_acesso":"","data_emissao":"YYYY-MM-DD","razao_social_emitente":"","cnpj_emitente":"","razao_social_destinatario":"","valor_total":0.0,"peso_bruto":0.0,"descricao_carga":""}
chave_acesso deve ter 44 dígitos numéricos sem espaços ou pontos.
peso_bruto deve estar em kg (número).
Sem texto fora do JSON.`,

  documento: `Analise este documento e extraia os dados mais relevantes.
Retorne SOMENTE um JSON válido com os campos encontrados. Sem texto fora do JSON.`,
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const arquivo = formData.get('arquivo') as File | null
    const tipo = (formData.get('tipo') as string | null) ?? 'documento'

    if (!arquivo) {
      return NextResponse.json({ ok: false, error: 'Nenhum arquivo enviado.' }, { status: 400 })
    }

    const mime = arquivo.type || 'application/octet-stream'
    if (!MIME_PERMITIDOS.has(mime)) {
      return NextResponse.json(
        { ok: false, error: 'Tipo não suportado. Use JPEG, PNG, WEBP, HEIC ou PDF.' },
        { status: 400 },
      )
    }

    if (arquivo.size > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: 'Arquivo muito grande. Máximo 20 MB.' },
        { status: 400 },
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'Chave da API não configurada.' }, { status: 500 })
    }

    const ab = await arquivo.arrayBuffer()
    const base64 = Buffer.from(ab).toString('base64')
    const prompt = PROMPTS[tipo as TipoOCR] ?? PROMPTS.documento

    const geminiBody = {
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: mime, data: base64 } },
          { text: prompt },
        ],
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
    }

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody),
      },
    )

    if (!resp.ok) {
      const errText = await resp.text()
      console.error('[OCR] Gemini error:', errText)
      if (resp.status === 503 || resp.status === 429) {
        return NextResponse.json(
          { ok: false, error: 'Serviço sobrecarregado. Aguarde alguns segundos e tente novamente.' },
          { status: 503 },
        )
      }
      return NextResponse.json({ ok: false, error: 'Erro ao processar documento.' }, { status: 500 })
    }

    const json = await resp.json()
    const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()

    let dados: Record<string, unknown>
    try {
      dados = JSON.parse(clean)
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Não foi possível extrair dados do documento.' },
        { status: 422 },
      )
    }

    return NextResponse.json({ ok: true, dados })
  } catch (err) {
    console.error('[OCR] Unexpected error:', err)
    return NextResponse.json({ ok: false, error: 'Erro interno.' }, { status: 500 })
  }
}
