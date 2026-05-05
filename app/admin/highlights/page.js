'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { getAdminBasePath } from '@/lib/admin/config'

export default function AdminHighlightsPage() {
  const adminBasePath = getAdminBasePath()
  const [highlights, setHighlights] = useState([])
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState({ error: '', success: '' })

  const fetchHighlights = async () => {
    const res = await fetch('/api/admin/highlights')
    const data = await res.json()
    if (data.highlights) setHighlights(data.highlights)
  }

  useEffect(() => {
    fetchHighlights()
  }, [])

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this highlight?')) return
    const res = await fetch('/api/admin/highlights', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
      headers: { 'Content-Type': 'application/json' }
    })
    if (res.ok) fetchHighlights()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const payload = {
      label: formData.get('label'),
      value: formData.get('value'),
      detail: formData.get('detail'),
      order: formData.get('order')
    }
    
    setStatus({ error: '', success: '' })

    startTransition(async () => {
      const res = await fetch('/api/admin/highlights', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus({ error: data.error, success: '' })
      } else {
        setStatus({ error: '', success: 'Highlight created successfully!' })
        e.target.reset()
        fetchHighlights()
      }
    })
  }

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <Link href={adminBasePath} className="text-sm font-semibold text-slate-500 hover:text-slate-950">&larr; Dashboard</Link>
            <h1 className="mt-2 font-heading text-4xl font-bold text-slate-950">Manage Home Page Highlights</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
          <h2 className="font-heading text-xl font-bold mb-6">Add New Highlight</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
               <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Label (e.g., Fast dispatch)</label>
               <input name="label" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all" placeholder="Fast dispatch" />
            </div>
            <div>
               <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Value (e.g., 24 hrs)</label>
               <input name="value" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all" placeholder="24 hrs" />
            </div>
            <div className="sm:col-span-2">
               <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Detail / Description</label>
               <input name="detail" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all" placeholder="Core catalog ships quickly from stocked inventory." />
            </div>
            <div>
               <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Display Order</label>
               <input name="order" type="number" defaultValue={0} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all" />
            </div>
          </div>

          {status.error && <p className="mt-6 text-sm font-bold text-rose-500 bg-rose-50 border border-rose-100 p-4 rounded-xl">{status.error}</p>}
          {status.success && <p className="mt-6 text-sm font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 p-4 rounded-xl">{status.success}</p>}

          <button disabled={isPending} className="mt-8 rounded-full bg-slate-950 px-8 py-4 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-slate-400 transition-all">
            {isPending ? 'Saving...' : 'Save Highlight'}
          </button>
        </form>

        <div className="space-y-6">
          <h2 className="font-heading text-2xl font-bold">Existing Highlights ({highlights.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map(h => (
              <div key={h.id} className="relative p-6 rounded-[2rem] border border-slate-200 bg-white hover:border-blue-200 transition-all">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Order: {h.order}</p>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">{h.label}</p>
                <h3 className="text-2xl font-bold text-slate-950 mb-2">{h.value}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">{h.detail}</p>
                <button onClick={() => handleDelete(h.id)} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 transition-all">
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
