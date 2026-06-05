interface MunicipioIBGEApi {
  id: number
  nome: string
  microrregiao: {
    mesorregiao: {
      UF: {
        id: number
        sigla: string
        nome: string
        regiao: { sigla: string }
      }
    }
  }
}

export interface CidadeOption {
  value: string       // "São Paulo/SP"
  label: string       // "São Paulo - SP"
  municipio: string   // "São Paulo"
  estado: string      // "SP"
  ibgeId: number
}

let cidadesCache: CidadeOption[] | null = null
let carregandoPromise: Promise<CidadeOption[]> | null = null

export async function getCidades(): Promise<CidadeOption[]> {
  if (cidadesCache) return cidadesCache
  if (carregandoPromise) return carregandoPromise

  carregandoPromise = fetch(
    'https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome',
    { next: { revalidate: 86400 } },
  )
    .then(r => r.json() as Promise<MunicipioIBGEApi[]>)
    .then(data => {
      cidadesCache = data.map(m => ({
        value: `${m.nome}/${m.microrregiao.mesorregiao.UF.sigla}`,
        label: `${m.nome} - ${m.microrregiao.mesorregiao.UF.sigla}`,
        municipio: m.nome,
        estado: m.microrregiao.mesorregiao.UF.sigla,
        ibgeId: m.id,
      }))
      carregandoPromise = null
      return cidadesCache
    })

  return carregandoPromise
}

export function filtrarCidades(cidades: CidadeOption[], query: string): CidadeOption[] {
  if (!query || query.length < 2) return []
  const q = query.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  return cidades
    .filter(c => {
      const nome = c.municipio.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      return nome.startsWith(q)
    })
    .slice(0, 10)
}

export function calcularDistanciaKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}
