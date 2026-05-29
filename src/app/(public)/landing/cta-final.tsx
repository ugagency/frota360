'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { MessageCircle, Mail } from 'lucide-react'

const E = [0.25, 0.1, 0.25, 1] as const
const VP = { once: true, amount: 0 } as const

const WA_URL =
  'https://wa.me/5531975142675?text=Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20o%20Frota%20360.'

export function CTAFinal() {
  return (
    <section
      className="relative py-32 md:py-44 overflow-hidden flex flex-col items-center justify-center text-center"
      style={{ backgroundColor: '#211F1B' }}
    >
      {/* Grain */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.035]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <filter id="cta-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#cta-grain)" />
        </svg>
      </div>

      {/* Amber radial — bottom center */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[640px] h-64 opacity-[0.05]"
        style={{ background: 'radial-gradient(ellipse at bottom, #E8871E 0%, transparent 70%)' }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VP}
          transition={{ duration: 0.5, ease: E }}
        >
          <p
            className="mb-8 uppercase tracking-[0.18em] text-[11px]"
            style={{ fontFamily: 'Space Mono, monospace', color: '#E8871E' }}
          >
            Pronto para começar
          </p>

          <div className="overflow-hidden mb-3">
            <motion.p
              initial={{ y: '105%' }}
              whileInView={{ y: 0 }}
              viewport={VP}
              transition={{ duration: 0.65, ease: E, delay: 0.06 }}
              className="leading-[0.9] tracking-[-0.02em]"
              style={{
                fontFamily: 'Saira Condensed, sans-serif',
                fontWeight: 900,
                fontSize: 'clamp(3rem, 8.5vw, 6rem)',
                color: '#FFFFFF',
              }}
            >
              Comece hoje.
            </motion.p>
          </div>
          <div className="overflow-hidden mb-14">
            <motion.p
              initial={{ y: '105%' }}
              whileInView={{ y: 0 }}
              viewport={VP}
              transition={{ duration: 0.65, ease: E, delay: 0.15 }}
              className="leading-[0.9] tracking-[-0.02em]"
              style={{
                fontFamily: 'Saira Condensed, sans-serif',
                fontWeight: 900,
                fontSize: 'clamp(3rem, 8.5vw, 6rem)',
                color: '#E8871E',
              }}
            >
              Sem cartão.
            </motion.p>
          </div>

          {/* CTA button */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VP}
            transition={{ duration: 0.5, ease: E, delay: 0.26 }}
          >
            <Link
              href="/cadastro"
              className="inline-flex items-center justify-center px-14 py-5 rounded transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
              style={{
                fontFamily: 'Saira, sans-serif',
                fontWeight: 600,
                fontSize: '1.1rem',
                backgroundColor: '#E8871E',
                color: '#211F1B',
                boxShadow: '0 8px 40px rgba(232,135,30,0.28)',
              }}
            >
              Começar grátis — 14 dias →
            </Link>
          </motion.div>

          {/* Contact alternative */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={VP}
            transition={{ duration: 0.5, ease: E, delay: 0.4 }}
            className="mt-10 flex flex-col items-center gap-5"
          >
            <p
              style={{
                fontFamily: 'Saira, sans-serif',
                fontWeight: 400,
                fontSize: '0.85rem',
                color: '#6E695C',
              }}
            >
              ou fale com a gente
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <ContactLink
                href={WA_URL}
                icon={<MessageCircle size={15} />}
                label="(31) 97514-2675"
              />
              <ContactLink
                href="mailto:contactugagency@gmail.com"
                icon={<Mail size={15} />}
                label="contactugagency@gmail.com"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function ContactLink({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <a
      href={href}
      target={href.startsWith('mailto') ? undefined : '_blank'}
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 transition-colors"
      style={{
        fontFamily: 'Saira, sans-serif',
        fontWeight: 500,
        fontSize: '0.875rem',
        color: 'rgba(255,255,255,0.65)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = '#E8871E')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
    >
      {icon}
      {label}
    </a>
  )
}
