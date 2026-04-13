import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminCatalogManager from '@/components/admin/AdminCatalogManager'
import { getAdminCookieName, getAdminSession } from '@/lib/admin/auth'
import { getAdminBasePath } from '@/lib/admin/config'
import { getAllCategories } from '@/lib/catalog/products'
import { prisma } from '@/lib/database/nexus-db'

export const metadata = {
  title: 'Catalog Manager | Admin Workspace',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminProductsPage() {
  const adminBasePath = getAdminBasePath()
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(getAdminCookieName())?.value
  const session = await getAdminSession(sessionToken)

  if (!session) {
    redirect(`${adminBasePath}/login`)
  }

  const [categories, brandRows, allProducts] = await Promise.all([
    getAllCategories(),
    prisma.product.findMany({
      where: {
        brand: {
          not: null,
        },
      },
      select: {
        brand: true,
      },
      distinct: ['brand'],
      orderBy: {
        brand: 'asc',
      },
    }),
    prisma.product.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        category: true,
        dependencies: {
          include: {
            dependencyProduct: {
              select: {
                sku: true,
                slug: true,
              },
            },
          },
        },
      },
    }),
  ])

  const brands = brandRows.map((row) => row.brand).filter(Boolean)
  const products = allProducts.map((product) => {
    const presentation =
      product.metadata &&
      typeof product.metadata === 'object' &&
      !Array.isArray(product.metadata) &&
      product.metadata.presentation &&
      typeof product.metadata.presentation === 'object'
        ? product.metadata.presentation
        : {}

    return {
      id: product.id,
      name: product.name,
      sku: product.sku || '',
      categoryId: product.categoryId,
      categoryName: product.category.name,
      brand: product.brand || '',
      barcode: product.barcode || '',
      status: product.status,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : '',
      costPrice: product.costPrice ? Number(product.costPrice) : '',
      stockQuantity: product.stockQuantity,
      lowStockThreshold: product.lowStockThreshold,
      weightGrams: product.weightGrams ?? '',
      requiresShipping: product.requiresShipping,
      trackInventory: product.trackInventory,
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      rating: presentation.rating ?? 4.8,
      reviews: presentation.reviews ?? 100,
      badge: presentation.badge || '',
      badgeTone: presentation.badgeTone || 'slate',
      shortSpec: presentation.shortSpec || '',
      dependencies: product.dependencies.map(
        (dependency) => dependency.dependencyProduct.sku || dependency.dependencyProduct.slug
      ),
    }
  })

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
        <AdminCatalogManager categories={categories} brands={brands} products={products} />
      </div>
    </section>
  )
}

