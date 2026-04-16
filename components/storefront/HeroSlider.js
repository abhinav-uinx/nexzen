'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function HeroSlider() {
  const [banners, setBanners] = useState([])
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [loading, setLoading] = useState(true)
  const [direction, setDirection] = useState(0)
  const lastScrollTime = useRef(0)

  const fetchBanners = useCallback(async () => {
    try {
      const res = await fetch('/api/banners')
      const data = await res.json()
      if (data.banners && data.banners.length > 0) {
        setBanners(data.banners)
      }
    } catch (error) {
      console.error('Failed to load banners:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBanners()
  }, [fetchBanners])

  useEffect(() => {
    if (isPaused || banners.length <= 1) return

    const timer = setInterval(() => {
      setDirection(1)
      setCurrent((prev) => (prev + 1) % banners.length)
    }, 6000)

    return () => clearInterval(timer)
  }, [isPaused, banners.length])

  const paginate = (newDirection) => {
    setDirection(newDirection)
    if (newDirection === 1) {
      setCurrent((prev) => (prev + 1) % banners.length)
    } else {
      setCurrent((prev) => (prev === 0 ? banners.length - 1 : prev - 1))
    }
  }

  const handleWheel = (e) => {
    const now = Date.now()
    if (now - lastScrollTime.current < 1500) return

    if (Math.abs(e.deltaX) > 50) {
      if (e.deltaX > 0) paginate(1)
      else paginate(-1)
      lastScrollTime.current = now
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[1440px] px-6 py-6 transition-all duration-1000">
        <div className="aspect-[21/9] w-full animate-pulse rounded-[2.5rem] bg-black/5" />
      </div>
    )
  }

  if (banners.length === 0) return null

  const slide = banners[current]

  return (
    <section 
      className="relative px-4 py-4 sm:px-6 lg:px-8 overflow-hidden group focus:outline-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onWheel={handleWheel}
    >
      <div className="mx-auto max-w-[1440px] relative aspect-[3/4] sm:aspect-[16/7] md:aspect-[21/8] overflow-hidden rounded-[2.5rem] bg-black">
        
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute inset-0"
          >
            {/* Image Background */}
            <div className="absolute inset-0">
              <Image
                src={slide.imageUrl}
                alt={slide.title}
                fill
                priority
                className="object-cover object-center scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            </div>

            {/* Content Overlay */}
            <div className="relative h-full flex flex-col items-center justify-center p-8 text-center sm:p-16 lg:p-24 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
              <div className="max-w-3xl">
                {slide.eyebrow && (
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="mb-4 text-[10px] sm:text-[12px] uppercase tracking-[0.4em] text-white/70 font-bold"
                  >
                     {slide.eyebrow}
                  </motion.p>
                )}
                
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="font-heading text-2xl font-bold text-white sm:text-6xl lg:text-8xl leading-[1.1] tracking-tight text-balance uppercase"
                >
                  {slide.title}
                </motion.h2>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="mt-6 text-sm sm:text-xl text-white/90 font-medium max-w-xl mx-auto line-clamp-3"
                >
                  {slide.subtitle}
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
                >
                  {slide.link && (
                    <Link 
                      href={slide.link}
                      className="w-full sm:w-auto rounded-xl bg-white px-8 py-4 text-sm sm:text-base font-bold text-black hover:bg-white/90 transition-all active:scale-[0.98] uppercase tracking-widest"
                    >
                      {slide.ctaText || 'Learn more'}
                    </Link>
                  )}
                  {slide.secondaryHref && (
                    <Link 
                      href={slide.secondaryHref}
                      className="text-sm sm:text-base font-semibold text-white hover:underline transition-all flex items-center gap-1"
                    >
                      {slide.secondaryCtaText || 'Buy'} <ChevronRight size={18} />
                    </Link>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button
          onClick={() => paginate(-1)}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-black/10 text-white opacity-0 backdrop-blur-md transition-all hover:bg-black/30 group-hover:opacity-100"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={() => paginate(1)}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-black/10 text-white opacity-0 backdrop-blur-md transition-all hover:bg-black/30 group-hover:opacity-100"
        >
          <ChevronRight size={24} />
        </button>

        {/* Progress Navigation (Dots) */}
        {banners.length > 1 && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-20">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`h-2 rounded-full transition-all duration-500 ease-out ${idx === current ? 'w-10 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'}`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

