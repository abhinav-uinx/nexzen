'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X, ChevronRight, Zap } from 'lucide-react'
import PriceRangeSlider from './PriceRangeSlider'
import Link from 'next/link'

export default function CatalogFilters({ categories, brands, currentCategory }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('query') || '')
  
  const selectedBrands = searchParams.get('brands')?.split(',') || []
  const isIoT = searchParams.get('iot') === 'true'

  useEffect(() => {
    if (searchParams.get('filter') === 'open') {
      setIsOpen(true)
    }
  }, [searchParams])

  function applyQuickFilter(key, value) {
    const params = new URLSearchParams(window.location.search)
    if (value) params.set(key, value)
    else params.delete(key)
    params.set('page', '1')
    router.push(`${window.location.pathname}?${params.toString()}`)
  }

  function toggleBrand(brandName) {
    const current = new Set(selectedBrands)
    if (current.has(brandName)) current.delete(brandName)
    else current.add(brandName)
    
    const brandsArr = Array.from(current)
    applyQuickFilter('brands', brandsArr.length > 0 ? brandsArr.join(',') : null)
  }

  function handleSearch(e) {
    if (e.key === 'Enter') {
      applyQuickFilter('query', searchTerm)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Search & Toggle Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 max-w-2xl items-center">
          <div className="relative flex-1 group">
            <button
              suppressHydrationWarning
              onClick={() => setIsOpen(!isOpen)}
              className={`absolute left-1.5 top-1.5 z-10 flex h-[42px] w-[42px] items-center justify-center rounded-xl transition-all ${
                isOpen ? 'text-blue-600' : 'text-slate-900 group-focus-within:text-blue-600'
              }`}
              title="Toggle Filters"
            >
              {isOpen ? <X size={18} /> : <SlidersHorizontal size={18} />}
            </button>
            <input
              suppressHydrationWarning
              type="text"
              placeholder="Search catalog... (hit Enter)"
              className="w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-14 py-3.5 text-sm ring-blue-600/10 transition-all focus:border-blue-600 focus:outline-none focus:ring-4 placeholder:text-slate-400 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors">
              <Search size={20} />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
           <button
             suppressHydrationWarning
             onClick={() => applyQuickFilter('iot', !isIoT ? 'true' : null)}
             className={`flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-bold transition-all ${
               isIoT 
                ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200' 
                : 'border-slate-200 bg-white text-slate-600 hover:border-blue-600 hover:text-blue-600'
             }`}
           >
             <Zap size={16} fill={isIoT ? 'currentColor' : 'none'} />
             <span>IoT Selection</span>
           </button>
        </div>
      </div>

      {/* Expandable Filter Panel */}
      {isOpen && (
        <div className="grid gap-8 rounded-[2rem] border border-slate-100 bg-slate-50/50 p-8 animate-apple-fade lg:grid-cols-3">
          {/* Categories */}
          <div className="space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Categories</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/p"
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  !currentCategory 
                    ? 'bg-slate-950 text-white shadow-lg' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-950'
                }`}
              >
                All Gear
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/p?category=${cat.slug}`}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    currentCategory === cat.slug 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-600'
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Brands */}
          <div className="space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Manufacturers</p>
            <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto scrollbar-thin pr-2">
              {brands.map((brand) => (
                <button
                  key={brand}
                  onClick={() => toggleBrand(brand)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    selectedBrands.includes(brand)
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-600 hover:text-emerald-600'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Budget Range (₹)</p>
            <PriceRangeSlider min={0} max={25000} step={500} />
            <p className="text-[10px] text-slate-400 leading-relaxed italic mt-2">
              Prices represent current retail value in India. All taxes inclusive.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
