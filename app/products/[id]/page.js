import Image from 'next/image'
import Link from 'next/link'
import ProductCard from '@/components/storefront/ProductCard'
import ProductActions from '@/components/storefront/ProductActions'
import ProductReviews from '@/components/storefront/ProductReviews'
import { getAllProducts, getProductBySlug } from '@/lib/catalog/products'

import styles from './ProductsId.module.css'

export async function generateMetadata({ params }) {
  const { id } = await params
  const product = await getProductBySlug(id)

  if (!product) {
    return {
      title: 'Product not found | Nexzen',
    }
  }

  return {
    title: `${product.name} | Nexzen`,
    description: product.blurb,
  }
}

export default async function ProductDetailsPage({ params }) {
  const { id } = await params
  const product = await getProductBySlug(id)

  if (!product) {
    return (
      <section className={styles.notFoundContainer}>
        <div className={styles.notFoundWrapper}>
          <h1 className={styles.notFoundTitle}>Product not found</h1>
          <p className={styles.notFoundDesc}>This item is not in the live catalog yet.</p>
          <Link href="/products" className={styles.notFoundBtn}>
            Back to products
          </Link>
        </div>
      </section>
    )
  }

  const relatedProducts = (await getAllProducts())
    .filter((item) => item.category === product.category && item.slug !== product.slug)
    .slice(0, 3)

  return (
    <section className={styles.container}>
      <div className={styles.maxWrapper}>
        <div className={styles.mainGrid}>
          <div className={`${product.surface || ''} ${styles.heroSurface}`}>
            <div className={`${styles.heroGradientBox} ${product.accent || ''}`}>
              <p className={styles.heroFamily}>{product.family}</p>
              <h1 className={styles.heroTitle}>{product.name}</h1>
              <p className={styles.heroBlurb}>{product.blurb}</p>
              {product.imageUrl && (
                <div className={styles.heroImageOuter}>
                  <div className={styles.heroImageInner}>
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className={styles.heroImageObj}
                      priority
                    />
                  </div>
                </div>
              )}
              <div className={styles.featureGrid}>
                <div className={styles.featureBox}>
                  <p className={styles.featureLabel}>Primary spec</p>
                  <p className={styles.featureValue}>{product.shortSpec}</p>
                </div>
                <div className={styles.featureBox}>
                  <p className={styles.featureLabel}>Availability</p>
                  <p className={styles.featureValue}>{product.inStock ? 'In stock' : 'Restocking soon'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.infoSurface}>
            <p className={styles.infoSubtitle}>Product details</p>
            <h2 className={styles.price}>
              Rs. {product.price.toLocaleString()}
            </h2>
            {product.originalPrice && (
              <p className={styles.originalPrice}>Rs. {product.originalPrice.toLocaleString()}</p>
            )}
            <p className={styles.blurbText}>{product.blurb}</p>

            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <p className={styles.statLabel}>Rating</p>
                <p className={styles.statValue}>{product.rating} from {product.reviews} reviews</p>
              </div>
              <div className={styles.statBox}>
                <p className={styles.statLabel}>Category</p>
                <p className={styles.statValue}>{product.categoryName}</p>
              </div>
            </div>

            <ProductActions product={product} />

            <div className={styles.linksList}>
              <Link
                href="/cart"
                className={`interactive-button ${styles.cartBtn}`}
                style={{ color: '#ffffff', textShadow: '0 1px 1px rgba(0,0,0,0.18)' }}
              >
                Open cart
              </Link>
              <Link href="/products" className={styles.browsingBtn}>
                Continue browsing
              </Link>
            </div>
          </div>
        </div>

        <ProductReviews productId={product.id} />

        {relatedProducts.length > 0 && (
          <div>
            <h2 className={styles.relatedTitle}>Related products</h2>
            <div className={styles.relatedGrid}>
              {relatedProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
