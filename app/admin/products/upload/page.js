import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getAdminCookieName, getAdminSession } from '@/lib/admin/auth'
import { getAdminBasePath } from '@/lib/admin/config'
import { getAllCategories } from '@/lib/catalog/products'
import { prisma } from '@/lib/database/nexus-db'
import ProductForm from '@/components/admin/ProductForm'
import Link from 'next/link'

export const metadata = {
  title: 'Upload Product | Admin Workspace',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function UploadProductPage() {
  const adminBasePath = getAdminBasePath()
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(getAdminCookieName())?.value
  const session = await getAdminSession(sessionToken)

  if (!session) {
    redirect(`${adminBasePath}/login`)
  }

  const [categories, brandRows] = await Promise.all([
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
  ])

  const brands = brandRows.map((row) => row.brand).filter(Boolean)

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
        <ProductForm categories={categories} brands={brands} mode="create" />
      </div>
    </section>
  )
}

