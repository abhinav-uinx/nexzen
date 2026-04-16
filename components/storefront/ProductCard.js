'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useCart } from '@/providers/CartProvider'
import { useAuth } from '@/providers/AuthProvider'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, ShoppingBag } from 'lucide-react'

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

export default function ProductCard({ product, initiallyWishlisted = false, variant = 'grid' }) {
  const isList = variant === 'list'
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
    setTimeout(() => setAdded(false), 1500)
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
      setIsWishlisted(!nextState)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <motion.article 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className={`${styles.card} ${isList ? styles.listVariant : ''}`}
    >
      <Link href={`/p/${product.id}`} className={isList ? styles.listCardLink : styles.cardLink}>
        <div className={`${product.surface || ''} ${isList ? styles.listSurfaceWrapper : styles.surfaceWrapper}`}>
          <div className={`${isList ? styles.listGradientBox : styles.gradientBox}`}>
            <div className={styles.badgeContainer}>
              {product.badge && (
                <span className={`${styles.badge} ${badgeTones[product.badgeTone] || styles.badgeDefault}`}>
                  {product.badge}
                </span>
              )}
              {discount > 0 && (
                <span className={styles.discountBadge}>
                  -{discount}%
                </span>
              )}
            </div>
            {product.imageUrl ? (
              <div className={isList ? styles.listImageOuterWrapper : styles.imageOuterWrapper}>
                <div className={isList ? styles.listImageInnerWrapper : styles.imageInnerWrapper}>
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes={isList ? "200px" : "(max-width: 768px) 50vw, 25vw"}
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

      <div className={isList ? styles.listContentContainer : styles.contentContainer}>
        <div className={isList ? styles.listTextSection : styles.textSection}>
          <div>
            <p className={styles.categoryTitle}>
              {product.categoryName || 
               (typeof product.category === 'object' ? product.category.name : product.category?.replace('-', ' ')) || 
               'Product'}
            </p>
            <Link href={`/p/${product.id}`} className={styles.titleLink}>
              <h3 className={isList ? styles.listProductTitle : styles.productTitle}>
                {product.name}
              </h3>
            </Link>
            <p className={`${styles.blurbText} ${isList ? styles.listBlurbText : ''}`}>{product.blurb}</p>
          </div>
          
          <div className={isList ? styles.listStatsWrapper : styles.statsWrapper}>
            <span>{product.rating} Rating</span>
            <span>{product.reviews} Reviews</span>
          </div>
        </div>

        <div className={isList ? styles.listActionsContainer : styles.actionsContainer}>
          <div className="flex flex-col">
            <p className={isList ? styles.listPriceDisplay : styles.priceDisplay}>Rs. {product.price.toLocaleString()}</p>
            {product.originalPrice && (
              <p className={isList ? styles.listOriginalPrice : styles.originalPrice}>Rs. {product.originalPrice.toLocaleString()}</p>
            )}
          </div>
          <div className={styles.actionButtonGroup}>
            <button
              disabled={!product.inStock}
              onClick={handleAdd}
              suppressHydrationWarning={true}
              className={`interactive-button ${styles.addBtn} ${
                !product.inStock
                  ? styles.btnDisabled
                  : added
                    ? styles.btnAdded
                    : styles.btnReady
              }`}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={added ? 'added' : 'ready'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-center gap-2"
                >
                  {!product.inStock ? 'Out of stock' : added ? 'Added' : (
                    <>
                      <ShoppingBag size={16} />
                      Buy
                    </>
                  )}
                </motion.span>
              </AnimatePresence>
            </button>
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={handleToggleWishlist}
              suppressHydrationWarning={true}
              className={`${styles.wishlistActionBtn} ${isWishlisted ? styles.wishlistActive : ''}`}
            >
              <Heart 
                size={20} 
                className={styles.heartIcon} 
                fill={isWishlisted ? "currentColor" : "none"} 
              />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

