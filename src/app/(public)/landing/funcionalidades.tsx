'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

const E = [0.25, 0.1, 0.25, 1] as const

const MODULOS = [
  {
    tag: 'FROTA',
    titulo: 'Cada caminhão, um dossiê.',
    corpo:
      'Cadastro completo, status em tempo real, histórico de viagens, manutenções e custos — tudo por veículo. KM atualizado automaticamente ao encerrar cada viagem. Alertas antes da revisão — não depois.',
  },
  {
    tag: 'MOTORISTAS',
    titulo: 'Documentos no prazo. Sempre.',
    corpo:
      'CNH, MOPP, exames — o sistema avisa 60 dias antes de vencer. Histórico de viagens e desempenho por motorista. Nenhuma surpresa na estrada.',
  },
  {
    tag: 'VIAGENS',
    titulo: 'Da abertura ao encerramento.',
    corpo:
      'Origem, destino, carga, CT-e, frete, adiantamento. Encerrou a viagem → KM atualizado, financeiro lançado, tudo automático. Sem retrabalho.',
  },
  {
    tag: 'MANUTENÇÃO',
    titulo: 'Preventiva por KM. Corretiva quando precisa.',
    corpo:
      'Agenda por quilometragem e por data. Itens de serviço, custos, laudos. O veículo volta para ativo quando a oficina libera — não antes.',
  },
  {
    tag: 'FINANCEIRO',
    titulo: 'Quanto custa cada caminhão. De verdade.',
    corpo:
      'Receitas e despesas por veículo, por viagem, por período. Custo por KM rodado. DRE simplificado. Exporta em CSV quando precisar.',
  },
  {
    tag: 'ASSISTENTE IA',
    titulo: 'Pergunte. Ele sabe.',
    corpo:
      '"Quantos veículos estão em viagem?" — resposta em segundos com dados reais da sua operação. Consulta em linguagem natural, funciona no dashboard e em tela dedicada.',
  },
] as const

function MockupPlaceholder({ label }: { label: string }) {
  return (
    <div
      className="aspect-video w-full rounded-xl flex flex-col items-center justify-center gap-3"
      style={{
        backgroundColor: '#3A372F',
        border: '2px dashed rgba(110,105,92,0.5)',
      }}
    >
      <Monitor size={26} color="#6E695C" />
      <span
        className="uppercase tracking-widest"
        style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#6E695C' }}
      >
        {label}
      </span>
    </div>
  )
}

interface ModuloBlocoProps {
  modulo: (typeof MODULOS)[number]
  index: number
}

function ModuloBloco({ modulo, index }: ModuloBlocoProps) {
  const reverse = index % 2 !== 0

  return (
    <div
      className={cn(
        'flex flex-col md:flex-row items-center gap-12 md:gap-20',
        reverse && 'md:flex-row-reverse',
      )}
    >
      {/* Text */}
      <motion.div
        className="flex-1 min-w-0"
        initial={{ opacity: 0, x: reverse ? 24 : -24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0, margin: '0px 0px -60px 0px' }}
        transition={{ duration: 0.5, ease: E }}
      >
        <p
          className="mb-3 uppercase tracking-[0.18em] text-[10px]"
          style={{ fontFamily: 'Space Mono, monospace', color: '#E8871E' }}
        >
          {modulo.tag}
        </p>
        <h3
          className="mb-4 leading-tight"
          style={{
            fontFamily: 'Saira Condensed, sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(1.5rem, 3vw, 1.85rem)',
            color: '#211F1B',
          }}
        >
          {modulo.titulo}
        </h3>
        <p
          className="mb-6 leading-relaxed"
          style={{
            fontFamily: 'Saira, sans-serif',
            fontWeight: 400,
            fontSize: '0.95rem',
            color: '#6E695C',
            maxWidth: '440px',
          }}
        >
          {modulo.corpo}
        </p>
        <a
          href="/cadastro"
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:gap-2.5"
          style={{ fontFamily: 'Saira, sans-serif', fontWeight: 500, color: '#E8871E' }}
        >
          Conhecer módulo
          <ArrowRight size={15} />
        </a>
      </motion.div>

      {/* Mockup */}
      <motion.div
        className="flex-1 w-full md:max-w-[480px]"
        initial={{ opacity: 0, x: reverse ? -24 : 24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0, margin: '0px 0px -60px 0px' }}
        transition={{ duration: 0.5, ease: E, delay: 0.1 }}
      >
        <MockupPlaceholder label={`Módulo ${modulo.tag}`} />
      </motion.div>
    </div>
  )
}

export function Funcionalidades() {
  return (
    <section
      id="funcionalidades"
      className="py-24 md:py-36"
      style={{ backgroundColor: '#F8F6F1' }}
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="mb-20 max-w-2xl"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0, margin: '0px 0px -60px 0px' }}
          transition={{ duration: 0.5, ease: E }}
        >
          <p
            className="mb-3 uppercase tracking-[0.18em] text-[11px]"
            style={{ fontFamily: 'Space Mono, monospace', color: '#E8871E' }}
          >
            Plataforma
          </p>
          <h2
            className="mb-4 leading-tight"
            style={{
              fontFamily: 'Saira Condensed, sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(2rem, 4.5vw, 3rem)',
              color: '#211F1B',
            }}
          >
            Uma plataforma.<br />Sua operação inteira.
          </h2>
          <p
            style={{
              fontFamily: 'Saira, sans-serif',
              fontWeight: 400,
              fontSize: '1rem',
              color: '#6E695C',
            }}
          >
            Seis módulos que substituem planilhas, grupos de WhatsApp e intuição.
          </p>
        </motion.div>

        {/* Modules */}
        <div className="flex flex-col gap-24 md:gap-32">
          {MODULOS.map((modulo, i) => (
            <ModuloBloco key={modulo.tag} modulo={modulo} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
