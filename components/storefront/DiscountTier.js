'use client'

import { useState } from 'react'
import ProductCard from './ProductCard'

export default function DiscountTier({ percentage, items, view, wishlistedIds }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const isMultiple = items.length > 1

  function handleNext() {
    setCurrentIndex((prev) => (prev + 1) % items.length)
  }

  return (
    <div className="group relative flex flex-col gap-8 h-full">
      {/* Tier Header with "On Top" Badge */}
      <div className="flex items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-[13px] font-bold text-white shadow-[0_6px_16px_rgba(37,99,235,0.25)] shrink-0">
            {percentage}%
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Limited Offer</p>
        </div>
        
        {/* Manual Navigation Button */}
        {isMultiple && (
          <button 
            onClick={handleNext}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm transition-all hover:scale-105 hover:border-blue-500 hover:text-blue-600 active:scale-95 shrink-0"
            title="Next item"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Product Display Container */}
      <div className="relative flex-1">
        <div key={currentIndex} className="animate-fade-up transition-all duration-500 ease-out h-full">
          <ProductCard 
            product={items[currentIndex]} 
            variant={view}
            initiallyWishlisted={wishlistedIds.includes(items[currentIndex].id)}
          />
        </div>
      </div>
    </div>
  )
}
