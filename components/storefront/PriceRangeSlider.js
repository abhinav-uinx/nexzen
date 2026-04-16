'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function PriceRangeSlider({ min = 0, max = 10000, step = 100 }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [minVal, setMinVal] = useState(parseInt(searchParams.get('minPrice')) || min)
  const [maxVal, setMaxVal] = useState(parseInt(searchParams.get('maxPrice')) || max)

  const syncUrl = useCallback((low, high) => {
    const params = new URLSearchParams(window.location.search)
    if (low > min) params.set('minPrice', low)
    else params.delete('minPrice')
    
    if (high < max) params.set('maxPrice', high)
    else params.delete('maxPrice')
    
    params.set('page', '1')
    router.push(`${window.location.pathname}?${params.toString()}`)
  }, [min, max, router])

  // Debounced URL sync
  useEffect(() => {
    const timer = setTimeout(() => {
      syncUrl(minVal, maxVal)
    }, 500)
    return () => clearTimeout(timer)
  }, [minVal, maxVal, syncUrl])

  const handleMinChange = (e) => {
    const value = Math.min(Number(e.target.value), maxVal - step)
    setMinVal(value)
  }

  const handleMaxChange = (e) => {
    const value = Math.max(Number(e.target.value), minVal + step)
    setMaxVal(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="rounded-xl border border-slate-100 bg-white px-3 py-1.5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Min:</span>
          <span className="ml-2 text-sm font-bold text-slate-900">₹{minVal.toLocaleString()}</span>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white px-3 py-1.5 shadow-sm text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Max:</span>
          <span className="ml-2 text-sm font-bold text-slate-900">₹{maxVal.toLocaleString()}</span>
        </div>
      </div>

      <div className="relative h-1.5 w-full rounded-full bg-slate-100">
        {/* Progress Bar */}
        <div 
          className="absolute h-full rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]"
          style={{ 
            left: `${((minVal - min) / (max - min)) * 100}%`,
            right: `${100 - ((maxVal - min) / (max - min)) * 100}%`
          }}
        />
        
        {/* Dual Inputs */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={handleMinChange}
          className="pointer-events-none absolute -top-1.5 z-20 h-4 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:active:scale-125"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxVal}
          onChange={handleMaxChange}
          className="pointer-events-none absolute -top-1.5 z-20 h-4 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:active:scale-125"
        />
      </div>
    </div>
  )
}
