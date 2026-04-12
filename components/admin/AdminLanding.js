import AdminCatalogManager from '@/components/admin/AdminCatalogManager'
import AdminOrdersManager from '@/components/admin/AdminOrdersManager'

function StatCard({ label, value, note }) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-3 font-heading text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{note}</p>
    </div>
  )
}

export default function AdminLanding({ categories, brands, stats, recentProducts, products }) {
  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Admin Workspace</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold text-slate-950">Product upload and inventory control</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Add products, upload images, set pricing, stock, category, shipping flags, barcode, and dependency details exactly where your Supabase-backed catalog expects them.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Products" value={stats.products} note="Live items currently stored in your catalog." />
          <StatCard label="Categories" value={stats.categories} note="Available categories for organizing products." />
          <StatCard label="Low Stock" value={stats.lowStock} note="Items at or below their low-stock threshold." />
        </div>

        <AdminOrdersManager />

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.85fr)]">
          <AdminCatalogManager categories={categories} brands={brands} products={products} />

          <aside>
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
