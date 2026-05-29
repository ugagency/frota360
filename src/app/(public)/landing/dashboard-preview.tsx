'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Monitor, Zap, Bell, MessageSquare } from 'lucide-react'

const E = [0.25, 0.1, 0.25, 1] as const

const HIGHLIGHTS = [
  {
    icon: Zap,
    cor: '#E8871E',
    titulo: 'Tempo real',
    sub: 'Dados atualizados ao encerrar cada viagem',
  },
  {
    icon: Bell,
    cor: '#1E9E6A',
    titulo: 'Alertas automáticos',
    sub: 'Antes do problema, não depois',
  },
  {
    icon: MessageSquare,
    cor: '#E8871E',
    titulo: 'Assistente IA',
    sub: 'Pergunte em linguagem natural',
  },
] as const

export function DashboardPreview() {
  const sectionRef = useRef<HTMLElement>(null)
  const mockupRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: mockupRef,
    offset: ['start end', 'center center'],
  })

  const rotateY = useTransform(scrollYProgress, [0, 1], [-4, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1])
  const opacity = useTransform(scrollYProgress, [0, 0.2], [0, 1])

  return (
    <section
      ref={sectionRef}
      className="py-24 md:py-36 overflow-hidden"
      style={{ backgroundColor: '#F8F6F1' }}
    >
      <div className="max-w-6xl mx-auto px-6">
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
            O produto
          </p>
          <h2
            className="leading-tight"
            style={{
              fontFamily: 'Saira Condensed, sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
              color: '#211F1B',
            }}
          >
            Isso é o que você vê ao abrir o frota360.
          </h2>
        </motion.div>

        {/* Mockup with perspective */}
        <div ref={mockupRef} style={{ perspective: '1400px' }}>
          <motion.div
            style={{ rotateY, scale, opacity }}
            className="rounded-2xl overflow-hidden shadow-2xl"
          >
            <div
              className="aspect-video w-full flex flex-col items-center justify-center gap-4"
              style={{ backgroundColor: '#2C2927', border: '2px dashed rgba(110,105,92,0.4)' }}
            >
              <Monitor size={36} color="#6E695C" />
              <div className="text-center">
                <p
                  className="uppercase tracking-widest mb-1"
                  style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#6E695C' }}
                >
                  Screenshot do dashboard
                </p>
                <p
                  style={{ fontFamily: 'Saira, sans-serif', fontSize: '0.8rem', color: 'rgba(110,105,92,0.6)' }}
                >
                  16:9 · Inserir imagem real aqui
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Highlights below mockup */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-16">
          {HIGHLIGHTS.map((h, i) => {
            const Icon = h.icon
            return (
              <motion.div
                key={h.titulo}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0, margin: '0px 0px -40px 0px' }}
                transition={{ duration: 0.45, ease: E, delay: i * 0.08 }}
                className="flex items-start gap-4"
              >
                <div
                  className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${h.cor}14` }}
                >
                  <Icon size={17} color={h.cor} />
                </div>
                <div>
                  <p
                    className="mb-1"
                    style={{
                      fontFamily: 'Saira, sans-serif',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      color: '#211F1B',
                    }}
                  >
                    {h.titulo}
                  </p>
                  <p
                    style={{
                      fontFamily: 'Saira, sans-serif',
                      fontWeight: 400,
                      fontSize: '0.85rem',
                      color: '#6E695C',
                    }}
                  >
                    {h.sub}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
