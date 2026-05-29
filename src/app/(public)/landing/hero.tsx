'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

const E = [0.25, 0.1, 0.25, 1] as const

export function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#211F1B' }}
    >
      {/* Blueprint grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Grain */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.04]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <filter id="h-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#h-grain)" />
        </svg>
      </div>

      {/* Amber radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-60 -right-60 w-[700px] h-[700px] rounded-full"
        style={{ background: 'radial-gradient(circle, #E8871E 0%, transparent 68%)', opacity: 0.04 }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-32 pt-40 flex flex-col items-center text-center">
        {/* Label tag */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: E, delay: 0.08 }}
          className="mb-10"
        >
          <span
            className="px-3 py-1.5 rounded-sm text-[11px] uppercase tracking-[0.18em]"
            style={{
              fontFamily: 'Space Mono, monospace',
              color: '#E8871E',
              border: '1px solid rgba(232,135,30,0.28)',
              backgroundColor: 'rgba(232,135,30,0.05)',
            }}
          >
            Gestão de frotas
          </span>
        </motion.div>

        {/* Headline — two lines, each animated independently */}
        <div className="overflow-hidden mb-3">
          <motion.h1
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.75, ease: E, delay: 0.2 }}
            className="text-white leading-[0.91] tracking-[-0.02em]"
            style={{
              fontFamily: 'Saira Condensed, sans-serif',
              fontWeight: 900,
              fontSize: 'clamp(3rem, 8.5vw, 7rem)',
            }}
          >
            A VISÃO COMPLETA
          </motion.h1>
        </div>
        <div className="overflow-hidden mb-12">
          <motion.h1
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.75, ease: E, delay: 0.36 }}
            className="text-white leading-[0.91] tracking-[-0.02em]"
            style={{
              fontFamily: 'Saira Condensed, sans-serif',
              fontWeight: 900,
              fontSize: 'clamp(3rem, 8.5vw, 7rem)',
            }}
          >
            DA SUA OPERAÇÃO.
          </motion.h1>
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: E, delay: 0.68 }}
          className="mx-auto mb-12 leading-relaxed"
          style={{
            fontFamily: 'Saira, sans-serif',
            fontWeight: 300,
            fontSize: '1.15rem',
            color: '#E4E1D9',
            maxWidth: '500px',
          }}
        >
          Gestão 360° de frotas para transportadoras.<br className="hidden sm:block" />
          Do pátio à entrega, em uma tela.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: E, delay: 0.88 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Link
            href="/cadastro"
            className="inline-flex items-center justify-center px-10 py-4 rounded transition-all duration-200 hover:scale-[1.02] active:scale-[0.99]"
            style={{
              fontFamily: 'Saira, sans-serif',
              fontWeight: 600,
              fontSize: '1rem',
              backgroundColor: '#E8871E',
              color: '#211F1B',
              boxShadow: '0 4px 24px rgba(232,135,30,0.22)',
            }}
          >
            Começar grátis — 14 dias
          </Link>
          <a
            href="#funcionalidades"
            className="inline-flex items-center justify-center px-10 py-4 rounded transition-all duration-200"
            style={{
              fontFamily: 'Saira, sans-serif',
              fontWeight: 500,
              fontSize: '0.95rem',
              color: 'rgba(255,255,255,0.72)',
              border: '1px solid rgba(255,255,255,0.18)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.95)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.72)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'
            }}
          >
            Ver como funciona
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.7 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
      >
        <motion.div
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ color: 'rgba(255,255,255,0.25)' }}
        >
          <ChevronDown size={20} />
        </motion.div>
      </motion.div>
    </section>
  )
}
