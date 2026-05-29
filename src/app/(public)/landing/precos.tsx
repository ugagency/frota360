'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Check } from 'lucide-react'

const E = [0.25, 0.1, 0.25, 1] as const

const STARTER_ITEMS = [
  'Até 20 veículos',
  'Todos os 6 módulos',
  '2 usuários',
  'Suporte por e-mail',
]

const PRO_ITEMS = [
  'Veículos ilimitados',
  'Todos os módulos',
  'Usuários ilimitados',
  'Assistente IA',
  'Relatórios avançados',
  'Suporte prioritário WhatsApp',
]

function ItemLista({ texto }: { texto: string }) {
  return (
    <li className="flex items-center gap-3">
      <Check size={14} color="#1E9E6A" strokeWidth={2.5} className="flex-shrink-0" />
      <span style={{ fontFamily: 'Saira, sans-serif', fontWeight: 400, fontSize: '0.9rem', color: 'rgba(255,255,255,0.82)' }}>
        {texto}
      </span>
    </li>
  )
}

export function Precos() {
  return (
    <section id="precos" className="py-24 md:py-36 overflow-hidden" style={{ backgroundColor: '#211F1B' }}>
      {/* Grain */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.03]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <filter id="pr-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#pr-grain)" />
        </svg>
      </div>

      <div className="relative max-w-5xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0, margin: '0px 0px -60px 0px' }}
          transition={{ duration: 0.5, ease: E }}
        >
          <p
            className="mb-3 uppercase tracking-[0.18em] text-[11px]"
            style={{ fontFamily: 'Space Mono, monospace', color: '#E8871E' }}
          >
            Preços
          </p>
          <h2
            className="text-white leading-tight"
            style={{
              fontFamily: 'Saira Condensed, sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
            }}
          >
            Preços diretos. Sem pegadinha.
          </h2>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto items-start">
          {/* Starter */}
          <motion.div
            initial={{ opacity: 0, y: 32, x: -16 }}
            whileInView={{ opacity: 1, y: 0, x: 0 }}
            viewport={{ once: true, amount: 0, margin: '0px 0px -40px 0px' }}
            transition={{ duration: 0.5, ease: E }}
            className="rounded-xl p-8 flex flex-col gap-6"
            style={{ backgroundColor: '#3A372F', border: '1px solid rgba(110,105,92,0.3)' }}
          >
            <div>
              <p
                className="mb-5 uppercase tracking-[0.18em] text-[10px]"
                style={{ fontFamily: 'Space Mono, monospace', color: '#E8871E' }}
              >
                Starter
              </p>
              <div className="flex items-end gap-1.5 mb-1">
                <span
                  className="leading-none"
                  style={{
                    fontFamily: 'Saira Condensed, sans-serif',
                    fontWeight: 900,
                    fontSize: '3.5rem',
                    color: '#FFFFFF',
                  }}
                >
                  R$ 197
                </span>
              </div>
              <p style={{ fontFamily: 'Saira, sans-serif', fontWeight: 300, fontSize: '0.9rem', color: '#E4E1D9' }}>
                por mês
              </p>
            </div>

            <div className="h-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />

            <ul className="flex flex-col gap-3">
              {STARTER_ITEMS.map((item) => <ItemLista key={item} texto={item} />)}
            </ul>

            <Link
              href="/cadastro"
              className="mt-auto flex items-center justify-center py-3.5 rounded-lg text-sm transition-all hover:scale-[1.02]"
              style={{
                fontFamily: 'Saira, sans-serif',
                fontWeight: 600,
                color: '#E8871E',
                border: '1px solid rgba(232,135,30,0.5)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#E8871E')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(232,135,30,0.5)')}
            >
              Começar grátis — 14 dias
            </Link>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 32, x: 16 }}
            whileInView={{ opacity: 1, y: 0, x: 0 }}
            viewport={{ once: true, amount: 0, margin: '0px 0px -40px 0px' }}
            transition={{ duration: 0.5, ease: E, delay: 0.1 }}
            className="rounded-xl p-8 flex flex-col gap-6 relative md:scale-[1.03]"
            style={{ backgroundColor: '#3A372F', border: '1px solid #E8871E' }}
          >
            {/* Badge */}
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-semibold tracking-wider"
              style={{
                fontFamily: 'Space Mono, monospace',
                backgroundColor: '#E8871E',
                color: '#211F1B',
              }}
            >
              RECOMENDADO
            </div>

            <div>
              <p
                className="mb-5 uppercase tracking-[0.18em] text-[10px]"
                style={{ fontFamily: 'Space Mono, monospace', color: '#E8871E' }}
              >
                Pro
              </p>
              <div className="flex items-end gap-1.5 mb-1">
                <span
                  className="leading-none"
                  style={{
                    fontFamily: 'Saira Condensed, sans-serif',
                    fontWeight: 900,
                    fontSize: '3.5rem',
                    color: '#FFFFFF',
                  }}
                >
                  R$ 397
                </span>
              </div>
              <p style={{ fontFamily: 'Saira, sans-serif', fontWeight: 300, fontSize: '0.9rem', color: '#E4E1D9' }}>
                por mês
              </p>
            </div>

            <div className="h-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />

            <ul className="flex flex-col gap-3">
              {PRO_ITEMS.map((item) => <ItemLista key={item} texto={item} />)}
            </ul>

            <Link
              href="/cadastro"
              className="mt-auto flex items-center justify-center py-3.5 rounded-lg text-sm transition-all hover:scale-[1.02]"
              style={{
                fontFamily: 'Saira, sans-serif',
                fontWeight: 600,
                backgroundColor: '#E8871E',
                color: '#211F1B',
              }}
            >
              Começar grátis — 14 dias
            </Link>
          </motion.div>
        </div>

        {/* Fine print */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0 }}
          transition={{ duration: 0.5, ease: E, delay: 0.15 }}
          className="text-center mt-10"
          style={{ fontFamily: 'Saira, sans-serif', fontWeight: 300, fontSize: '0.85rem', color: '#6E695C' }}
        >
          14 dias grátis, sem cartão de crédito. Cancele quando quiser.
        </motion.p>
      </div>
    </section>
  )
}
