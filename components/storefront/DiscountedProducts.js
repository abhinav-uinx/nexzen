'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import ProductCard from './ProductCard'
import SectionToggle from './SectionToggle'
import DiscountTier from './DiscountTier'

export default function DiscountedProducts({ products, wishlistedIds }) {
  const [view, setView] = useState('grid')

  const groups = useMemo(() => {
    const discounted = products.filter(p => p.originalPrice > p.price)
    const grouped = discounted.reduce((acc, p) => {
      const discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
      if (!acc[discount]) acc[discount] = []
      acc[discount].push(p)
      return acc
    }, {})

    // Sort by discount percentage descending
    return Object.entries(grouped)
      .sort(([a], [b]) => parseInt(b) - parseInt(a))
  }, [products])

  if (groups.length === 0) return null

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.3em] text-blue-700 font-bold mb-3">Limited Time Offers</p>
            <h2 className="font-heading text-4xl font-bold text-slate-950 sm:text-5xl leading-[1.1]">
              Precision components at exceptional value.
            </h2>
          </div>
          <div className="flex items-center justify-end">
            <Link href="/products" className="group flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-slate-950">
              View all
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-12">
          {groups.map(([percentage, items]) => (
            <div key={percentage} className="snap-start shrink-0 w-[85vw] sm:w-[340px]">
              <DiscountTier 
                percentage={percentage}
                items={items}
                view={view}
                wishlistedIds={wishlistedIds}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
