'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useCart } from '@/providers/CartProvider'

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

export default function ProductCard({ product }) {
  const { addToCart } = useCart()
  const [added, setAdded] = useState(false)

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  function handleAdd(e) {
    e.preventDefault()
    addToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
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
          <p className={styles.categoryTitle}>{product.categoryName || product.category.replace('-', ' ')}</p>
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
        </div>
      </div>
    </article>
  )
}
