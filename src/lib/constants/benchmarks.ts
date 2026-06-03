export const BENCHMARK_CUSTO_KM = {
  leve:         { min: 1.5, medio: 2.2, max: 3.0, unidade: 'R$/km' },
  medio:        { min: 2.0, medio: 3.0, max: 4.0, unidade: 'R$/km' },
  pesado:       { min: 2.5, medio: 3.8, max: 5.5, unidade: 'R$/km' },
  extra_pesado: { min: 3.5, medio: 5.0, max: 7.0, unidade: 'R$/km' },
} as const

export const LABEL_CATEGORIA = {
  leve:         'Leve (até 3,5t)',
  medio:        'Médio (3,5t – 10t)',
  pesado:       'Pesado (10t – 25t)',
  extra_pesado: 'Extra pesado (acima de 25t)',
} as const

export type CategoriaVeiculo = keyof typeof BENCHMARK_CUSTO_KM

export const BENCHMARK_DISCLAIMER =
  'Referência de mercado estimada. Valores reais variam conforme rota, carga, perfil do motorista e condições do veículo.'

export function getZonaBenchmark(
  valor: number,
  categoria: CategoriaVeiculo,
): 'economico' | 'na_media' | 'acima' {
  const bench = BENCHMARK_CUSTO_KM[categoria]
  if (valor <= bench.medio) return 'economico'
  if (valor <= bench.max)   return 'na_media'
  return 'acima'
}
