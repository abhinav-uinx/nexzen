'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { heroSlides } from '@/data/products'

export default function HeroBanner() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((value) => (value + 1) % heroSlides.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  const slide = heroSlides[current]

  return (
    <section className="relative overflow-hidden px-4 pt-6 sm:px-6 lg:px-8">
      <div className={`mx-auto max-w-7xl overflow-hidden rounded-[3rem] bg-gradient-to-br ${slide.accent} px-8 py-20 text-white shadow-[0_40px_120px_rgba(2,6,23,0.45)] transition-[background] duration-700 ease-out sm:p-12 lg:p-16`}>
        <div className="absolute inset-0 opacity-30">
          <div className="animate-float absolute left-[-4rem] top-[-6rem] h-48 w-48 rounded-full bg-cyan-300 blur-3xl opacity-20" />
          <div className="animate-float absolute bottom-[-5rem] right-[-2rem] h-56 w-56 rounded-full bg-blue-500 blur-3xl opacity-20" />
        </div>

        <div key={slide.id} className="animate-fade-up relative grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="mb-6 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-100">
              {slide.eyebrow}
            </p>
            <h1 className="font-heading text-4xl font-black leading-[1.1] sm:text-5xl lg:text-7xl uppercase">
              {slide.title}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-200 sm:text-lg lg:text-xl font-medium">
              {slide.subtitle}
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href={slide.primaryHref}
                className="interactive-button inline-flex items-center justify-center rounded-2xl bg-white px-8 py-4 text-sm font-black uppercase tracking-widest text-slate-950 transition hover:bg-cyan-50 hover:shadow-[0_20px_60px_rgba(255,255,255,0.15)] active:scale-95"
              >
                {slide.cta}
              </Link>
              <Link
                href={slide.secondaryHref}
                className="interactive-button inline-flex items-center justify-center rounded-2xl border-2 border-white/20 px-8 py-4 text-sm font-black uppercase tracking-widest text-white transition hover:bg-white/10 active:scale-95"
              >
                {slide.secondaryCta}
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="animate-soft-pop rounded-[2.5rem] border border-white/10 bg-slate-950/20 p-8 backdrop-blur-md shadow-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-200 opacity-80">Live Statistics</p>
              <div className="mt-4 flex items-baseline gap-2">
                <p className="font-heading text-5xl font-black tracking-tighter">{slide.metric.split(' ')[0]}</p>
                <p className="text-sm font-bold uppercase tracking-widest text-cyan-100">{slide.metric.split(' ').slice(1).join(' ')}</p>
              </div>
              <div className="mt-8 space-y-4 text-xs font-semibold leading-relaxed text-slate-100">
                <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 transition-colors hover:bg-white/10">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                  <span>Curated for boards, sensing, and kits.</span>
                </div>
                <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 transition-colors hover:bg-white/10">
                  <span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
                  <span>High-contrast premium hardware UI.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-8 flex gap-2">
          {heroSlides.map((item, index) => (
            <button
              key={item.id}
              suppressHydrationWarning
              type="button"
              onClick={() => setCurrent(index)}
              className={`interactive-button h-2.5 rounded-full transition-all ${index === current ? 'w-10 bg-white' : 'w-2.5 bg-white/40'}`}
              aria-label={`Show slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
