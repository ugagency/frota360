import { NextResponse } from 'next/server'
import { calcularDistanciaKm } from '@/lib/ibge/cidades'

async function getCoordenadas(cidadeValue: string): Promise<[number, number] | null> {
  const slash = cidadeValue.lastIndexOf('/')
  if (slash === -1) return null
  const nome = cidadeValue.slice(0, slash).trim()
  const uf = cidadeValue.slice(slash + 1).trim()
  if (!nome || !uf) return null

  try {
    const url = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(nome)}&state=${encodeURIComponent(uf)}&country=Brazil&format=json&limit=1`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Frota360/1.0 (sistema de gestao de frotas)' },
      next: { revalidate: 604800 }, // 7 dias de cache por cidade
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.[0]?.lat) return null
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q1 = searchParams.get('q1') ?? ''
  const q2 = searchParams.get('q2') ?? ''

  if (!q1 || !q2) return NextResponse.json({ km: null })

  const [c1, c2] = await Promise.all([getCoordenadas(q1), getCoordenadas(q2)])
  if (!c1 || !c2) return NextResponse.json({ km: null })

  const km = calcularDistanciaKm(c1[0], c1[1], c2[0], c2[1])
  return NextResponse.json({ km })
}
