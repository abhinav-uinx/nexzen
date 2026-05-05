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

function formatMoney(value) {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN')}`
}

function EmptyState({ message }) {
  return <p className="text-sm text-slate-500">{message}</p>
}

function formatBadgeValue(value) {
  if (!value) {
    return ''
  }

  if (value > 99) {
    return '99+'
  }

  return `${value}`
}

function AdminActionLink({ href, children, tone = 'blue', icon, badge = null }) {
  const toneClasses = {
    blue: 'hover:border-blue-300 hover:bg-blue-50/70 hover:text-blue-700 hover:shadow-[0_14px_34px_rgba(37,99,235,0.12)]',
    slate: 'hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 hover:shadow-[0_14px_34px_rgba(15,23,42,0.1)]',
    emerald: 'hover:border-emerald-300 hover:bg-emerald-50/70 hover:text-emerald-700 hover:shadow-[0_14px_34px_rgba(5,150,105,0.12)]',
  }

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-3 justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-[transform,border-color,background-color,color,box-shadow] duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] ${toneClasses[tone] || toneClasses.blue}`}
    >
      <span className="inline-flex items-center justify-center">{icon}</span>
      {children}
      {badge ? (
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-50 px-2 text-[11px] font-bold leading-none text-blue-700 ring-1 ring-blue-200">
          {formatBadgeValue(badge)}
        </span>
      ) : null}
    </Link>
  )
}

export default function AdminLanding({
  adminBasePath = '/nexzen-control-room',
  stats,
  analytics,
  recentProducts,
}) {
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
            <AdminActionLink href={`${adminBasePath}/products/upload`} tone="blue" icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            }>
              Upload New Product
            </AdminActionLink>
            <AdminActionLink href={`${adminBasePath}/products`} tone="slate" icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"></path><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>
            }>
              Manage Catalog
            </AdminActionLink>
            <AdminActionLink href={`${adminBasePath}/orders`} tone="blue" badge={analytics?.operations?.pendingOrders || null} icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path><path d="M15 18H9"></path><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-2.235-2.794A2 2 0 0 0 17.006 9H15"></path><circle cx="7" cy="18" r="2"></circle><circle cx="17" cy="18" r="2"></circle></svg>
            }>
              Manage Active Orders
            </AdminActionLink>
            <AdminActionLink href={`${adminBasePath}/crm`} tone="slate" icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            }>
              Launch CRM Engine
            </AdminActionLink>
            <AdminActionLink href={`${adminBasePath}/categories`} tone="blue" icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"></path></svg>
            }>
              Edit Category Architecture
            </AdminActionLink>
            <AdminActionLink href={`${adminBasePath}/brands`} tone="blue" icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10h10V2zM12 12H2v10h10V12zM22 2h-10v10h10V2zM22 12h-10v10h10V12z"></path></svg>
            }>
              Manage Brands
            </AdminActionLink>
            <AdminActionLink href={`${adminBasePath}/coupons`} tone="emerald" icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>
            }>
              Manage Coupons & Discounts
            </AdminActionLink>
            <AdminActionLink href={`${adminBasePath}/banners`} tone="slate" icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            }>
              Manage Hero Banners
            </AdminActionLink>
            <AdminActionLink href={`${adminBasePath}/highlights`} tone="blue" icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20M7 7l10 10M17 7L7 10"></path></svg>
            }>
              Manage Highlights
            </AdminActionLink>
            <AdminActionLink href={`${adminBasePath}/collections`} tone="slate" icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"></path></svg>
            }>
              Manage Collections
            </AdminActionLink>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Products" value={stats.products} note="Live items currently stored in your catalog." />
          <StatCard label="Categories" value={stats.categories} note="Available categories for organizing products." />
          <StatCard label="Low Stock" value={stats.lowStock} note="Items at or below their low-stock threshold." />
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <StatCard label="Revenue" value={formatMoney(analytics?.revenue?.paidTotal)} note={`${analytics?.revenue?.orderCount || 0} paid orders processed so far.`} />
          <StatCard label="Orders Today" value={analytics?.operations?.ordersToday || 0} note="Fresh order volume since midnight." />
          <StatCard label="Pending Orders" value={analytics?.operations?.pendingOrders || 0} note="Orders waiting on action or fulfillment." />
          <StatCard label="Stock Alerts" value={analytics?.stockAlerts?.activeAlerts || 0} note={`${analytics?.stockAlerts?.notifiedAlerts || 0} alerts have already been fulfilled.`} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
              <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Top Searches</p>
              <div className="mt-4 space-y-3">
                {(analytics?.searches?.top || []).length === 0 ? (
                  <EmptyState message="Search data will show up here once customers start exploring the catalog." />
                ) : (
                  analytics.searches.top.map((search) => (
                    <div key={search.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-medium text-slate-950">{search.query}</p>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{search.searchCount}x</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Last searched {new Date(search.lastSearchedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
              <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Back In Stock Watchlist</p>
              <div className="mt-4 space-y-3">
                {(analytics?.stockAlerts?.topProducts || []).length === 0 ? (
                  <EmptyState message="No active stock alerts yet. Once customers subscribe, the most-requested products will surface here." />
                ) : (
                  analytics.stockAlerts.topProducts.map((entry) => (
                    <div key={entry.productId} className="rounded-2xl border border-slate-200 px-4 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-medium text-slate-950">{entry.product?.name || 'Removed product'}</p>
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{entry.watchCount} alerts</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        {entry.product?.inStock ? 'Back in stock' : `Current stock ${entry.product?.stockQuantity ?? 0}`}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
              <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Recent Products</p>
              <div className="mt-4 space-y-3">
                {recentProducts.length === 0 ? (
                  <EmptyState message="No products yet. Your next upload will appear here." />
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

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
              <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Low Stock Priority</p>
              <div className="mt-4 space-y-3">
                {(analytics?.stockAlerts?.lowStockProducts || []).length === 0 ? (
                  <EmptyState message="No low-stock products right now. Inventory is looking healthy." />
                ) : (
                  analytics.stockAlerts.lowStockProducts.map((product) => (
                    <div key={product.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                      <p className="font-medium text-slate-950">{product.name}</p>
                      <p className="mt-2 text-sm text-slate-600">Stock {product.stockQuantity} • Threshold {product.lowStockThreshold}</p>
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
