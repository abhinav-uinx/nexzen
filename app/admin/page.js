import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminLanding from '@/components/admin/AdminLanding'
import { getAdminCookieName, getAdminSession } from '@/lib/admin/auth'
import { getAdminBasePath } from '@/lib/admin/config'
import { getAllCategories } from '@/lib/catalog/products'
import { prisma } from '@/lib/database/prisma'

export const metadata = {
  title: 'Admin Dashboard | Nexzen',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminDashboardPage() {
  const adminBasePath = getAdminBasePath()
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(getAdminCookieName())?.value
  const session = await getAdminSession(sessionToken)

  if (!session) {
    redirect(`${adminBasePath}/login`)
  }

  const [categories, productCount, categoryCount, stockSnapshot, recentProducts, brandRows, allProducts] = await Promise.all([
    getAllCategories(),
    prisma.product.count(),
    prisma.category.count(),
    prisma.product.findMany({
      select: {
        stockQuantity: true,
        lowStockThreshold: true,
      },
    }),
    prisma.product.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      include: {
        category: true,
      },
    }),
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

  const lowStockCount = stockSnapshot.filter(
    (product) => product.stockQuantity <= product.lowStockThreshold
  ).length
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
    <AdminLanding
      adminBasePath={adminBasePath}
      categories={categories}
      brands={brands}
      products={products}
      stats={{
        products: productCount,
        categories: categoryCount,
        lowStock: lowStockCount,
      }}
      recentProducts={recentProducts}
    />
  )
}
