'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { AlertTriangle, FileText, ClipboardX, TrendingDown } from 'lucide-react'

const DORES = [
  {
    icon: FileText,
    titulo: 'Planilha desatualizada',
    corpo: 'Cada um atualiza a sua. Ninguém sabe o número certo.',
    cor: '#E8871E',
  },
  {
    icon: AlertTriangle,
    titulo: 'Manutenção esquecida',
    corpo: 'O caminhão parou porque ninguém lembrou da revisão dos 120 mil km.',
    cor: '#DC2626',
  },
  {
    icon: ClipboardX,
    titulo: 'Documentos vencidos',
    corpo: 'CNH vencida, multa na estrada. Aviso no WhatsApp dois dias depois.',
    cor: '#DC2626',
  },
  {
    icon: TrendingDown,
    titulo: 'Custo invisível',
    corpo: 'Quanto custa operar cada caminhão por mês? Ninguém sabe.',
    cor: '#E8871E',
  },
] as const

export function Problema() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  // Cards appear progressively — card 1 first, card 4 last
  const o0 = useTransform(scrollYProgress, [0.02, 0.10], [0, 1])
  const x0 = useTransform(scrollYProgress, [0.02, 0.12], [-24, 0])

  const o1 = useTransform(scrollYProgress, [0.22, 0.32], [0, 1])
  const x1 = useTransform(scrollYProgress, [0.22, 0.32], [-24, 0])

  const o2 = useTransform(scrollYProgress, [0.44, 0.54], [0, 1])
  const x2 = useTransform(scrollYProgress, [0.44, 0.54], [-24, 0])

  const o3 = useTransform(scrollYProgress, [0.66, 0.76], [0, 1])
  const x3 = useTransform(scrollYProgress, [0.66, 0.76], [-24, 0])

  const transforms = [
    { opacity: o0, x: x0 },
    { opacity: o1, x: x1 },
    { opacity: o2, x: x2 },
    { opacity: o3, x: x3 },
  ]

  return (
    <div ref={containerRef} className="relative" style={{ height: '370vh' }}>
      <div
        className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden"
        style={{ backgroundColor: '#211F1B' }}
      >
        {/* Grain */}
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.035]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <filter id="p-grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="4" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#p-grain)" />
          </svg>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">
          <p
            className="mb-3 uppercase tracking-[0.18em] text-[11px]"
            style={{ fontFamily: 'Space Mono, monospace', color: '#E8871E' }}
          >
            O problema
          </p>
          <h2
            className="text-white mb-12"
            style={{
              fontFamily: 'Saira Condensed, sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(1.7rem, 3.8vw, 2.6rem)',
            }}
          >
            Você ainda gerencia sua frota assim?
          </h2>

          {/* Cards — 2 col on desktop, staggered vertically */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
            {DORES.map((dor, i) => {
              const Icon = dor.icon
              return (
                <motion.div
                  key={i}
                  style={{ opacity: transforms[i].opacity, x: transforms[i].x }}
                  className={i % 2 !== 0 ? 'md:mt-10' : ''}
                >
                  <div
                    className="rounded-lg p-6 h-full"
                    style={{
                      backgroundColor: '#3A372F',
                      borderLeft: `3px solid ${dor.cor}`,
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${dor.cor}18` }}
                      >
                        <Icon size={15} color={dor.cor} />
                      </div>
                      <h3
                        className="text-white"
                        style={{
                          fontFamily: 'Saira Condensed, sans-serif',
                          fontWeight: 600,
                          fontSize: '1.05rem',
                        }}
                      >
                        {dor.titulo}
                      </h3>
                    </div>
                    <p
                      className="leading-relaxed"
                      style={{
                        fontFamily: 'Saira, sans-serif',
                        fontWeight: 400,
                        fontSize: '0.9rem',
                        color: '#E4E1D9',
                      }}
                    >
                      {dor.corpo}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
