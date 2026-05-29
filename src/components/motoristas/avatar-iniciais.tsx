import { cn, getInitials } from '@/lib/utils'

const PALETTE = [
  '#E8871E', // brand
  '#B65E18', // brand-dark
  '#1E9E6A', // accent
  '#1C6E49', // accent-mid
  '#7C3AED', // violet
  '#0891B2', // cyan
]

// Hash determinístico simples
function hashName(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return Math.abs(h)
}

type Size = 'sm' | 'md' | 'lg' | 'xl'

const SIZE_MAP: Record<Size, { box: string; text: string }> = {
  sm: { box: 'h-7 w-7',   text: 'text-[10px]' },
  md: { box: 'h-9 w-9',   text: 'text-xs' },
  lg: { box: 'h-12 w-12', text: 'text-sm' },
  xl: { box: 'h-20 w-20', text: 'text-2xl' },
}

export function AvatarIniciais({
  nome, size = 'md', className,
}: { nome: string; size?: Size; className?: string }) {
  const initials = getInitials(nome)
  const color = PALETTE[hashName(nome) % PALETTE.length]
  const { box, text } = SIZE_MAP[size]

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full text-white font-display font-semibold shrink-0',
        box, text, className,
      )}
      style={{ backgroundColor: color }}
      aria-label={nome}
    >
      {initials}
    </span>
  )
}
