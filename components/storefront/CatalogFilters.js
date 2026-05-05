'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import PriceRangeSlider from './PriceRangeSlider'

export default function CatalogFilters({
  availability = '',
  minPrice = 0,
  maxPrice = 25000,
  onAvailabilityChange,
  onPriceChange,
  onClearAll,
}) {
  const containerRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (availability) count += 1
    if (minPrice > 0 || maxPrice < 25000) count += 1
    return count
  }, [availability, minPrice, maxPrice])

  useEffect(() => {
    function handleOutsideClick(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`inline-flex h-11 items-center gap-3 rounded-xl border px-4 text-sm font-semibold transition-all ${
          isOpen || activeFilterCount > 0
            ? 'border-blue-600 bg-blue-50 text-blue-700'
            : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50'
        }`}
      >
        <SlidersHorizontal size={16} />
        Filters
        {activeFilterCount > 0 ? (
          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {activeFilterCount}
          </span>
        ) : null}
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-[calc(100%+0.75rem)] z-40 w-[min(92vw,26rem)] rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.14)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Refine Results</p>
              <h3 className="mt-2 text-base font-semibold text-slate-950">Filter products</h3>
            </div>
            {activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900"
              >
                Clear all
              </button>
            ) : null}
          </div>

          <div className="mt-5 space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Availability</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onAvailabilityChange?.('')}
                  className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                    !availability
                      ? 'bg-slate-950 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => onAvailabilityChange?.('in-stock')}
                  className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                    availability === 'in-stock'
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-300'
                  }`}
                >
                  In stock
                </button>
                <button
                  type="button"
                  onClick={() => onAvailabilityChange?.('out-of-stock')}
                  className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                    availability === 'out-of-stock'
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-300'
                  }`}
                >
                  Out of stock
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Price</p>
              <PriceRangeSlider
                min={0}
                max={25000}
                step={500}
                compact
                value={{ min: minPrice, max: maxPrice }}
                onChange={onPriceChange}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
