import { Navbar } from './navbar'
import { Hero } from './hero'
import { Problema } from './problema'
import { Funcionalidades } from './funcionalidades'
import { Numeros } from './numeros'
import { DashboardPreview } from './dashboard-preview'
import { Precos } from './precos'
import { FAQ } from './faq'
import { CTAFinal } from './cta-final'
import { Footer } from './footer'
import { WhatsAppFab } from './whatsapp-fab'

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main id="topo">
        <Hero />
        <Problema />
        <Funcionalidades />
        <Numeros />
        <DashboardPreview />
        <Precos />
        <FAQ />
        <CTAFinal />
      </main>
      <Footer />
      <WhatsAppFab />
    </>
  )
}
