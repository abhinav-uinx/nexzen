import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CouponManager from '@/components/admin/CouponManager'
import { getAdminCookieName, getAdminSession } from '@/lib/admin/auth'
import { getAdminBasePath } from '@/lib/admin/config'

export const metadata = {
  title: 'Coupon Management | Nexzen Admin',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminCouponsPage() {
  const adminBasePath = getAdminBasePath()
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(getAdminCookieName())?.value
  const session = await getAdminSession(sessionToken)

  if (!session) {
    redirect(`${adminBasePath}/login`)
  }

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <Link
            href={adminBasePath}
            className="text-sm font-semibold text-slate-600 hover:text-slate-950"
          >
            &larr; Back to Dashboard
          </Link>
        </div>
        <CouponManager />
      </div>
    </section>
  )
}
