import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getAdminCookieName, getAdminSession } from '@/lib/admin/auth'
import { getAdminBasePath } from '@/lib/admin/config'
import AdminOrdersManager from '@/components/admin/AdminOrdersManager'

export const metadata = {
  title: 'Active Orders | Nexzen Admin',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminOrdersPage() {
  const adminBasePath = getAdminBasePath()
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(getAdminCookieName())?.value
  const session = await getAdminSession(sessionToken)

  if (!session) {
    redirect(`${adminBasePath}/login`)
  }

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Orders Dashboard</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold text-slate-950">Active Orders Pipeline</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Monitor and manage incoming orders in real-time. Use the search to quickly locate specific order footprints.
          </p>
        </div>

        <AdminOrdersManager />
      </div>
    </section>
  )
}
