'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: scrolled ? '#211F1B' : 'transparent',
          backdropFilter: scrolled ? 'none' : 'blur(8px)',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/landing" aria-label="frota360 início">
            <Image
              src="/logo/svg/frota360-negativo.svg"
              alt="frota360"
              width={112}
              height={28}
              priority
            />
          </Link>

          {/* Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            <NavLink href="#funcionalidades">Funcionalidades</NavLink>
            <NavLink href="#precos">Preços</NavLink>
            <NavLink href="#contato">Contato</NavLink>
            <Link
              href="/login"
              className="text-sm text-white/70 hover:text-white transition-colors px-4 py-2 rounded border border-white/20 hover:border-white/40"
              style={{ fontFamily: 'Saira, sans-serif', fontWeight: 500 }}
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="text-sm px-5 py-2 rounded transition-all hover:scale-[1.03] active:scale-[0.98]"
              style={{
                fontFamily: 'Saira, sans-serif',
                fontWeight: 600,
                backgroundColor: '#E8871E',
                color: '#211F1B',
              }}
            >
              Começar grátis →
            </Link>
          </nav>

          {/* Mobile trigger */}
          <button
            className="md:hidden text-white/80 hover:text-white p-2 -mr-2"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed inset-0 z-[60] flex flex-col"
            style={{ backgroundColor: '#211F1B' }}
          >
            <div className="flex items-center justify-between px-6 h-16 border-b border-white/08">
              <Image src="/logo/svg/frota360-negativo.svg" alt="frota360" width={112} height={28} />
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white p-2 -mr-2">
                <X size={22} />
              </button>
            </div>

            <nav className="flex flex-col flex-1 px-6 pt-6 gap-px">
              {[
                { href: '#funcionalidades', label: 'Funcionalidades' },
                { href: '#precos', label: 'Preços' },
                { href: '#contato', label: 'Contato' },
                { href: '/login', label: 'Entrar' },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="py-4 text-lg text-white/70 hover:text-white transition-colors border-b border-white/06"
                  style={{ fontFamily: 'Saira, sans-serif', fontWeight: 500 }}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="p-6">
              <Link
                href="/cadastro"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center w-full py-4 rounded text-base"
                style={{
                  fontFamily: 'Saira, sans-serif',
                  fontWeight: 600,
                  backgroundColor: '#E8871E',
                  color: '#211F1B',
                }}
              >
                Começar grátis — 14 dias
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-sm text-white/70 hover:text-white transition-colors"
      style={{ fontFamily: 'Saira, sans-serif', fontWeight: 500 }}
    >
      {children}
    </a>
  )
}
