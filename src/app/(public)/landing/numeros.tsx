'use client'

import { motion } from 'framer-motion'
import { useCountUp } from '../hooks/use-count-up'

const E = [0.25, 0.1, 0.25, 1] as const

function NumeroCard({
  display,
  label,
  delay = 0,
  animTarget,
  sufixo = '',
}: {
  display?: string
  label: string
  delay?: number
  animTarget?: number
  sufixo?: string
}) {
  const { count, ref } = useCountUp(animTarget ?? 0, 2.2)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0, margin: '0px 0px -80px 0px' }}
      transition={{ duration: 0.5, ease: E, delay }}
      className="flex flex-col items-center text-center gap-3"
    >
      <span
        ref={animTarget !== undefined ? ref : undefined}
        className="leading-none tabular-nums"
        style={{
          fontFamily: 'Saira Condensed, sans-serif',
          fontWeight: 900,
          fontSize: 'clamp(3.5rem, 9vw, 7rem)',
          color: '#E8871E',
        }}
      >
        {animTarget !== undefined ? `${count}${sufixo}` : display}
      </span>
      <span
        style={{
          fontFamily: 'Saira, sans-serif',
          fontWeight: 400,
          fontSize: '0.9rem',
          color: '#E4E1D9',
          maxWidth: '160px',
        }}
      >
        {label}
      </span>
    </motion.div>
  )
}

export function Numeros() {
  return (
    <section
      className="relative py-28 md:py-36 overflow-hidden"
      style={{ backgroundColor: '#211F1B' }}
    >
      {/* Diagonal stripe background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(-45deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 0, transparent 50%)',
          backgroundSize: '22px 22px',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0 }}
          transition={{ duration: 0.5, ease: E }}
          className="text-center mb-16 uppercase tracking-[0.18em] text-[11px]"
          style={{ fontFamily: 'Space Mono, monospace', color: '#E8871E' }}
        >
          Em números
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-14 sm:gap-8">
          <NumeroCard animTarget={6} sufixo="" label="módulos integrados" delay={0} />
          <NumeroCard animTarget={24} sufixo="h" label="atendimento da IA" delay={0.12} />
          <NumeroCard display="< 2min" label="pra encerrar uma viagem" delay={0.24} />
        </div>

        {/* Subtle divider line */}
        <div
          className="mt-20 h-px mx-auto max-w-xs"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(232,135,30,0.3), transparent)' }}
        />
      </div>
    </section>
  )
}
