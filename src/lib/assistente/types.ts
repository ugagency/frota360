// Tipos compartilhados pelo módulo do Assistente

export type ChatRole = 'user' | 'model'

export type ChatMessage = {
  role: ChatRole
  content: string
  created_at?: string
}

export type Conversa = {
  id: string
  titulo: string | null
  updated_at: string
  mensagens: ChatMessage[]
}

// Estrutura do conteúdo enviado/recebido da API Gemini
export type GeminiPart =
  | { text: string }
  | { functionCall: { name: string; args: Record<string, unknown> } }
  | { functionResponse: { name: string; response: Record<string, unknown> } }

export type GeminiContent = {
  role: 'user' | 'model'
  parts: GeminiPart[]
}

export type GeminiResponse = {
  candidates?: Array<{
    content?: { role?: string; parts?: GeminiPart[] }
    finishReason?: string
  }>
  usageMetadata?: {
    promptTokenCount?: number
    candidatesTokenCount?: number
  }
  error?: { message?: string; code?: number }
}
