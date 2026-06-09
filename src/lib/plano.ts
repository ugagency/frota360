export type Plano = 'demo' | 'basico' | 'profissional'

export interface TransportadoraPlano {
  plano: Plano
  plano_status: string
  plano_inicio: string | null
  plano_validade: string | null
}

export function planoAtivo(t: TransportadoraPlano): boolean {
  if (t.plano_status === 'cancelado' || t.plano_status === 'inadimplente') return false
  if (t.plano !== 'demo') return true
  if (!t.plano_validade) return true
  return new Date(t.plano_validade) >= new Date()
}

export function demoExpirado(t: TransportadoraPlano): boolean {
  if (t.plano !== 'demo') return false
  if (!t.plano_validade) return false
  return new Date(t.plano_validade) < new Date()
}

export function diasRestantesDemo(t: TransportadoraPlano): number | null {
  if (t.plano !== 'demo' || !t.plano_validade) return null
  const diff = new Date(t.plano_validade).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// Módulos por plano
const MODULOS_DEMO      = new Set(['frota', 'motoristas', 'viagens', 'configuracoes', 'alertas', 'admin'])
const MODULOS_BASICO    = new Set([...MODULOS_DEMO, 'manutencao'])
const MODULOS_PRO       = new Set([...MODULOS_BASICO, 'financeiro', 'relatorios', 'assistente', 'checklists'])

export function moduloDisponivel(plano: Plano, modulo: string): boolean {
  switch (plano) {
    case 'demo':         return MODULOS_DEMO.has(modulo)
    case 'basico':       return MODULOS_BASICO.has(modulo)
    case 'profissional': return MODULOS_PRO.has(modulo)
  }
}

export function limites(plano: Plano) {
  switch (plano) {
    case 'demo':         return { veiculos: 5,  usuarios: 1 }
    case 'basico':       return { veiculos: 20, usuarios: 2 }
    case 'profissional': return { veiculos: Infinity, usuarios: Infinity }
  }
}

export const FEATURES_PRO = [
  'seguro_alerta',
  'benchmark_custo_km',
  'campos_fiscais_viagem',
  'relatorio_contador',
  'checklist_foto',
  'importacao_planilha',
] as const

export type FeaturePro = typeof FEATURES_PRO[number]

export function featureDisponivel(plano: Plano, feature: FeaturePro): boolean {
  return plano === 'profissional'
}

// Qual módulo cada rota pertence
export const MODULO_POR_HREF: Record<string, string> = {
  '/':             'dashboard',
  '/frota':        'frota',
  '/motoristas':   'motoristas',
  '/viagens':      'viagens',
  '/manutencao':   'manutencao',
  '/financeiro':   'financeiro',
  '/relatorios':   'relatorios',
  '/assistente':   'assistente',
  '/configuracoes':'configuracoes',
  '/alertas':      'alertas',
  '/checklists':   'checklists',
  '/admin/health': 'admin',
}
