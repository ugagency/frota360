import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  variant?: 'horizontal' | 'symbol'
  theme?: 'dark' | 'light' | 'mono-branco' | 'mono-grafite' | 'verde'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const HEIGHTS = { sm: 24, md: 32, lg: 48, xl: 64 } as const
const WORDMARK_RATIO = 4.4

export function Logo({ variant = 'horizontal', theme = 'dark', size = 'md', className }: LogoProps) {
  const h = HEIGHTS[size]

  if (variant === 'symbol') {
    const symbolMap = {
      dark: '/logo/svg/frota360-simbolo-ambar.svg',
      light: '/logo/svg/frota360-simbolo-ambar.svg',
      'mono-branco': '/logo/svg/frota360-simbolo-branco.svg',
      'mono-grafite': '/logo/svg/frota360-simbolo-grafite.svg',
      verde: '/logo/svg/frota360-simbolo-verde.svg',
    }
    return (
      <Image
        src={symbolMap[theme]}
        alt="frota360"
        height={h}
        width={h}
        className={cn(className)}
        priority
      />
    )
  }

  const horizontalMap = {
    dark: '/logo/svg/frota360-negativo.svg',
    light: '/logo/svg/frota360-positivo.svg',
    'mono-branco': '/logo/svg/frota360-mono-branco.svg',
    'mono-grafite': '/logo/svg/frota360-mono-grafite.svg',
    verde: '/logo/svg/frota360-verde.svg',
  }

  return (
    <Image
      src={horizontalMap[theme]}
      alt="frota360"
      height={h}
      width={Math.round(h * WORDMARK_RATIO)}
      className={cn(className)}
      priority
    />
  )
}
