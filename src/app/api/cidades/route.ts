import { NextResponse } from 'next/server'
import { getCidades, filtrarCidades } from '@/lib/ibge/cidades'

export const revalidate = 3600

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''

  if (!q || q.length < 2) {
    return NextResponse.json([])
  }

  try {
    const cidades = await getCidades()
    const resultados = filtrarCidades(cidades, q)
    return NextResponse.json(resultados)
  } catch (err) {
    console.error('[/api/cidades] erro ao buscar cidades:', err)
    return NextResponse.json([], { status: 200 }) // retorna vazio em vez de 500
  }
}
