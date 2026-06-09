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
  } | null
}

export interface CidadeOption {
  value: string
  label: string
  municipio: string
  estado: string
  ibgeId: number
}

let cidadesCache: CidadeOption[] | null = null
let carregandoPromise: Promise<CidadeOption[]> | null = null

export async function getCidades(): Promise<CidadeOption[]> {
  if (cidadesCache) return cidadesCache
  if (carregandoPromise) return carregandoPromise

  carregandoPromise = fetch(
    'https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome',
  )
    .then(r => r.json() as Promise<MunicipioIBGEApi[]>)
    .then(data => {
      cidadesCache = data
        .filter(m => m.microrregiao?.mesorregiao?.UF?.sigla)
        .map(m => ({
          value: m.nome + '/' + m.microrregiao!.mesorregiao.UF.sigla,
          label: m.nome + ' - ' + m.microrregiao!.mesorregiao.UF.sigla,
          municipio: m.nome,
          estado: m.microrregiao!.mesorregiao.UF.sigla,
          ibgeId: m.id,
        }))
      carregandoPromise = null
      return cidadesCache
    })
    .catch(err => {
      carregandoPromise = null
      throw err
    })

  return carregandoPromise
}

function removerAcentos(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function filtrarCidades(cidades: CidadeOption[], query: string): CidadeOption[] {
  if (!query || query.length < 2) return []
  const q = removerAcentos(query)
  const starts = cidades.filter(c => removerAcentos(c.municipio).startsWith(q))
  if (starts.length >= 5) return starts.slice(0, 10)
  const seen = new Set(starts.map(c => c.ibgeId))
  const contains = cidades.filter(c =>
    !seen.has(c.ibgeId) && removerAcentos(c.municipio).includes(q),
  )
  return [...starts, ...contains].slice(0, 10)
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