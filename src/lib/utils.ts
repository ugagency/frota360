import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ---------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const DATE_BR = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
})

const KM_BR = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })

export function formatCurrency(value: number): string {
  return BRL.format(value ?? 0)
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return '—'
  return DATE_BR.format(d)
}

export function formatKm(km: number | null | undefined): string {
  if (km == null) return '—'
  return `${KM_BR.format(km)} km`
}

// ---------------------------------------------------------------------
// Alertas
// ---------------------------------------------------------------------

const MS_PER_DAY = 1000 * 60 * 60 * 24

export function getDaysUntil(date: string | Date): number {
  const target = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  // zera as horas para contagem em dias-calendário
  target.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / MS_PER_DAY)
}

export type AlertPriority = 'critico' | 'alto' | 'medio' | 'baixo'

export function getAlertPriorityFromDays(days: number): AlertPriority {
  if (days < 7) return 'critico'
  if (days < 15) return 'alto'
  if (days < 30) return 'medio'
  return 'baixo'
}

// ---------------------------------------------------------------------
// UX helpers
// ---------------------------------------------------------------------

export function getGreeting(date = new Date()): 'Bom dia' | 'Boa tarde' | 'Boa noite' {
  const h = date.getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0]
}
