'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useCart } from '@/providers/CartProvider'
import { useAuth } from '@/providers/AuthProvider'

import styles from './ProductCard.module.css'

const badgeTones = {
  amber: 'bg-amber-100 text-amber-900',
  emerald: 'bg-emerald-100 text-emerald-900',
  rose: 'bg-rose-100 text-rose-900',
  slate: 'bg-slate-200 text-slate-900',
  violet: 'bg-violet-100 text-violet-900',
  sky: 'bg-sky-100 text-sky-900',
  orange: 'bg-orange-100 text-orange-900',
}

export default function ProductCard({ product, initiallyWishlisted = false }) {
  const router = useRouter()
  const { addToCart } = useCart()
  const { session } = useAuth()
  const [added, setAdded] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(initiallyWishlisted)
  const [isSyncing, setIsSyncing] = useState(false)

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  function handleAdd(e) {
    e.preventDefault()
    addToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  async function handleToggleWishlist(e) {
    e.preventDefault()
    e.stopPropagation()
    
    if (!session) {
      router.push('/login')
      return
    }

    if (isSyncing) return

    const nextState = !isWishlisted
    setIsWishlisted(nextState)
    setIsSyncing(true)

    try {
      const res = await fetch('/api/wishlist', {
        method: nextState ? 'POST' : 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({ productId: product.id })
      })
      
      if (!res.ok) throw new Error()
    } catch (err) {
      // Revert on failure
      setIsWishlisted(!nextState)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <article className={styles.card}>
      <Link href={`/products/${product.slug || product.id}`} className={styles.cardLink}>
        <div className={`${product.surface || ''} ${styles.surfaceWrapper}`}>
          <div className={`${styles.gradientBox} ${product.accent || ''}`}>
            <div className={styles.badgeContainer}>
              <span className={`${styles.badge} ${badgeTones[product.badgeTone] || styles.badgeDefault}`}>
                {product.badge}
              </span>
              {discount > 0 && (
                <span className={styles.discountBadge}>
                  Save {discount}%
                </span>
              )}
            </div>
            {product.imageUrl ? (
              <div className={styles.imageOuterWrapper}>
                <div className={styles.imageInnerWrapper}>
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className={styles.productImg}
                  />
                </div>
              </div>
            ) : (
              <div className={styles.noImageContainer}>
                <p className={styles.noImageFamily}>{product.family}</p>
                <p className={styles.noImageSpec}>{product.shortSpec}</p>
              </div>
            )}
          </div>
        </div>
      </Link>

      <div className={styles.contentContainer}>
        <div className={styles.textSection}>
          <p className={styles.categoryTitle}>
            {product.categoryName || 
             (typeof product.category === 'object' ? product.category.name : product.category?.replace('-', ' ')) || 
             'Product'}
          </p>
          <Link href={`/products/${product.slug || product.id}`} className={styles.titleLink}>
            <h3 className={styles.productTitle}>
              {product.name}
            </h3>
          </Link>
          <p className={styles.blurbText}>{product.blurb}</p>
        </div>

        <div className={styles.statsWrapper}>
          <span>{product.rating} rating</span>
          <span>{product.reviews} reviews</span>
        </div>

        <div className={styles.actionsContainer}>
          <div>
            <p className={styles.priceDisplay}>Rs. {product.price.toLocaleString()}</p>
            {product.originalPrice && (
              <p className={styles.originalPrice}>Rs. {product.originalPrice.toLocaleString()}</p>
            )}
          </div>
          <div className={styles.actionButtonGroup}>
            <button
              suppressHydrationWarning
              type="button"
              disabled={!product.inStock}
              onClick={handleAdd}
              className={`interactive-button ${styles.addBtn} ${
                !product.inStock
                  ? styles.btnDisabled
                  : added
                    ? styles.btnAdded
                    : styles.btnReady
              }`}
            >
              {!product.inStock ? 'Out of stock' : added ? 'Added' : 'Add to cart'}
            </button>
            <button 
              onClick={handleToggleWishlist}
              className={`${styles.wishlistActionBtn} ${isWishlisted ? styles.wishlistActive : ''}`}
              title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <svg viewBox="0 0 24 24" className={styles.heartIcon}>
                <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
