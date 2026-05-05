'use client'

import { useEffect, useState } from 'react'
import ProductCard from '@/components/storefront/ProductCard'

const STORAGE_KEY = 'recentlyViewedProducts'

export default function RecentlyViewedShelf({ currentProductId = null, title = 'Recently viewed' }) {
  const [items, setItems] = useState([])

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const current = raw ? JSON.parse(raw) : []
    const filtered = current.filter((item) => item.id !== currentProductId).slice(0, 4)
    setItems(filtered)
  }, [currentProductId])

  if (items.length === 0) {
    return null
  }

  return (
    <section className="mt-24">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-blue-700">Keep exploring</p>
          <h2 className="mt-3 font-heading text-3xl font-semibold text-slate-950">{title}</h2>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
    </section>
  )
}
