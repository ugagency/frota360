import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const OSRM = 'http://router.project-osrm.org/route/v1/driving'
const NOMINATIM = 'https://nominatim.openstreetmap.org/search'

// Custo/km benchmark (R$) por categoria de veículo
const BENCHMARK_KM: Record<string, number> = {
  leve:         2.20,
  medio:        3.00,
  pesado:       3.80,
  extra_pesado: 5.00,
}

// ─── Geocoding ────────────────────────────────────────────────────────────────

async function geocodificar(cidade: string): Promise<[number, number] | null> {
  const slash = cidade.lastIndexOf('/')
  if (slash === -1) return null
  const nome = cidade.slice(0, slash).trim()
  const uf   = cidade.slice(slash + 1).trim()
  if (!nome || !uf) return null

  try {
    const url = `${NOMINATIM}?city=${encodeURIComponent(nome)}&state=${encodeURIComponent(uf)}&country=Brazil&format=json&limit=1&countrycodes=br`
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

// ─── OSRM ─────────────────────────────────────────────────────────────────────

async function calcularOSRM(
  pontos: Array<[number, number]>,
): Promise<{ distancia_km: number; duracao_min: number } | null> {
  const coords = pontos.map(([lat, lon]) => `${lon},${lat}`).join(';')
  try {
    const res = await fetch(`${OSRM}/${coords}?overview=false&steps=false`, {
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.code !== 'Ok' || !data.routes?.[0]) return null
    return {
      distancia_km: Math.round(data.routes[0].distance / 1000),
      duracao_min:  Math.round(data.routes[0].duration  / 60),
    }
  } catch {
    return null
  }
}

// ─── Haversine fallback ───────────────────────────────────────────────────────

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

// ─── Formatação de duração ────────────────────────────────────────────────────

function formatarDuracao(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

// ─── Custo estimado ───────────────────────────────────────────────────────────

async function calcularCusto(veiculoId: string | undefined, distanciaKm: number) {
  let custoPorKm = BENCHMARK_KM.pesado
  let fonteCusto: 'historico_veiculo' | 'benchmark' = 'benchmark'

  if (veiculoId) {
    try {
      const supabase = createClient()
      const tresM = new Date()
      tresM.setMonth(tresM.getMonth() - 3)
      const tresMAgo = tresM.toISOString().split('T')[0]

      const [{ data: lancamentos }, { data: viagens }] = await Promise.all([
        supabase
          .from('lancamentos_financeiros')
          .select('valor')
          .eq('veiculo_id', veiculoId)
          .eq('tipo', 'despesa')
          .gte('data', tresMAgo),
        supabase
          .from('viagens')
          .select('km_saida, km_chegada')
          .eq('veiculo_id', veiculoId)
          .eq('status', 'concluida')
          .gte('data_saida', tresMAgo)
          .not('km_chegada', 'is', null),
      ])

      const totalDespesas = (lancamentos ?? []).reduce(
        (s, l) => s + Number((l as Record<string, unknown>).valor), 0,
      )
      const totalKm = (viagens ?? []).reduce(
        (s, v) => {
          const vv = v as Record<string, unknown>
          return s + (Number(vv.km_chegada) - Number(vv.km_saida))
        }, 0,
      )

      if (totalKm > 500 && totalDespesas > 0) {
        custoPorKm = totalDespesas / totalKm
        fonteCusto = 'historico_veiculo'
      }
    } catch { /* usa benchmark */ }
  }

  return {
    custo_total_estimado: Math.round(custoPorKm * distanciaKm * 100) / 100,
    custo_por_km:         Math.round(custoPorKm * 100) / 100,
    fonte: fonteCusto,
    aviso: 'Custo estimado. Valor real depende de combustível, pedágios e condições da viagem.',
  }
}

// ─── Handler POST ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

  const { origem, destinos, veiculo_id } = body as {
    origem: string
    destinos: string[]
    veiculo_id?: string
  }

  if (!origem || !Array.isArray(destinos) || destinos.length === 0) {
    return NextResponse.json({ error: 'origem e destinos são obrigatórios' }, { status: 400 })
  }

  // Geocodificar em paralelo
  const [coordOrigem, ...coordsDestinos] = await Promise.all([
    geocodificar(origem),
    ...destinos.map(geocodificar),
  ])

  if (!coordOrigem) {
    return NextResponse.json({ error: `Cidade não encontrada: ${origem}` }, { status: 422 })
  }

  const coordsValidas = coordsDestinos.filter(Boolean) as Array<[number, number]>
  if (!coordsValidas.length) {
    return NextResponse.json({ error: 'Nenhum destino pôde ser geocodificado' }, { status: 422 })
  }

  // Tentar rota OSRM
  const osrm = await calcularOSRM([coordOrigem, ...coordsValidas])

  let distancia_km: number
  let duracao_min: number
  let fonte: 'osrm' | 'estimativa_linear'
  let aviso: string | undefined

  if (osrm) {
    distancia_km = osrm.distancia_km
    duracao_min  = osrm.duracao_min
    fonte        = 'osrm'
  } else {
    // Haversine × 1.35 (fator de tortuosidade BR)
    const ultimo = coordsValidas[coordsValidas.length - 1]
    const reta   = haversine(coordOrigem[0], coordOrigem[1], ultimo[0], ultimo[1])
    distancia_km = Math.round(reta * 1.35)
    duracao_min  = Math.round((distancia_km / 70) * 60)
    fonte        = 'estimativa_linear'
    aviso        = 'Rota calculada por estimativa (OSRM indisponível). Pode variar ±15%.'
  }

  const custo = await calcularCusto(veiculo_id, distancia_km)

  return NextResponse.json({
    distancia_km,
    duracao_min,
    duracao_formatada: formatarDuracao(duracao_min),
    fonte,
    ...(aviso && { aviso }),
    custo,
  })
}
