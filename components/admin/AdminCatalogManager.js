'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import ProductForm from '@/components/admin/ProductForm'
import Pagination from '@/components/storefront/Pagination'
import { getAdminBasePath } from '@/lib/admin/config'
import { withAdminHeaders } from '@/lib/admin/client'
import * as XLSX from 'xlsx'
import { DownloadCloud, Filter, SlidersHorizontal, X } from 'lucide-react'

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

export default function AdminCatalogManager({ 
  categories, 
  brands, 
  products, 
  currentPage, 
  totalPages, 
  totalItems 
}) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [actionError, setActionError] = useState('')
  const [deletePending, startDeleteTransition] = useTransition()
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filterState, setFilterState] = useState({
    minPrice: '',
    maxPrice: '',
    selectedBrands: [],
    isIoT: false,
    lowStock: false,
  })
  const adminBasePath = getAdminBasePath()

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) || null,
    [products, selectedProductId]
  )

  function handleSearch(e) {
    if (e.key === 'Enter') {
      applyFilters()
    }
  }

  function applyFilters() {
    const params = new URLSearchParams(window.location.search)
    
    if (searchTerm) params.set('query', searchTerm)
    else params.delete('query')

    if (filterState.minPrice) params.set('minPrice', filterState.minPrice)
    else params.delete('minPrice')

    if (filterState.maxPrice) params.set('maxPrice', filterState.maxPrice)
    else params.delete('maxPrice')

    if (filterState.selectedBrands.length > 0) params.set('brands', filterState.selectedBrands.join(','))
    else params.delete('brands')

    if (filterState.isIoT) params.set('iot', 'true')
    else params.delete('iot')

    if (filterState.lowStock) params.set('lowStock', 'true')
    else params.delete('lowStock')

    params.set('page', '1')
    router.push(`${window.location.pathname}?${params.toString()}`)
  }

  function toggleBrand(brandName) {
    setFilterState(prev => ({
      ...prev,
      selectedBrands: prev.selectedBrands.includes(brandName)
        ? prev.selectedBrands.filter(b => b !== brandName)
        : [...prev.selectedBrands, brandName]
    }))
  }

  function resetFilters() {
    setFilterState({
      minPrice: '',
      maxPrice: '',
      selectedBrands: [],
      isIoT: false,
      lowStock: false,
    })
    setSearchTerm('')
    router.push(window.location.pathname)
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(`Delete ${product.name}? This cannot be undone.`)
    if (!confirmed) return
    setActionError('')
    startDeleteTransition(async () => {
      const response = await fetch('/api/admin/products', {
        method: 'DELETE',
        headers: withAdminHeaders({ 'Content-Type': 'application/json' }),
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
  
  function handleExportExcel() {
    if (!products.length) return
    
    // Prepare data for Excel
    const data = products.map(p => ({
      'SKU': p.sku || 'N/A',
      'Name': p.name,
      'Category': p.categoryName,
      'Brand': p.brand || 'No brand',
      'Current Stock': p.stockQuantity ?? 0,
      'Selling Price (INR)': p.price,
      'Retail Price (INR)': p.originalPrice || p.price,
      'Barcode': p.barcode || 'N/A',
      'Status': p.status,
      'Weight (g)': p.weightGrams || 0,
    }))
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data)
    
    // Set column widths for better readability
    const wscols = [
      { wch: 15 }, // SKU
      { wch: 35 }, // Name
      { wch: 15 }, // Category
      { wch: 15 }, // Brand
      { wch: 12 }, // Stock
      { wch: 18 }, // Selling Price
      { wch: 18 }, // Retail Price
      { wch: 20 }, // Barcode
      { wch: 10 }, // Status
      { wch: 10 }, // Weight
    ]
    worksheet['!cols'] = wscols
    
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Nexzen Inventory")
    
    // Generate and download
    XLSX.writeFile(workbook, `nexzen_catalog_export_${new Date().toISOString().split('T')[0]}.xlsx`)
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
            <p className="text-sm uppercase tracking-[0.24em] text-blue-700 font-bold">Catalog Manager</p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-slate-950">Added products</h2>
            <p className="mt-2 text-sm text-slate-600">
              Showing {products.length} of {totalItems} recorded products.
            </p>
          </div>
          
          <div className="flex flex-1 max-w-2xl items-center gap-3">
             <div className="flex-1 flex gap-2">
                <button
                  suppressHydrationWarning
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border transition-all ${
                    isFilterOpen ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-300 bg-white text-slate-500 hover:border-slate-950 hover:text-slate-950'
                  }`}
                  title="Toggle Filters"
                >
                  {isFilterOpen ? <X size={20} /> : <SlidersHorizontal size={20} />}
                </button>
                <div className="relative flex-1">
                  <input
                    suppressHydrationWarning
                    type="text"
                    placeholder="Search & hit Enter..."
                    className="w-full rounded-full border border-slate-300 pl-5 pr-12 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-sm transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleSearch}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                </div>
             </div>
             
             <button
               suppressHydrationWarning
               onClick={handleExportExcel}
               disabled={products.length === 0}
               className="group flex h-[46px] items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 text-sm font-bold text-emerald-700 transition-all hover:bg-emerald-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <DownloadCloud className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
               <span className="hidden sm:inline">Export Excel</span>
             </button>
          </div>

          {selectedProduct && (
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => setSelectedProductId(null)}
              className="interactive-button inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-950 hover:text-slate-950"
            >
              Exit edit mode
            </button>
          )}
        </div>

        {isFilterOpen && (
          <div className="mt-8 relative rounded-3xl border border-slate-100 bg-slate-50/50 p-6 animate-apple-fade">
             <button 
              onClick={() => setIsFilterOpen(false)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-900 md:hidden"
             >
               <X size={18} />
             </button>
             <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
               {/* Price Filter */}
               <div className="space-y-3">
                 <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Price Range (₹)</p>
                 <div className="flex items-center gap-2">
                   <input 
                     type="number" 
                     placeholder="Min" 
                     value={filterState.minPrice}
                     onChange={(e) => setFilterState(prev => ({ ...prev, minPrice: e.target.value }))}
                     className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500" 
                   />
                   <span className="text-slate-300">-</span>
                   <input 
                     type="number" 
                     placeholder="Max" 
                     value={filterState.maxPrice}
                     onChange={(e) => setFilterState(prev => ({ ...prev, maxPrice: e.target.value }))}
                     className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500" 
                   />
                 </div>
               </div>

               {/* Brands Filter */}
               <div className="space-y-3">
                 <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Filter by Brand</p>
                 <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto pr-2 scrollbar-thin">
                   {brands.map(brand => (
                     <button
                       key={brand.id || brand}
                       onClick={() => toggleBrand(brand.name || brand)}
                       className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-widest transition-all ${
                         filterState.selectedBrands.includes(brand.name || brand)
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white border border-slate-200 text-slate-500 hover:border-blue-400'
                       }`}
                     >
                       {brand.name || brand}
                     </button>
                   ))}
                 </div>
               </div>

               {/* Flags Filter */}
               <div className="space-y-3">
                 <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Quick Flags</p>
                 <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={filterState.isIoT} 
                        onChange={(e) => setFilterState(prev => ({ ...prev, isIoT: e.target.checked }))}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                      />
                      <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600">IoT & Smart Tech</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={filterState.lowStock} 
                        onChange={(e) => setFilterState(prev => ({ ...prev, lowStock: e.target.checked }))}
                        className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500" 
                      />
                      <span className="text-sm font-medium text-slate-700 group-hover:text-rose-600">Low Stock Alert</span>
                    </label>
                 </div>
               </div>

               {/* Actions */}
               <div className="flex flex-col justify-end gap-2">
                 <button 
                  onClick={applyFilters}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
                 >
                   Apply Filters
                 </button>
                 <button 
                  onClick={resetFilters}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-all"
                 >
                   Clear All
                 </button>
               </div>
             </div>
          </div>
        )}

        {actionError && (
          <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {actionError}
          </p>
        )}

        <div className="mt-8 grid gap-4">
          {products.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500 text-center">
              {searchTerm ? 'No products match your search.' : 'No products yet. Add your first product above.'}
            </p>
          ) : (
            products.map((product) => (
              <div key={product.id} className="rounded-[1.5rem] border border-slate-200 px-5 py-4 hover:border-blue-200 transition-colors bg-white">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500 font-bold">
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
                      suppressHydrationWarning
                      type="button"
                      onClick={() => setSelectedProductId(product.id)}
                      className="interactive-button rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      suppressHydrationWarning
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

        {/* Admin Pagination */}
        <div className="mt-8 border-t border-slate-100 pt-6">
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            baseUrl={`${adminBasePath}/products`}
            queryParams={{ query: searchTerm }}
          />
        </div>
      </div>
    </div>
  )
}
