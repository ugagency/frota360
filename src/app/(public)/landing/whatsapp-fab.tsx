'use client'

import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'

const WA_URL =
  'https://wa.me/5531975142675?text=Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20o%20Frota%20360.'

export function WhatsAppFab() {
  return (
    <motion.a
      href={WA_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale conosco pelo WhatsApp"
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 2, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.97 }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full px-4 py-3 text-white shadow-lg"
      style={{ backgroundColor: '#25D366' }}
    >
      <MessageCircle size={20} strokeWidth={2} />
      <span
        className="hidden sm:inline text-sm"
        style={{ fontFamily: 'Saira, sans-serif', fontWeight: 600 }}
      >
        Fale conosco
      </span>
    </motion.a>
  )
}
