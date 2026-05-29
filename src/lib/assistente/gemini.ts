import 'server-only'
import { functionDeclarations } from './tools'
import type { GeminiContent, GeminiPart, GeminiResponse } from './types'

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
const TIMEOUT_MS = 30_000
const MAX_TOOL_CYCLES = 3

export type ChamarGeminiResult = {
  texto: string
  funcoesChamadas: string[]
  tokensPrompt?: number
  tokensResposta?: number
}

export class AssistenteError extends Error {
  constructor(public userMessage: string, public original?: unknown) {
    super(userMessage)
  }
}

async function geminiOnce(
  systemInstruction: string,
  contents: GeminiContent[],
): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new AssistenteError('Assistente não configurado — falta GEMINI_API_KEY.')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(`${API_BASE}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
        tools: [{ function_declarations: functionDeclarations }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
          topP: 0.8,
        },
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      if (res.status === 429) throw new AssistenteError('O assistente está sobrecarregado. Tente novamente em alguns segundos.')
      if (res.status >= 500) throw new AssistenteError('Erro temporário no assistente. Tente novamente.')
      console.error('Gemini API error', res.status, body)
      throw new AssistenteError('Falha ao consultar o assistente.')
    }

    return await res.json()
  } catch (e) {
    if (e instanceof AssistenteError) throw e
    if (e instanceof Error && e.name === 'AbortError') {
      throw new AssistenteError('A consulta demorou demais. Tente uma pergunta mais específica.')
    }
    console.error('Gemini fetch error', e)
    throw new AssistenteError('Falha ao consultar o assistente.', e)
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Loop de tool use: chama Gemini, executa functionCall, devolve resposta, até obter texto.
 * Limita a MAX_TOOL_CYCLES iterações para evitar loops infinitos.
 */
export async function chamarGemini(
  systemInstruction: string,
  contents: GeminiContent[],
  executar: (name: string, args: Record<string, unknown>) => Promise<Record<string, unknown>>,
): Promise<ChamarGeminiResult> {
  const trabalho: GeminiContent[] = [...contents]
  const funcoesChamadas: string[] = []
  let tokensPrompt = 0
  let tokensResposta = 0

  for (let i = 0; i < MAX_TOOL_CYCLES + 1; i++) {
    const resp = await geminiOnce(systemInstruction, trabalho)

    tokensPrompt   += resp.usageMetadata?.promptTokenCount ?? 0
    tokensResposta += resp.usageMetadata?.candidatesTokenCount ?? 0

    const cand = resp.candidates?.[0]
    const parts = cand?.content?.parts ?? []

    // Coleta functionCalls (Gemini pode mandar várias em uma tacada)
    const calls = parts.filter((p): p is Extract<GeminiPart, { functionCall: any }> =>
      'functionCall' in p && !!p.functionCall,
    )
    const textos = parts.filter((p): p is { text: string } => 'text' in p && !!p.text)

    if (calls.length === 0) {
      // Resposta final em texto
      const texto = textos.map((t) => t.text).join('\n').trim()
        || 'Desculpe, não consegui formular uma resposta. Tente reformular a pergunta.'
      return { texto, funcoesChamadas, tokensPrompt, tokensResposta }
    }

    if (i === MAX_TOOL_CYCLES) {
      // Excedeu ciclos — devolve aviso
      return {
        texto: 'A consulta ficou complexa demais. Tente refazer com uma pergunta mais direta.',
        funcoesChamadas, tokensPrompt, tokensResposta,
      }
    }

    // Empurra os functionCalls no histórico (role model)
    trabalho.push({
      role: 'model',
      parts: calls.map((c) => ({ functionCall: c.functionCall })),
    })

    // Executa cada call e empurra functionResponses (role user)
    const responses = await Promise.all(
      calls.map(async (c) => {
        funcoesChamadas.push(c.functionCall.name)
        const result = await executar(c.functionCall.name, c.functionCall.args ?? {})
        return { functionResponse: { name: c.functionCall.name, response: result } }
      }),
    )
    trabalho.push({ role: 'user', parts: responses })
  }

  return { texto: 'Falha inesperada no assistente.', funcoesChamadas, tokensPrompt, tokensResposta }
}
