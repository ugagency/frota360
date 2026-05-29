// =====================================================================
// Formatadores e máscaras BR (placa, CPF, CNPJ, telefone, KM)
// =====================================================================

// ---------- Placa ----------
// Aceita ABC1234 (antiga) e ABC1D23 (Mercosul). Sempre uppercase, sem hífen.
export function normalizarPlaca(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7)
}

export function formatarPlaca(input: string): string {
  const clean = normalizarPlaca(input)
  if (clean.length <= 3) return clean
  return `${clean.slice(0, 3)}-${clean.slice(3)}`
}

const REGEX_PLACA_ANTIGA   = /^[A-Z]{3}\d{4}$/
const REGEX_PLACA_MERCOSUL = /^[A-Z]{3}\d[A-Z]\d{2}$/
export function placaValida(input: string): boolean {
  const clean = normalizarPlaca(input)
  return REGEX_PLACA_ANTIGA.test(clean) || REGEX_PLACA_MERCOSUL.test(clean)
}

// ---------- CPF ----------
export function formatarCPF(input: string): string {
  const d = input.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3)  return d
  if (d.length <= 6)  return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9)  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

export function cpfValido(input: string): boolean {
  const d = input.replace(/\D/g, '')
  if (d.length !== 11) return false
  if (/^(\d)\1{10}$/.test(d)) return false // todos iguais
  const calc = (slice: number) => {
    let sum = 0
    for (let i = 0; i < slice; i++) sum += Number(d[i]) * (slice + 1 - i)
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10])
}

// ---------- CNPJ ----------
export function formatarCNPJ(input: string): string {
  const d = input.replace(/\D/g, '').slice(0, 14)
  if (d.length <= 2)  return d
  if (d.length <= 5)  return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8)  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

// ---------- Telefone ----------
export function formatarTelefone(input: string): string {
  const d = input.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2)  return d.length ? `(${d}` : ''
  if (d.length <= 6)  return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

// ---------- KM input ----------
export function formatarKmInput(input: string | number): string {
  const n = typeof input === 'number' ? input : Number(input.toString().replace(/\D/g, ''))
  if (!Number.isFinite(n)) return ''
  return n.toLocaleString('pt-BR')
}

export function parseKmInput(input: string): number {
  return Number(input.replace(/\D/g, '')) || 0
}
