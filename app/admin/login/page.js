import AdminLoginForm from '@/components/admin/AdminLoginForm'
import { getAdminBasePath } from '@/lib/admin/config'
import { Suspense } from 'react'

export const metadata = {
  title: 'Admin Login | Nexzen',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminLoginPage() {
  const adminBasePath = getAdminBasePath()

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl space-y-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Admin Access</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold text-slate-950">Sign in to manage products</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            This area is protected. Use your admin username and password to add products and upload images.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-8">
              Loading admin sign-in...
            </div>
          }
        >
          <AdminLoginForm adminBasePath={adminBasePath} />
        </Suspense>
      </div>
    </section>
  )
}
