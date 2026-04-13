import Link from 'next/link'
import CategoryGrid from '@/components/storefront/CategoryGrid'
import HeroBanner from '@/components/storefront/HeroBanner'
import ProductCard from '@/components/storefront/ProductCard'
import { collections, highlights } from '@/data/products'
import { getAllProducts } from '@/lib/catalog/products'
import { createSupabaseServerClient } from '@/lib/auth/supabase-server'
import { getPrismaClient } from '@/lib/database/nexus-db'

export default async function HomePage() {
  const products = await getAllProducts()
  const featuredProducts = products.slice(0, 4)
  const trendingProducts = [...products].sort((a, b) => b.rating - a.rating).slice(0, 4)

  // Fetch wishlist for current user
  let wishlistedIds = []
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user?.id) {
      const prisma = getPrismaClient()
      const dbUser = await prisma.user.findUnique({
        where: { authUserId: user.id },
        select: { id: true }
      })
      
      if (dbUser) {
        const items = await prisma.wishlistItem.findMany({
          where: { userId: dbUser.id },
          select: { productId: true }
        })
        wishlistedIds = items.map(i => i.productId)
      }
    }
  } catch (e) {
    console.warn('Could not fetch wishlist for SSR')
  }

  return (
    <div className="pb-8">
      <HeroBanner />

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.label} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
              <p className="text-sm uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
              <p className="mt-3 font-heading text-4xl font-semibold text-slate-950">{item.value}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Featured products</p>
              <h2 className="mt-3 font-heading text-3xl font-semibold text-slate-950 sm:text-4xl">
                The first collection for your Nexzen storefront.
              </h2>
            </div>
            <Link href="/products" className="hidden text-sm font-medium text-slate-700 transition hover:text-slate-950 sm:block">
              Browse catalog
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                initiallyWishlisted={wishlistedIds.includes(product.id)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-3">
          {collections.map((collection) => (
            <Link
              key={collection.slug}
              href={`/products?category=${collection.slug}`}
              className="group rounded-[2rem] border border-slate-200 bg-[linear-gradient(145deg,#ffffff,#eff6ff)] p-6 shadow-[0_16px_48px_rgba(15,23,42,0.06)] transition hover:-translate-y-1"
            >
              <p className="text-sm uppercase tracking-[0.24em] text-blue-700">{collection.name}</p>
              <p className="mt-4 font-heading text-2xl font-semibold text-slate-950">{collection.description}</p>
              <span
                className="mt-6 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold transition-all duration-300 group-hover:bg-blue-700 group-hover:shadow-[0_14px_30px_rgba(37,99,235,0.2)]"
                style={{ color: '#ffffff', textShadow: '0 1px 1px rgba(0,0,0,0.18)' }}
              >
                Explore collection
              </span>
            </Link>
          ))}
        </div>
      </section>

      <CategoryGrid />

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] bg-slate-950 px-6 py-10 text-white shadow-[0_30px_100px_rgba(15,23,42,0.28)] sm:px-10">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Trending now</p>
              <h2 className="mt-3 font-heading text-3xl font-semibold sm:text-4xl">
                High-interest picks for labs, clubs, and solo builders.
              </h2>
            </div>
            <Link href="/products?sort=rating" className="hidden text-sm font-medium text-slate-300 transition hover:text-white sm:block">
              Sort by rating
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
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
    </div>
  )
}
