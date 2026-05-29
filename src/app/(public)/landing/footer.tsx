'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUp, MessageCircle, Mail } from 'lucide-react'

const WA_URL =
  'https://wa.me/5531975142675?text=Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20o%20Frota%20360.'

const LINK_STYLE = {
  fontFamily: 'Saira, sans-serif',
  fontWeight: 400,
  fontSize: '0.85rem',
  color: '#6E695C',
} as const

function FooterLink({ href, children, external }: { href: string; children: React.ReactNode; external?: boolean }) {
  const props = external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
  return (
    <li>
      <a
        href={href}
        {...props}
        style={LINK_STYLE}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#6E695C')}
        className="transition-colors"
      >
        {children}
      </a>
    </li>
  )
}

export function Footer() {
  return (
    <footer id="contato" style={{ backgroundColor: '#1A1816' }}>
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Top row */}
        <div className="flex flex-col md:flex-row gap-12 md:gap-16 mb-16">
          {/* Brand */}
          <div className="flex-shrink-0">
            <Link href="/landing">
              <Image src="/logo/svg/frota360-negativo.svg" alt="frota360" width={120} height={30} />
            </Link>
            <p
              className="mt-4 leading-relaxed max-w-[220px]"
              style={{ fontFamily: 'Saira, sans-serif', fontWeight: 300, fontSize: '0.82rem', color: '#6E695C' }}
            >
              Gestão 360° de frotas.<br />Do pátio à entrega.
            </p>
          </div>

          {/* Link columns */}
          <div className="flex flex-wrap gap-10 md:gap-14 flex-1 md:justify-end">
            {/* Produto */}
            <div>
              <ColHeading>Produto</ColHeading>
              <ul className="flex flex-col gap-2.5">
                <FooterLink href="#funcionalidades">Funcionalidades</FooterLink>
                <FooterLink href="#precos">Preços</FooterLink>
                <FooterLink href="/login">Entrar</FooterLink>
                <FooterLink href="/cadastro">Cadastro</FooterLink>
              </ul>
            </div>

            {/* Empresa */}
            <div>
              <ColHeading>Empresa</ColHeading>
              <ul className="flex flex-col gap-2.5">
                <FooterLink href="#">Sobre</FooterLink>
              </ul>
            </div>

            {/* Contato */}
            <div>
              <ColHeading>Contato</ColHeading>
              <ul className="flex flex-col gap-3">
                <li>
                  <a
                    href={WA_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 transition-colors"
                    style={LINK_STYLE}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#25D366')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#6E695C')}
                  >
                    <MessageCircle size={13} />
                    (31) 97514-2675
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:contactugagency@gmail.com"
                    className="inline-flex items-center gap-2 transition-colors"
                    style={{ ...LINK_STYLE, fontSize: '0.8rem' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#E8871E')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#6E695C')}
                  >
                    <Mail size={13} />
                    contactugagency@gmail.com
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <ColHeading>Legal</ColHeading>
              <ul className="flex flex-col gap-2.5">
                <FooterLink href="#">Termos de Uso</FooterLink>
                <FooterLink href="#">Privacidade</FooterLink>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p style={{ fontFamily: 'Saira, sans-serif', fontWeight: 300, fontSize: '0.78rem', color: '#6E695C' }}>
            © 2026 frota360. Todos os direitos reservados.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-2 transition-colors"
            style={{ fontFamily: 'Saira, sans-serif', fontWeight: 400, fontSize: '0.82rem', color: '#6E695C' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#E8871E')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6E695C')}
          >
            <ArrowUp size={14} />
            Voltar ao topo
          </button>
        </div>
      </div>
    </footer>
  )
}

function ColHeading({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-4 uppercase tracking-[0.16em] text-[10px]"
      style={{ fontFamily: 'Space Mono, monospace', color: '#6E695C' }}
    >
      {children}
    </p>
  )
}
