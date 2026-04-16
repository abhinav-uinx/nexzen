import Link from 'next/link'
import CategoryGrid from '@/components/storefront/CategoryGrid'
import HeroSlider from '@/components/storefront/HeroSlider'
import ProductCard from '@/components/storefront/ProductCard'
import DiscountedProducts from '@/components/storefront/DiscountedProducts'
import ScrollReveal from '@/components/storefront/ScrollReveal'
import { getAllProducts } from '@/lib/catalog/products'
import { createSupabaseServerClient } from '@/lib/auth/supabase-server'
import { getPrismaClient } from '@/lib/database/nexus-db'
import { ChevronRight } from 'lucide-react'

export const revalidate = 60

export default async function HomePage() {
  const prisma = getPrismaClient()
  const [products, highlights, collections, categories] = await Promise.all([
    getAllProducts().catch(() => []),
    prisma.siteHighlight.findMany({ orderBy: { order: 'asc' } }).catch(() => []),
    prisma.collection.findMany({ 
      where: { isActive: true },
      orderBy: { order: 'asc' } 
    }).catch(() => []),
    prisma.category.findMany({ orderBy: { name: 'asc' } }).catch(() => [])
  ])

  const trendingProducts = [...products].sort((a, b) => b.rating - a.rating).slice(0, 4)

  let wishlistedIds = []
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user?.id) {
      const items = await prisma.wishlistItem.findMany({
        where: { user: { authUserId: user.id } },
        select: { productId: true }
      })
      wishlistedIds = items.map(i => i.productId)
    }
  } catch (e) {}

  return (
    <div className="pb-24">
      <HeroSlider />

      <ScrollReveal delay={0.2}>
        <section className="px-6 py-20 sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-[1200px] gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((item) => (
              <div key={item.label} className="group rounded-[2.5rem] bg-white p-10 shadow-[0_22px_60px_rgba(0,0,0,0.03)] transition-all duration-500 hover:shadow-[0_40px_100px_rgba(0,0,0,0.08)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0066cc] mb-4">{item.label}</p>
                <h3 className="font-heading text-4xl font-bold text-black tracking-tight mb-4 group-hover:scale-105 transition-transform origin-left duration-700">{item.value}</h3>
                <p className="text-[15px] leading-relaxed text-black/50 font-medium">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <DiscountedProducts products={products} wishlistedIds={wishlistedIds} />
      </ScrollReveal>

      {collections.length > 0 && (
        <ScrollReveal>
          <section className="px-6 py-12 sm:px-8 lg:px-12">
            <div className="mx-auto grid max-w-[1200px] gap-8 lg:grid-cols-3">
              {collections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/products?category=${collection.slug}`}
                  className="group relative h-[400px] overflow-hidden rounded-[2.5rem] bg-black p-10 text-white transition-all duration-700 hover:shadow-[0_40px_100px_rgba(0,0,0,0.2)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                  <p className="relative z-10 text-[11px] font-bold uppercase tracking-[0.2em] text-white/60 mb-3">{collection.name}</p>
                  <p className="relative z-10 font-heading text-3xl font-bold tracking-tight mb-6">{collection.description}</p>
                  <div className="relative z-10 mt-auto">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black transition-all duration-300 group-hover:bg-[#f5f5f7]">
                      Explore <ChevronRight size={16} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </ScrollReveal>
      )}

      <ScrollReveal>
        <CategoryGrid categories={categories} />
      </ScrollReveal>

      <ScrollReveal>
        <section className="px-6 py-24 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1200px] rounded-[3.5rem] bg-white px-10 py-24 text-black shadow-[0_40px_120px_rgba(0,0,0,0.05)] sm:px-20 relative overflow-hidden">
            {/* Minimalist Decor */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#f5f5f7] rounded-full -mr-64 -mt-64" />

            <div className="mb-16 flex flex-col items-center text-center gap-6 relative z-10">
              <div className="max-w-3xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-black/40 mb-4">Trending Now</p>
                <h2 className="font-heading text-5xl font-bold sm:text-7xl tracking-tighter leading-[1.05] mb-8">
                  High-interest picks for builders and labs.
                </h2>
                <Link href="/products?sort=rating" className="inline-flex items-center gap-2 text-[17px] font-semibold text-[#0066cc] hover:underline">
                  Explore all trending
                  <ChevronRight size={20} />
                </Link>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
              {trendingProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  initiallyWishlisted={wishlistedIds.includes(product.id)}
                />
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>
    </div>
  )
}

