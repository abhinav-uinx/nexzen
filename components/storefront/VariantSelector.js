'use client'

import { useState } from 'react'

export default function VariantSelector({ flavours = [], sizes = [], onSelect }) {
  const [selectedFlavour, setSelectedFlavour] = useState(flavours[0] || null)
  const [selectedSize, setSelectedSize] = useState(sizes[0]?.label || null)

  return (
    <div className="space-y-8 mt-6">
      {/* Flavour Selector */}
      {flavours.length > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Version / Type</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {flavours.map((flavour) => (
              <button
                key={flavour}
                onClick={() => {
                  setSelectedFlavour(flavour)
                  onSelect?.({ flavour, size: selectedSize })
                }}
                suppressHydrationWarning
                className={`rounded border-2 px-6 py-3 text-xs font-bold transition-all duration-200 ${
                  selectedFlavour === flavour
                    ? 'border-slate-950 bg-slate-950 text-white shadow-lg'
                    : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
                }`}
              >
                {flavour.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size Selector */}
      {sizes.length > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Configuration</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size.label}
                onClick={() => {
                  setSelectedSize(size.label)
                  onSelect?.({ flavour: selectedFlavour, size: size.label })
                }}
                suppressHydrationWarning
                className={`flex flex-col items-center justify-center rounded border-2 px-8 py-3 transition-all duration-200 ${
                  selectedSize === size.label
                    ? 'border-slate-950 bg-slate-100 text-slate-950'
                    : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
                }`}
              >
                <span className="text-sm font-bold">{size.label}</span>
                {size.price && <span className="mt-0.5 text-[10px] opacity-60">Rs. {size.price}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
