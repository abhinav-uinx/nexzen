import Image from 'next/image'
import Link from 'next/link'
import ProductCard from '@/components/storefront/ProductCard'
import ProductActions from '@/components/storefront/ProductActions'
import ProductReviews from '@/components/storefront/ProductReviews'
import { getAllProducts, getProductBySlug } from '@/lib/catalog/products'

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
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
          <h1 className="font-heading text-3xl font-semibold text-slate-950">Product not found</h1>
          <p className="mt-3 text-slate-600">This item is not in the live catalog yet.</p>
          <Link href="/products" className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
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
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div className={`${product.surface} rounded-[2rem] border border-slate-200 p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-8`}>
            <div className={`min-h-[28rem] rounded-[1.75rem] bg-gradient-to-br ${product.accent} p-8 text-white`}>
              <p className="text-sm uppercase tracking-[0.22em] text-white/70">{product.family}</p>
              <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight sm:text-5xl">{product.name}</h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/80">{product.blurb}</p>
              {product.imageUrl && (
                <div className="mt-8 rounded-[1.5rem] border border-white/15 bg-white/12 p-4 backdrop-blur-sm">
                  <div className="relative h-72 overflow-hidden rounded-[1.2rem] border border-white/20 bg-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] sm:h-80">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-contain p-4 drop-shadow-[0_24px_40px_rgba(15,23,42,0.25)]"
                      priority
                    />
                  </div>
                </div>
              )}
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/70">Primary spec</p>
                  <p className="mt-2 text-lg font-semibold">{product.shortSpec}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/70">Availability</p>
                  <p className="mt-2 text-lg font-semibold">{product.inStock ? 'In stock' : 'Restocking soon'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-8">
            <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Product details</p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-slate-950">
              Rs. {product.price.toLocaleString()}
            </h2>
            {product.originalPrice && (
              <p className="mt-2 text-sm text-slate-400 line-through">Rs. {product.originalPrice.toLocaleString()}</p>
            )}
            <p className="mt-6 text-base leading-7 text-slate-600">{product.blurb}</p>

            <div className="mt-8 grid gap-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Rating</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{product.rating} from {product.reviews} reviews</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Category</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{product.categoryName}</p>
              </div>
            </div>

            <ProductActions product={product} />

            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/cart"
                className="interactive-button inline-flex justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold transition hover:bg-blue-700 hover:shadow-[0_16px_36px_rgba(37,99,235,0.24)]"
                style={{ color: '#ffffff', textShadow: '0 1px 1px rgba(0,0,0,0.18)' }}
              >
                Open cart
              </Link>
              <Link href="/products" className="inline-flex justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950">
                Continue browsing
              </Link>
            </div>
          </div>
        </div>

        <ProductReviews productId={product.id} />

        {relatedProducts.length > 0 && (
          <div>
            <h2 className="font-heading text-3xl font-semibold text-slate-950">Related products</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
