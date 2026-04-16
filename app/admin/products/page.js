import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminCatalogManager from '@/components/admin/AdminCatalogManager'
import { getAdminCookieName, getAdminSession } from '@/lib/admin/auth'
import { getAdminBasePath } from '@/lib/admin/config'
import { getAllCategories, getPaginatedProducts, getProductCount } from '@/lib/catalog/products'
import { prisma } from '@/lib/database/nexus-db'

export const metadata = {
  title: 'Catalog Manager | Admin Workspace',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminProductsPage({ searchParams }) {
  const params = await searchParams
  const page = parseInt(params.page) || 1
  const limit = 20
  const query = params.query
  const minPrice = params.minPrice
  const maxPrice = params.maxPrice
  const brandsFilter = params.brands
  const iot = params.iot === 'true'
  const lowStock = params.lowStock === 'true'

  const adminBasePath = getAdminBasePath()
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(getAdminCookieName())?.value
  const session = await getAdminSession(sessionToken)

  if (!session) {
    redirect(`${adminBasePath}/login`)
  }

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
      query, 
      sort: 'newest',
      minPrice,
      maxPrice,
      brands: brandsFilter,
      iot,
      lowStock 
    }),
    getProductCount({ 
      query,
      minPrice,
      maxPrice,
      brands: brandsFilter,
      iot,
      lowStock
    })
  ])

  const brands = brandRows.map((row) => row.brand).filter(Boolean)
  const totalPages = Math.ceil(totalItems / limit)

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <Link
            href={adminBasePath}
            className="text-sm font-semibold text-slate-600 hover:text-slate-950"
          >
            &larr; Back to Admin Dashboard
          </Link>
        </div>
        <AdminCatalogManager 
          categories={categories} 
          brands={brands} 
          products={products} 
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
        />
      </div>
    </section>
  )
}

