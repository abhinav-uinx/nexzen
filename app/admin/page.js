import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminLanding from '@/components/admin/AdminLanding'
import { getAdminDashboardAnalytics } from '@/lib/admin/analytics'
import { getAdminCookieName, getAdminSession } from '@/lib/admin/auth'
import { getAdminBasePath } from '@/lib/admin/config'
import { getAllCategories } from '@/lib/catalog/products'
import { prisma } from '@/lib/database/nexus-db'

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

  const [categories, productCount, categoryCount, stockSnapshot, recentProducts, brandRows, analytics] = await Promise.all([
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
    getAdminDashboardAnalytics(),
  ])

  const lowStockCount = stockSnapshot.filter(
    (product) => product.stockQuantity <= product.lowStockThreshold
  ).length
  const brands = brandRows.map((row) => row.brand).filter(Boolean)

  return (
    <AdminLanding
      adminBasePath={adminBasePath}
      categories={categories}
      brands={brands}
      stats={{
        products: productCount,
        categories: categoryCount,
        lowStock: lowStockCount,
      }}
      analytics={analytics}
      recentProducts={recentProducts}
    />
  )
}

