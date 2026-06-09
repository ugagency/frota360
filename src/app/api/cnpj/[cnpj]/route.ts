import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { cnpj: string } }) {
  const cnpj = params.cnpj.replace(/\D/g, '')

  if (cnpj.length !== 14) {
    return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 })
  }

  // BrasilAPI (primário)
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      headers: { 'User-Agent': 'Frota360/1.0' },
      signal: AbortSignal.timeout(8000),
    })
    if (res.ok) {
      const data = await res.json()
      return NextResponse.json({
        razao_social: data.razao_social,
        nome_fantasia: data.nome_fantasia,
        municipio: data.municipio,
        uf: data.uf,
        telefone: data.ddd_telefone_1,
        situacao: data.descricao_situacao_cadastral,
        fonte: 'brasilapi',
      })
    }
  } catch { /* fallback abaixo */ }

  // ReceitaWS (fallback)
  try {
    const res = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`, {
      headers: { 'User-Agent': 'Frota360/1.0' },
      signal: AbortSignal.timeout(8000),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.status === 'ERROR') throw new Error(data.message)
      return NextResponse.json({
        razao_social: data.nome,
        nome_fantasia: data.fantasia,
        municipio: data.municipio,
        uf: data.uf,
        telefone: data.telefone,
        situacao: data.situacao,
        fonte: 'receitaws',
      })
    }
  } catch { /* ambos falharam */ }

  return NextResponse.json(
    { error: 'Não foi possível consultar o CNPJ no momento.' },
    { status: 503 },
  )
}
