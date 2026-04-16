import Link from 'next/link'
import Image from 'next/image'
import ProductCard from '@/components/storefront/ProductCard'
import ProductActions from '@/components/storefront/ProductActions'
import ProductReviews from '@/components/storefront/ProductReviews'
import ImageGallery from '@/components/storefront/ImageGallery'
import VariantSelector from '@/components/storefront/VariantSelector'
import ProductAccordions from '@/components/storefront/ProductAccordions'
import { getAllProducts, getProductByIdOrSlug } from '@/lib/catalog/products'
import { MapPin, Truck, ShieldCheck, RefreshCcw } from 'lucide-react'

export async function generateMetadata({ params }) {
  const { id } = await params
  const product = await getProductByIdOrSlug(id)
  if (!product) return { title: 'Product not found' }
  return {
    title: `${product.name} | Nexzen`,
    description: product.blurb,
  }
}

export default async function ProductDetailsPage({ params }) {
  const { id } = await params
  const product = await getProductByIdOrSlug(id)

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

  const relatedProducts = (await getAllProducts())
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 4)

  const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0

  return (
    <div className="bg-white min-h-screen pb-32 lg:pb-0 font-sans">
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

            {/* Product description / Blurb */}
            {product.blurb && (
              <div className="mt-8 border-l-2 border-slate-950 pl-6 py-2">
                <p className="text-sm font-medium leading-relaxed text-slate-600">
                  {product.blurb}
                </p>
              </div>
            )}

            {/* Selection Logic */}
            <VariantSelector flavours={product.flavours} sizes={product.sizes} />

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
      </div>

      {/* Sticky Bottom Bar (Mobile Only) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-100 bg-white/95 p-4 backdrop-blur-xl lg:hidden shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
        <ProductActions product={product} layout="sticky" />
      </div>
    </div>
  )
}

