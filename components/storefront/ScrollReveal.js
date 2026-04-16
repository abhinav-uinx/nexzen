'use client'

import { motion } from 'framer-motion'
import { useRef } from 'react'

export default function ScrollReveal({ children, delay = 0, direction = 'up', distance = 20, duration = 0.8 }) {
  const ref = useRef(null)
  
  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? distance : direction === 'down' ? -distance : 0,
      x: direction === 'left' ? distance : direction === 'right' ? -distance : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: duration,
        delay: delay,
        ease: [0.25, 0.1, 0.25, 1], // Apple-like easing
      },
    },
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
      variants={variants}
    >
      {children}
    </motion.div>
  )
}
