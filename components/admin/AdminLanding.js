import AdminCatalogManager from '@/components/admin/AdminCatalogManager'
import Link from 'next/link'

function StatCard({ label, value, note }) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-3 font-heading text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{note}</p>
    </div>
  )
}

export default function AdminLanding({ adminBasePath = '/nexzen-control-room', categories, brands, stats, recentProducts }) {
  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Admin Workspace</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold text-slate-950">Product upload and inventory control</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Add products, upload images, set pricing, stock, category, shipping flags, barcode, and dependency details exactly where your Supabase-backed catalog expects them.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link 
              href={`${adminBasePath}/products/upload`}
              className="inline-flex items-center gap-2 justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-all duration-200 hover:border-blue-600 hover:border-[3px] hover:shadow-lg active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Upload New Product
            </Link>
            <Link 
              href={`${adminBasePath}/products`}
              className="inline-flex items-center gap-2 justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-all duration-200 hover:border-slate-900 hover:border-[3px] hover:shadow-lg active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"></path><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>
              Manage Catalog
            </Link>
            <Link 
              href={`${adminBasePath}/crm`}
              className="inline-flex items-center gap-2 justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-all duration-200 hover:border-slate-900 hover:border-[3px] hover:shadow-lg active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              Launch CRM Engine
            </Link>
            <Link 
              href={`${adminBasePath}/orders`}
              className="inline-flex items-center gap-2 justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-all duration-200 hover:border-blue-600 hover:border-[3px] hover:shadow-lg active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path><path d="M15 18H9"></path><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-2.235-2.794A2 2 0 0 0 17.006 9H15"></path><circle cx="7" cy="18" r="2"></circle><circle cx="17" cy="18" r="2"></circle></svg>
              Manage Active Orders
            </Link>
            <Link 
              href={`${adminBasePath}/categories`}
              className="inline-flex items-center gap-2 justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-all duration-200 hover:border-blue-600 hover:border-[3px] hover:shadow-lg active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"></path></svg>
              Manage Categories
            </Link>
            <Link 
              href={`${adminBasePath}/brands`}
              className="inline-flex items-center gap-2 justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-all duration-200 hover:border-blue-600 hover:border-[3px] hover:shadow-lg active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10h10V2zM12 12H2v10h10V12zM22 2h-10v10h10V2zM22 12h-10v10h10V12z"></path></svg>
              Manage Brands
            </Link>
            <Link 
              href={`${adminBasePath}/coupons`}
              className="inline-flex items-center gap-2 justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-all duration-200 hover:border-emerald-600 hover:border-[3px] hover:shadow-lg active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>
              Manage Coupons & Discounts
            </Link>
            <Link 
              href={`${adminBasePath}/banners`}
              className="inline-flex items-center gap-2 justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-all duration-200 hover:border-slate-950 hover:border-[3px] hover:shadow-lg active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
              Manage Banner Slider
            </Link>
            <Link 
              href={`${adminBasePath}/highlights`}
              className="inline-flex items-center gap-2 justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-all duration-200 hover:border-blue-600 hover:border-[3px] hover:shadow-lg active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20M7 7l10 10M17 7L7 10"></path></svg>
              Manage Highlights
            </Link>
            <Link 
              href={`${adminBasePath}/collections`}
              className="inline-flex items-center gap-2 justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-all duration-200 hover:border-slate-950 hover:border-[3px] hover:shadow-lg active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"></path></svg>
              Manage Collections
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Products" value={stats.products} note="Live items currently stored in your catalog." />
          <StatCard label="Categories" value={stats.categories} note="Available categories for organizing products." />
          <StatCard label="Low Stock" value={stats.lowStock} note="Items at or below their low-stock threshold." />
        </div>


        <div>
          <aside className="max-w-xl">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
              <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Recent Products</p>
              <div className="mt-4 space-y-3">
                {recentProducts.length === 0 ? (
                  <p className="text-sm text-slate-500">No products yet. Your next upload will appear here.</p>
                ) : (
                  recentProducts.map((product) => (
                    <div key={product.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                      <p className="font-medium text-slate-950">{product.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{product.sku || 'No SKU'} • {product.category.name}</p>
                      <p className="mt-2 text-sm text-slate-600">Stock {product.stockQuantity} • {product.status}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
