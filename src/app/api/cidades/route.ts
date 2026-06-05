import { NextResponse } from 'next/server'
import { getCidades, filtrarCidades } from '@/lib/ibge/cidades'

export const revalidate = 3600

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''

  if (!q || q.length < 3) {
    return NextResponse.json([])
  }

  const cidades = await getCidades()
  const resultados = filtrarCidades(cidades, q)
  return NextResponse.json(resultados)
}
