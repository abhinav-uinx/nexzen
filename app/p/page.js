import Link from 'next/link'
import ProductCard from '@/components/storefront/ProductCard'
import { getAllCategories, getAllProducts } from '@/lib/catalog/products'
import { createSupabaseServerClient } from '@/lib/auth/supabase-server'
import { getPrismaClient } from '@/lib/database/nexus-db'

function sortProducts(items, sort) {
  switch (sort) {
    case 'price-asc':
      return [...items].sort((a, b) => a.price - b.price)
    case 'price-desc':
      return [...items].sort((a, b) => b.price - a.price)
    case 'rating':
      return [...items].sort((a, b) => b.rating - a.rating)
    case 'newest':
      return [...items]
    default:
      return items
  }
}

export default async function ProductsPage({ searchParams }) {
  const params = await searchParams
  const [categories, products] = await Promise.all([
    getAllCategories(),
    getAllProducts(),
  ])

  const category = params.category
  const query = params.query?.toLowerCase()
  const sort = params.sort

  const filtered = products.filter((product) => {
    const matchesCategory = category ? product.category === category : true
    const matchesQuery = query
      ? `${product.name} ${product.family} ${product.blurb}`.toLowerCase().includes(query)
      : true

    return matchesCategory && matchesQuery
  })

  const sortedProducts = sortProducts(filtered, sort)
  const categoryName = categories.find((item) => item.slug === category)?.name

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
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Catalog</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold text-slate-950">
            {categoryName || 'All products'}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            {query
              ? `Showing matches for "${params.query}" with live catalog data from Supabase.`
              : 'Your storefront is now reading products from the real database instead of the static starter file.'}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/products" className="interactive-button rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition-all duration-300 hover:border-blue-500 hover:bg-blue-50 hover:text-slate-950 hover:shadow-[0_14px_32px_rgba(59,130,246,0.12)]">
            Reset filters
          </Link>
          {categories.map((item) => (
            <Link
              key={item.id}
              href={`/products?category=${item.slug}`}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                item.slug === category
                  ? 'interactive-button border-slate-950 bg-slate-950 font-medium !text-white hover:border-blue-600 hover:bg-blue-600 hover:!text-white hover:shadow-[0_16px_34px_rgba(37,99,235,0.22)]'
                  : 'interactive-button border-slate-200 bg-white text-slate-700 transition-all duration-300 hover:border-blue-500 hover:bg-blue-50 hover:text-slate-950 hover:shadow-[0_14px_32px_rgba(59,130,246,0.12)]'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="mt-8 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {sortedProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              initiallyWishlisted={wishlistedIds.includes(product.id)}
            />
          ))}
        </div>

        {sortedProducts.length === 0 && (
          <div className="mt-8 rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            No products matched this filter yet. Try another category or a simpler search term.
          </div>
        )}
      </div>
    </section>
  )
}
