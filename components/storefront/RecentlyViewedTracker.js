'use client'

import { useEffect } from 'react'

const STORAGE_KEY = 'recentlyViewedProducts'

export default function RecentlyViewedTracker({ product }) {
  useEffect(() => {
    if (!product?.id) {
      return
    }

    const nextEntry = {
      id: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl: product.imageUrl,
      price: product.price,
      originalPrice: product.originalPrice || null,
      categoryName: product.categoryName,
      category: product.category,
      family: product.family,
      blurb: product.blurb,
      rating: product.rating,
      reviews: product.reviews,
      inStock: product.inStock,
      badge: product.badge,
      badgeTone: product.badgeTone,
      surface: product.surface,
    }

    const raw = window.localStorage.getItem(STORAGE_KEY)
    const current = raw ? JSON.parse(raw) : []
    const merged = [nextEntry, ...current.filter((item) => item.id !== product.id)].slice(0, 8)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  }, [product])

  return null
}
