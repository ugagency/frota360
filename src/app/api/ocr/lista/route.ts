import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_BYTES = 20 * 1024 * 1024
const MIME_PERMITIDOS = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic',
])

type TipoLista = 'lista_veiculos' | 'lista_motoristas' | 'lista_clientes'

const PROMPTS: Record<TipoLista, string> = {
  lista_veiculos: `Analise esta imagem que contém uma lista de veículos/caminhões.
Extraia TODOS os veículos visíveis e retorne APENAS um JSON com esta estrutura exata:
{"linhas":[{"placa":"","marca":"","modelo":"","ano":"","km_atual":"","tipo":""}]}
Se um campo não estiver visível, use string vazia "". Retorne APENAS o JSON, sem markdown.`,

  lista_motoristas: `Analise esta imagem que contém uma lista de motoristas.
Extraia TODOS os motoristas visíveis e retorne APENAS um JSON com esta estrutura exata:
{"linhas":[{"nome":"","cpf":"","telefone":"","cnh_categoria":"","cnh_validade":""}]}
Se um campo não estiver visível, use string vazia "". Retorne APENAS o JSON, sem markdown.`,

  lista_clientes: `Analise esta imagem que contém uma lista de empresas ou clientes.
Extraia TODOS os itens visíveis e retorne APENAS um JSON com esta estrutura exata:
{"linhas":[{"razao_social":"","cnpj":"","telefone":"","email":"","cidade":"","estado":""}]}
Se um campo não estiver visível, use string vazia "". Retorne APENAS o JSON, sem markdown.`,
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'Chave da API não configurada.' }, { status: 500 })
  }

  const formData = await req.formData()
  const arquivo  = formData.get('arquivo') as File | null
  const tipo     = (formData.get('tipo') as string | null) ?? 'lista_veiculos'

  if (!arquivo) {
    return NextResponse.json({ ok: false, error: 'Nenhum arquivo enviado.' }, { status: 400 })
  }

  const mime = arquivo.type || 'application/octet-stream'
  if (!MIME_PERMITIDOS.has(mime)) {
    return NextResponse.json(
      { ok: false, error: 'Use uma foto (JPEG, PNG, WEBP ou HEIC).' },
      { status: 400 },
    )
  }

  if (arquivo.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: 'Foto muito grande. Máximo 20 MB.' }, { status: 400 })
  }

  const ab     = await arquivo.arrayBuffer()
  const base64 = Buffer.from(ab).toString('base64')
  const prompt = PROMPTS[tipo as TipoLista] ?? PROMPTS.lista_veiculos

  const geminiBody = {
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: mime, data: base64 } },
        { text: prompt },
      ],
    }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
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
    const txt = await resp.text()
    console.error('[OCR lista] Gemini error:', txt)
    if (resp.status === 503 || resp.status === 429) {
      return NextResponse.json(
        { ok: false, error: 'Serviço sobrecarregado. Aguarde alguns segundos e tente novamente.' },
        { status: 503 },
      )
    }
    return NextResponse.json({ ok: false, error: 'Erro ao processar a foto.' }, { status: 500 })
  }

  const json = await resp.json()
  const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()

  try {
    const dados = JSON.parse(clean)
    const linhas = Array.isArray(dados.linhas) ? dados.linhas : []
    return NextResponse.json({ ok: true, linhas })
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Não foi possível extrair a lista da foto.' },
      { status: 422 },
    )
  }
}
