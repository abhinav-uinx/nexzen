import { cache } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ProductCard from '@/components/storefront/ProductCard'
import ProductActions from '@/components/storefront/ProductActions'
import ProductReviews from '@/components/storefront/ProductReviews'
import ImageGallery from '@/components/storefront/ImageGallery'
import PincodeChecker from '@/components/storefront/PincodeChecker'
import VariantSelector from '@/components/storefront/VariantSelector'
import ProductAccordions from '@/components/storefront/ProductAccordions'
import RecentlyViewedShelf from '@/components/storefront/RecentlyViewedShelf'
import RecentlyViewedTracker from '@/components/storefront/RecentlyViewedTracker'
import StockAlertButton from '@/components/storefront/StockAlertButton'
import { getProductByIdOrSlug, getRelatedProductsByCategory } from '@/lib/catalog/products'
import { Truck, ShieldCheck, RefreshCcw } from 'lucide-react'

const getCachedProduct = cache(getProductByIdOrSlug)

export async function generateMetadata({ params }) {
  const { id } = await params
  const product = await getCachedProduct(id)
  if (!product) return { title: 'Product not found' }
  return {
    title: `${product.name} | Nexzen`,
    description: product.blurb,
  }
}

export default async function ProductDetailsPage({ params }) {
  const { id } = await params
  const product = await getCachedProduct(id)

  if (!product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Product not found</h1>
        <Link href="/products" className="mt-6 font-bold text-blue-600 hover:underline">
          Back to Catalog
        </Link>
      </div>
    )
  }

  const relatedProducts = await getRelatedProductsByCategory(product.category, product.id, 4)

  const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0

  return (
    <div className="bg-white min-h-screen pb-32 lg:pb-0 font-sans">
      <RecentlyViewedTracker product={product} />
      <div className="mx-auto max-w-[1440px] px-6 py-10 lg:px-12 lg:py-20">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-start">
          
          {/* Left: Image Gallery */}
          <div className="lg:sticky lg:top-28 h-fit">
            <ImageGallery images={product.gallery} />
            
            {/* Desktop Features List */}
            <div className="mt-12 hidden grid-cols-2 gap-6 lg:grid">
              {[
                { icon: ShieldCheck, title: 'Authenticity Guarantee', desc: '100% genuine hardware' },
                { icon: Truck, title: 'Express Shipping', desc: 'Secure delivery in 2-4 days' },
                { icon: RefreshCcw, title: 'Easy Returns', desc: '7-day hassle-free replacement' }
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-950">
                    <feature.icon size={20} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-950">{feature.title}</h4>
                    <p className="mt-1 text-[11px] text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="flex flex-col">
            <div className="border-b border-slate-100 pb-8">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-950 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                  {product.categoryName}
                </span>
                {discount > 0 && (
                  <span className="rounded-full bg-rose-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                    {discount}% OFF
                  </span>
                )}
              </div>
              
              <h1 className="mt-8 text-4xl font-black leading-tight tracking-tight text-slate-950 lg:text-5xl uppercase">
                {product.name}
              </h1>
              
              <div className="mt-10 flex items-baseline gap-4">
                <span className="text-5xl font-black tracking-tighter text-slate-950">Rs. {product.price.toLocaleString()}</span>
                {product.originalPrice && (
                  <span className="text-2xl font-bold text-slate-300 line-through decoration-slate-400">
                    Rs. {product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">MRP Inclusive of all taxes</p>
            </div>

            {/* Selection Logic */}
            <VariantSelector flavours={product.flavours} sizes={product.sizes} />

            <PincodeChecker />

            <div className="mt-6">
              <StockAlertButton product={product} />
            </div>

            {/* Main CTA */}
            <div className="mt-12">
              <ProductActions product={product} layout="on-style" />
            </div>

            {/* Details Accordion */}
            <ProductAccordions details={product.details} />
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-32 pt-20 border-t-4 border-slate-950">
          <ProductReviews productId={product.id} density="compact" />
        </div>

        {/* Related Products */}
        {product.dependencyProducts?.length > 0 && (
          <div className="mt-24 rounded-[2rem] border border-slate-200 bg-slate-50 p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-blue-700">Recommended extras</p>
                <h2 className="mt-3 font-heading text-3xl font-semibold text-slate-950">Frequently paired with this build.</h2>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-slate-600">
                Accessory and dependency suggestions come from the admin inventory relationships, so bundles can match the actual hardware stack.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {product.dependencyProducts.map((item) => (
                <Link
                  key={`${item.id}-${item.quantity}`}
                  href={`/p/${item.slug}`}
                  className="group flex items-center gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-[0_14px_36px_rgba(37,99,235,0.08)]"
                >
                  <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-slate-100">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="80px" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-950 group-hover:text-blue-700">{item.name}</p>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        {item.isOptional ? 'Optional' : `Qty ${item.quantity}`}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.shortDescription || 'Useful companion hardware for this setup.'}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-950">Rs. {item.price.toLocaleString('en-IN')}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {relatedProducts.length > 0 && (
          <div className="mt-32">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-950 decoration-blue-600 underline-offset-8">Complete the Setup</h2>
            <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4">
              {relatedProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        )}

        <RecentlyViewedShelf currentProductId={product.id} title="Continue where you left off" />
      </div>

      {/* Sticky Bottom Bar (Mobile Only) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-100 bg-white/95 p-4 backdrop-blur-xl lg:hidden shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
        <ProductActions product={product} layout="sticky" />
      </div>
    </div>
  )
}

