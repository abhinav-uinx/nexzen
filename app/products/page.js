import { getAllCategories, getPaginatedProducts, getProductCount } from '@/lib/catalog/products'
import { createSupabaseServerClient } from '@/lib/auth/supabase-server'
import { getPrismaClient } from '@/lib/database/nexus-db'
import Pagination from '@/components/storefront/Pagination'

export default async function ProductsPage({ searchParams }) {
  const params = await searchParams
  const page = parseInt(params.page) || 1
  const limit = 15 // Increased to 15 for a nice 5-column layout
  const category = params.category
  const query = params.query
  const sort = params.sort || 'newest'

  const [categories, products, totalItems] = await Promise.all([
    getAllCategories(),
    getPaginatedProducts({ page, limit, category, query, sort }),
    getProductCount({ category, query })
  ])

  const totalPages = Math.ceil(totalItems / limit)
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="mt-3 font-heading text-4xl font-semibold text-slate-950">
                {categoryName || 'All products'}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                {query
                  ? `Showing matches for "${query}" across our entire inventory.`
                  : 'Browse our curated selection of high-performance components and development boards.'}
              </p>
            </div>
            
            <div className="flex gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span>Showing {products.length} of {totalItems} items</span>
            </div>
          </div>
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
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              initiallyWishlisted={wishlistedIds.includes(product.id)}
            />
          ))}
        </div>

        {products.length === 0 && (
          <div className="mt-8 rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            No products matched this filter yet. Try another category or a simpler search term.
          </div>
        )}

        {/* Pagination Section */}
        <Pagination 
          currentPage={page} 
          totalPages={totalPages} 
          baseUrl="/products" 
          queryParams={{ ...params }} 
        />
      </div>
    </section>
  )
}
