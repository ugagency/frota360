'use client'

import { useEffect, useRef, useState } from 'react'
import { animate, useInView } from 'framer-motion'

export function useCountUp(target: number, duration = 2.2) {
  // biome-ignore lint: any is intentional here for ref compatibility
  // eslint-disable-next-line
  const ref = useRef<HTMLElement>(null)
  const [count, setCount] = useState(0)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    const controls = animate(0, target, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setCount(Math.round(v)),
    })
    return controls.stop
  }, [isInView, target, duration])

  return { count, ref }
}
