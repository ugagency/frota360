'use client'

import Link from 'next/link'
import { LogOut, Settings, ChevronDown } from 'lucide-react'
import { sair } from '@/app/actions/auth'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'

type Props = {
  nome: string
  email: string
  variant?: 'sidebar' | 'header'
}

export function UserNav({ nome, email, variant = 'header' }: Props) {
  const initials = getInitials(nome)

  if (variant === 'sidebar') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-full flex items-center gap-3 px-2 py-2 rounded text-sidebar-text hover:bg-sidebar-hover hover:text-white text-sm">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-brand text-white text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-white text-sm truncate">{nome}</div>
              <div className="text-xs text-sidebar-text/70 truncate">{email}</div>
            </div>
            <ChevronDown size={14} />
          </button>
        </DropdownMenuTrigger>
        <UserMenuContent nome={nome} email={email} />
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded px-1 py-1 hover:bg-app-subtle">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-brand text-white text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <ChevronDown size={14} className="text-ink-muted" />
        </button>
      </DropdownMenuTrigger>
      <UserMenuContent nome={nome} email={email} />
    </DropdownMenu>
  )
}

function UserMenuContent({ nome, email }: { nome: string; email: string }) {
  return (
    <DropdownMenuContent align="end" className={cn('w-60')}>
      <DropdownMenuLabel className="font-normal">
        <div className="text-sm font-medium leading-none">{nome}</div>
        <div className="text-xs text-ink-muted mt-1 truncate">{email}</div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link href="/configuracoes" className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" /> Configurações
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <form action={sair}>
        <DropdownMenuItem asChild>
          <button type="submit" className="w-full cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </button>
        </DropdownMenuItem>
      </form>
    </DropdownMenuContent>
  )
}
