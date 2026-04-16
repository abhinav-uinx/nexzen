'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState([])
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState({ error: '', success: '' })

  const fetchCollections = async () => {
    const res = await fetch('/api/admin/collections')
    const data = await res.json()
    if (data.collections) setCollections(data.collections)
  }

  useEffect(() => {
    fetchCollections()
  }, [])

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this collection?')) return
    const res = await fetch('/api/admin/collections', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
      headers: { 'Content-Type': 'application/json' }
    })
    if (res.ok) fetchCollections()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const payload = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      description: formData.get('description'),
      imageUrl: formData.get('imageUrl'),
      order: formData.get('order'),
      isActive: true
    }
    
    setStatus({ error: '', success: '' })

    startTransition(async () => {
      const res = await fetch('/api/admin/collections', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus({ error: data.error, success: '' })
      } else {
        setStatus({ error: '', success: 'Collection created successfully!' })
        e.target.reset()
        fetchCollections()
      }
    })
  }

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-sm font-semibold text-slate-500 hover:text-slate-950">&larr; Dashboard</Link>
            <h1 className="mt-2 font-heading text-4xl font-bold text-slate-950">Manage Store Collections</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
          <h2 className="font-heading text-xl font-bold mb-6">Add Featured Collection</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
               <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Collection Name</label>
               <input name="name" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all" placeholder="Creator Boards" />
            </div>
            <div>
               <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Slug</label>
               <input name="slug" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all" placeholder="development-boards" />
            </div>
            <div className="sm:col-span-2">
               <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Description</label>
               <input name="description" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all" placeholder="Performance-first microcontrollers and SBCs." />
            </div>
            <div>
               <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Image URL (Optional)</label>
               <input name="imageUrl" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all" placeholder="https://..." />
            </div>
            <div>
               <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Display Order</label>
               <input name="order" type="number" defaultValue={0} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all" />
            </div>
          </div>

          {status.error && <p className="mt-6 text-sm font-bold text-rose-500 bg-rose-50 border border-rose-100 p-4 rounded-xl">{status.error}</p>}
          {status.success && <p className="mt-6 text-sm font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 p-4 rounded-xl">{status.success}</p>}

          <button disabled={isPending} className="mt-8 rounded-full bg-slate-950 px-8 py-4 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-slate-400 transition-all">
            {isPending ? 'Saving...' : 'Save Collection'}
          </button>
        </form>

        <div className="space-y-6">
          <h2 className="font-heading text-2xl font-bold">Existing Collections ({collections.length})</h2>
          <div className="grid gap-6">
            {collections.map(c => (
              <div key={c.id} className="relative flex items-center gap-6 p-6 rounded-[2rem] border border-slate-200 bg-white hover:border-blue-200 transition-all">
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Order: {c.order}</p>
                  <h3 className="text-xl font-bold text-slate-950 mt-1">{c.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{c.description}</p>
                  <p className="text-xs text-blue-600 font-medium mt-2">{c.slug}</p>
                </div>
                <button onClick={() => handleDelete(c.id)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
