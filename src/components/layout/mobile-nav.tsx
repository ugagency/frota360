'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { MOBILE_TABS, NAV_ITEMS } from '@/components/layout/nav-items'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Logo } from '@/components/brand/logo'
import { cn } from '@/lib/utils'

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 h-16 bg-sidebar-bg border-t border-sidebar-border flex items-stretch">
      {MOBILE_TABS.map((t) => {
        const active = t.href === '/' ? pathname === '/' : pathname.startsWith(t.href)
        const Icon = t.icon
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-mono uppercase',
              active ? 'text-brand' : 'text-sidebar-text',
            )}
          >
            <Icon size={20} strokeWidth={2} />
            {t.label}
          </Link>
        )
      })}
      <MoreSheet />
    </nav>
  )
}

function MoreSheet() {
  const pathname = usePathname()
  const rest = NAV_ITEMS.filter((i) => !MOBILE_TABS.includes(i))
  return (
    <Sheet>
      <SheetTrigger className="flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-mono uppercase text-sidebar-text">
        <Menu size={20} />
        Menu
      </SheetTrigger>
      <SheetContent side="right" className="bg-sidebar-bg border-sidebar-border p-0 w-72">
        <SheetHeader className="p-4 border-b border-sidebar-border">
          <SheetTitle className="flex items-center">
            <Logo variant="horizontal" theme="dark" size="md" />
          </SheetTitle>
        </SheetHeader>
        <div className="p-2 space-y-1">
          {rest.map((it) => {
            const active = pathname.startsWith(it.href)
            const Icon = it.icon
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  'flex items-center gap-3 rounded px-3 py-2 text-sm',
                  active ? 'bg-sidebar-active text-sidebar-active-text font-medium' : 'text-sidebar-text hover:bg-sidebar-hover',
                )}
              >
                <Icon size={18} />
                {it.label}
              </Link>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
