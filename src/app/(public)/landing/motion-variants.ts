// Variants centralizados — landing page Frota 360
// Regras: disparar cedo (amount: 0), translate sutil (24px), duration rápido (0.5s)

const VP = { once: true, amount: 0, margin: '0px 0px -60px 0px' } as const
const VP_EARLY = { once: true, amount: 0, margin: '0px 0px -100px 0px' } as const
const VP_PLAIN = { once: true, amount: 0 } as const
const ease = [0.25, 0.1, 0.25, 1] as const

export const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: VP,
  transition: { duration: 0.5, ease },
}

export const fadeInLeft = {
  initial: { opacity: 0, x: -24 },
  whileInView: { opacity: 1, x: 0 },
  viewport: VP,
  transition: { duration: 0.5, ease },
}

export const fadeInRight = {
  initial: { opacity: 0, x: 24 },
  whileInView: { opacity: 1, x: 0 },
  viewport: VP,
  transition: { duration: 0.5, ease },
}

export const fadeIn = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: VP_PLAIN,
  transition: { duration: 0.5, ease },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96, y: 20 },
  whileInView: { opacity: 1, scale: 1, y: 0 },
  viewport: VP,
  transition: { duration: 0.55, ease },
}

// Dispara bem antes do elemento aparecer — para counters e elementos grandes
export const fadeInUpEarly = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: VP_EARLY,
  transition: { duration: 0.5, ease },
}

export const staggeredChild = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease },
}
