'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'

const E = [0.25, 0.1, 0.25, 1] as const

const FAQS = [
  {
    q: 'Preciso instalar alguma coisa?',
    a: 'Não. O frota360 é 100% web — funciona no navegador do computador, tablet ou celular. Nenhuma instalação ou configuração de servidor.',
  },
  {
    q: 'Funciona com frota agregada?',
    a: 'Sim. Cada veículo pode ser marcado como próprio ou agregado, com controle financeiro separado. Ideal para frotas mistas.',
  },
  {
    q: 'E se eu quiser cancelar?',
    a: 'Sem fidelidade. Cancele a qualquer momento nas configurações. Seus dados ficam disponíveis por 30 dias após o cancelamento — tempo suficiente para exportar o que precisar.',
  },
  {
    q: 'Quanto tempo leva pra começar a usar?',
    a: 'Menos de 10 minutos. Cadastre, adicione seus veículos e motoristas, e o sistema já está operando. Não precisa de treinamento técnico.',
  },
  {
    q: 'A IA do assistente é confiável?',
    a: 'O assistente consulta apenas dados reais da sua operação — não inventa informações. Ele lê, não escreve: nenhuma ação é tomada sem você confirmar na interface.',
  },
] as const

function FAQItem({ item, isOpen, onToggle, delay }: { item: (typeof FAQS)[number]; isOpen: boolean; onToggle: () => void; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.5, ease: E, delay }}
      className="border-b"
      style={{ borderColor: '#E4E1D9' }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
      >
        <span
          style={{
            fontFamily: 'Saira, sans-serif',
            fontWeight: 600,
            fontSize: '0.975rem',
            color: '#211F1B',
          }}
        >
          {item.q}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2, ease: E }}
          className="flex-shrink-0"
          style={{ color: '#E8871E' }}
        >
          <Plus size={18} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <p
              className="pb-5 pr-10 leading-relaxed"
              style={{
                fontFamily: 'Saira, sans-serif',
                fontWeight: 400,
                fontSize: '0.9rem',
                color: '#6E695C',
              }}
            >
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="py-24 md:py-32" style={{ backgroundColor: '#F8F6F1' }}>
      <div className="max-w-2xl mx-auto px-6">
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, ease: E }}
        >
          <p
            className="mb-3 uppercase tracking-[0.18em] text-[11px]"
            style={{ fontFamily: 'Space Mono, monospace', color: '#E8871E' }}
          >
            FAQ
          </p>
          <h2
            className="leading-tight"
            style={{
              fontFamily: 'Saira Condensed, sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)',
              color: '#211F1B',
            }}
          >
            Perguntas frequentes
          </h2>
        </motion.div>

        <div>
          {FAQS.map((item, i) => (
            <FAQItem
              key={i}
              item={item}
              isOpen={open === i}
              onToggle={() => setOpen(open === i ? null : i)}
              delay={i * 0.06}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
