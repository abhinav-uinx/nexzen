'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import ProductForm from '@/components/admin/ProductForm'

function buildInitialValues(product) {
  return {
    id: product.id,
    name: product.name || '',
    sku: product.sku || '',
    categoryId: product.categoryId || '',
    brand: product.brand || '',
    barcode: product.barcode || '',
    status: product.status || 'ACTIVE',
    price: product.price ?? '',
    compareAtPrice: product.compareAtPrice ?? '',
    costPrice: product.costPrice ?? '',
    stockQuantity: product.stockQuantity ?? 0,
    lowStockThreshold: product.lowStockThreshold ?? 5,
    weightGrams: product.weightGrams ?? '',
    rating: product.rating ?? 4.8,
    reviews: product.reviews ?? 100,
    badge: product.badge || '',
    badgeTone: product.badgeTone || 'slate',
    requiresShipping: product.requiresShipping ?? true,
    trackInventory: product.trackInventory ?? true,
    shortSpec: product.shortSpec || '',
    dependencies: (product.dependencies || []).join(', '),
    shortDescription: product.shortDescription || '',
    description: product.description || '',
  }
}

export default function AdminCatalogManager({ categories, brands, products }) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [actionError, setActionError] = useState('')
  const [deletePending, startDeleteTransition] = useTransition()

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) || null,
    [products, selectedProductId]
  )

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) return products
    return products.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      p.brand.toLowerCase().includes(term) ||
      p.barcode.toLowerCase().includes(term) ||
      p.categoryName.toLowerCase().includes(term)
    )
  }, [products, searchTerm])

  async function handleDelete(product) {
    const confirmed = window.confirm(`Delete ${product.name}? This cannot be undone.`)
    if (!confirmed) return
    setActionError('')
    startDeleteTransition(async () => {
      const response = await fetch('/api/admin/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id }),
      })
      const result = await response.json()
      if (!response.ok) {
        setActionError(result.error || 'Unable to delete product.')
        return
      }
      if (selectedProductId === product.id) setSelectedProductId(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-8">
      {selectedProduct && (
        <ProductForm
          key={selectedProduct.id}
          categories={categories}
          brands={brands}
          mode="edit"
          initialValues={buildInitialValues(selectedProduct)}
          onCancelEdit={() => setSelectedProductId(null)}
          onSaved={() => {
            setSelectedProductId(null)
            setActionError('')
            router.refresh()
          }}
        />
      )}

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Catalog Manager</p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-slate-950">Added products</h2>
            <p className="mt-2 text-sm text-slate-600">Edit or delete products already stored in your live catalog.</p>
          </div>
          
          <div className="flex flex-1 max-w-md gap-3">
             <input
              type="text"
              placeholder="Search by name, SKU, brand..."
              className="w-full rounded-full border border-slate-300 px-5 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {selectedProduct && (
            <button
              type="button"
              onClick={() => setSelectedProductId(null)}
              className="interactive-button inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-950 hover:text-slate-950"
            >
              Exit edit mode
            </button>
          )}
        </div>

        {actionError && (
          <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {actionError}
          </p>
        )}

        <div className="mt-8 grid gap-4">
          {filteredProducts.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
              {searchTerm ? 'No products match your search.' : 'No products yet. Add your first product above.'}
            </p>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="rounded-[1.5rem] border border-slate-200 px-5 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      {product.sku || 'No SKU'} • {product.categoryName} • {product.barcode || 'No Barcode'} • {product.status}
                    </p>
                    <h3 className="font-heading text-2xl font-semibold text-slate-950">{product.name}</h3>
                    <p className="text-sm text-slate-600">
                      Rs. {Number(product.price).toLocaleString()} • Stock {product.stockQuantity} • {product.brand || 'No brand'}
                    </p>
                    {((product.flavours && product.flavours.length > 0) || (product.sizes && product.sizes.length > 0)) && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {product.flavours?.map(f => (
                          <span key={f} className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {f}
                          </span>
                        ))}
                        {product.sizes?.map(s => (
                          <span key={s.label} className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {s.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedProductId(product.id)}
                      className="interactive-button rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={deletePending}
                      onClick={() => handleDelete(product)}
                      className="interactive-button rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
