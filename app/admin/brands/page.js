'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState([])
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState({ error: '', success: '' })
  const [editingBrand, setEditingBrand] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchBrands = async (query = '') => {
    const res = await fetch(`/api/admin/brands?query=${encodeURIComponent(query)}`)
    const data = await res.json()
    if (Array.isArray(data)) setBrands(data)
  }

  useEffect(() => {
    fetchBrands(searchQuery)
  }, [searchQuery])

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this brand? This will fail if products are linked to it.')) return
    const res = await fetch(`/api/admin/brands/${id}`, {
      method: 'DELETE',
    })
    const data = await res.json()
    if (res.ok) {
      setStatus({ error: '', success: 'Brand deleted successfully!' })
      fetchBrands(searchQuery)
    } else {
      setStatus({ error: data.error, success: '' })
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const payload = {
      name: formData.get('name'),
      description: formData.get('description'),
      logoUrl: formData.get('logoUrl'),
    }
    
    setStatus({ error: '', success: '' })

    startTransition(async () => {
      const res = await fetch(editingBrand ? `/api/admin/brands/${editingBrand.id}` : '/api/admin/brands', {
        method: editingBrand ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus({ error: data.error, success: '' })
      } else {
        setStatus({ error: '', success: editingBrand ? 'Brand updated successfully!' : 'Brand created successfully!' })
        if (!editingBrand) e.target.reset()
        setEditingBrand(null)
        fetchBrands(searchQuery)
      }
    })
  }

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-sm font-semibold text-slate-500 hover:text-slate-950">&larr; Dashboard</Link>
            <h1 className="mt-2 font-heading text-4xl font-bold text-slate-950">Manage Brands</h1>
            <p className="text-slate-500 mt-1">Organize and manage your device and component manufacturers.</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Form Side */}
          <div className="lg:col-span-5">
            <form key={editingBrand?.id || 'create'} onSubmit={handleSubmit} className="sticky top-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-xl font-bold">{editingBrand ? `Edit: ${editingBrand.name}` : 'Add New Brand'}</h2>
                {editingBrand && (
                  <button 
                    type="button" 
                    onClick={() => setEditingBrand(null)}
                    className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-950 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="space-y-6">
                <div>
                   <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Brand Name</label>
                   <input 
                     suppressHydrationWarning
                     name="name" 
                     defaultValue={editingBrand?.name} 
                     required 
                     className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all" 
                     placeholder="e.g. Raspberry Pi" 
                   />
                </div>
                <div>
                   <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Description (Optional)</label>
                   <textarea 
                     suppressHydrationWarning
                     name="description" 
                     defaultValue={editingBrand?.description} 
                     rows={3} 
                     className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all" 
                     placeholder="Manufactures of versatile SBCs..." 
                   />
                </div>
                <div>
                   <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Logo URL (Optional)</label>
                   <input 
                     suppressHydrationWarning
                     name="logoUrl" 
                     defaultValue={editingBrand?.logoUrl} 
                     className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all" 
                     placeholder="https://brands.com/logo.png" 
                   />
                </div>
              </div>

              {status.error && <p className="mt-6 text-sm font-bold text-rose-500 bg-rose-50 border border-rose-100 p-4 rounded-xl">{status.error}</p>}
              {status.success && <p className="mt-6 text-sm font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 p-4 rounded-xl">{status.success}</p>}

              <button suppressHydrationWarning disabled={isPending} className="w-full mt-8 rounded-full bg-slate-950 px-8 py-4 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-slate-400 transition-all">
                {isPending ? 'Processing...' : editingBrand ? 'Update Brand' : 'Save Brand'}
              </button>
            </form>
          </div>

          {/* List Side */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  suppressHydrationWarning
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search brands..." 
                  className="w-full pl-11 pr-5 py-3 rounded-2xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="grid gap-4">
              {brands.length === 0 ? (
                <div className="p-12 text-center rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400">
                   No brands found matching "{searchQuery}"
                </div>
              ) : (
                brands.map(brand => (
                  <div key={brand.id} className="group flex items-center gap-4 p-5 rounded-[2rem] border border-slate-200 bg-white hover:border-blue-200 hover:shadow-lg transition-all">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100 flex items-center justify-center border border-slate-100 uppercase font-bold text-slate-400">
                      {brand.logoUrl ? (
                         <img src={brand.logoUrl} alt={brand.name} className="h-full w-full object-contain p-2" />
                      ) : brand.name.substring(0, 2)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading font-bold text-slate-950">{brand.name}</h3>
                      <p className="text-xs text-slate-500 truncate max-w-[200px]">{brand.description || 'No description'}</p>
                    </div>
                    <div className="flex items-center gap-1">
                       <button 
                         onClick={() => {
                           setEditingBrand(brand);
                           window.scrollTo({ top: 0, behavior: 'smooth' });
                         }} 
                         className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                       >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                       </button>
                       <button 
                         onClick={() => handleDelete(brand.id)} 
                         className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                       >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                       </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
