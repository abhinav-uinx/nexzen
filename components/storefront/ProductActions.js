'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/providers/CartProvider'
import { Plus, Minus, ShoppingCart, Zap } from 'lucide-react'

export default function ProductActions({ product, layout = 'default' }) {
  const { addToCart } = useCart()
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  function handleAddToCart() {
    for (let i = 0; i < quantity; i++) {
      addToCart(product)
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  function handleBuyNow() {
    addToCart(product)
    router.push('/cart')
  }

  if (layout === 'on-style' || layout === 'sticky') {
    return (
      <div className={`flex flex-col gap-4 ${layout === 'sticky' ? 'w-full max-w-lg mx-auto sm:flex-row' : ''}`}>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            suppressHydrationWarning
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Minus size={16} />
          </button>
          <span className="w-12 text-center text-sm font-bold text-slate-900">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            suppressHydrationWarning
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="flex flex-1 gap-2">
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            suppressHydrationWarning
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold uppercase tracking-widest transition-all active:scale-[0.98] ${
              added ? 'bg-emerald-500 text-white' : 'bg-slate-950 text-white hover:bg-slate-800'
            }`}
          >
            <ShoppingCart size={18} />
            {added ? 'Added!' : 'Add to Cart'}
          </button>
          <button
            onClick={handleBuyNow}
            disabled={!product.inStock}
            suppressHydrationWarning
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-blue-700 active:scale-[0.98]"
          >
            <Zap size={18} fill="currentColor" />
            Buy it Now
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <button
        suppressHydrationWarning
        type="button"
        onClick={handleAddToCart}
        disabled={!product.inStock}
        className={`interactive-button inline-flex justify-center rounded-full px-8 py-4 text-sm font-bold transition-all duration-300 ${
          !product.inStock
            ? 'cursor-not-allowed bg-slate-100 text-slate-400'
            : added
              ? 'bg-emerald-500 text-white shadow-[0_12px_24px_rgba(16,185,129,0.3)]'
              : 'bg-slate-950 text-white hover:bg-blue-700 hover:shadow-[0_12px_24px_rgba(37,99,235,0.24)]'
        }`}
      >
        {!product.inStock ? 'Out of stock' : added ? 'Added to cart' : 'Add to cart'}
      </button>
    </div>
  )
}

