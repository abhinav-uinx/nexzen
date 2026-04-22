import Link from 'next/link'
import ProductCard from '@/components/storefront/ProductCard'
import { getAllCategories, getPaginatedProducts, getProductCount } from '@/lib/catalog/products'
import { createSupabaseServerClient } from '@/lib/auth/supabase-server'
import { getPrismaClient, prisma } from '@/lib/database/nexus-db'
import CatalogFilters from '@/components/storefront/CatalogFilters'

export default async function ProductsPage({ searchParams }) {
  const params = await searchParams
  const category = params.category
  const query = params.query
  const sort = params.sort || 'newest'
  const minPrice = params.minPrice
  const maxPrice = params.maxPrice
  const brandsFilter = params.brands
  const iot = params.iot === 'true'
  const page = parseInt(params.page) || 1
  const limit = 20

  const [categories, brandRows, products, totalItems] = await Promise.all([
    getAllCategories(),
    prisma.product.findMany({
      where: { brand: { not: null } },
      select: { brand: true },
      distinct: ['brand'],
      orderBy: { brand: 'asc' },
    }),
    getPaginatedProducts({ 
      page, 
      limit, 
      category,
      query, 
      sort,
      minPrice,
      maxPrice,
      brands: brandsFilter,
      iot
    }),
    getProductCount({ 
      category,
      query,
      minPrice,
      maxPrice,
      brands: brandsFilter,
      iot
    })
  ])

  const brands = brandRows.map((row) => row.brand).filter(Boolean)
  const categoryName = categories.find((item) => item.slug === category)?.name

  // Fetch wishlist for current user
  let wishlistedIds = []
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user?.id) {
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
          <p className="text-sm uppercase tracking-[0.24em] text-blue-700 font-bold">Catalog</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold text-slate-950">
            {categoryName || 'All products'}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            {params.query
              ? `Showing matches for "${params.query}" across our premium hardware inventory.`
              : 'Engineered for modern builders. Explore our curated selection of maker kits and development boards.'}
          </p>
          
          <div className="mt-8 border-t border-slate-100 pt-8">
            <CatalogFilters 
              categories={categories} 
              brands={brands} 
              currentCategory={category}
            />
          </div>
        </div>

        <div className="mt-6 sm:mt-12 grid gap-3 sm:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
      </div>
    </section>
  )
}
