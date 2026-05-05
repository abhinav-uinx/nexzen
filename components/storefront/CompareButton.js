'use client'

import { useEffect, useState } from 'react'
import { GitCompareArrows } from 'lucide-react'

const STORAGE_KEY = 'nexzen:compare-products'

export function readCompareItems() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function writeCompareItems(items) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent('nexzen:compare-updated', { detail: items }))
}

export function removeCompareItem(productId) {
  const currentItems = readCompareItems()
  writeCompareItems(currentItems.filter((item) => item.id !== productId))
}

export function clearCompareItems() {
  writeCompareItems([])
}

export function useCompareItems() {
  const [items, setItems] = useState([])

  useEffect(() => {
    const sync = () => setItems(readCompareItems())
    sync()
    window.addEventListener('storage', sync)
    window.addEventListener('nexzen:compare-updated', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('nexzen:compare-updated', sync)
    }
  }, [])

  return items
}

export function buildCompareEntry(product) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    imageUrl: product.imageUrl || '',
    categoryName: product.categoryName || '',
    price: product.price || 0,
    originalPrice: product.originalPrice || null,
    rating: product.rating || 0,
    reviews: product.reviews || 0,
    inStock: product.inStock,
    shortSpec: product.shortSpec || '',
    blurb: product.blurb || '',
    family: product.family || '',
  }
}

export default function CompareButton({ product, className = '' }) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    const sync = () => {
      const items = readCompareItems()
      setActive(items.some((item) => item.id === product.id))
    }

    sync()
    window.addEventListener('storage', sync)
    window.addEventListener('nexzen:compare-updated', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('nexzen:compare-updated', sync)
    }
  }, [product.id])

  function toggleCompare(event) {
    event.preventDefault()
    event.stopPropagation()

    const currentItems = readCompareItems()
    const exists = currentItems.some((item) => item.id === product.id)

    if (exists) {
      removeCompareItem(product.id)
      return
    }

    const nextItems = [buildCompareEntry(product), ...currentItems].slice(0, 4)
    writeCompareItems(nextItems)
  }

  return (
    <button
      type="button"
      onClick={toggleCompare}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
        active ? 'bg-blue-50 text-blue-600' : 'bg-[#f5f5f7] text-black/30 hover:bg-[#e8e8ed] hover:text-blue-600'
      } ${className}`}
      title={active ? 'Remove from compare' : 'Add to compare'}
    >
      <GitCompareArrows size={18} />
    </button>
  )
}
