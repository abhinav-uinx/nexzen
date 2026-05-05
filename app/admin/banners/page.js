'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import InsightBadge from '@/components/admin/InsightBadge'
import { getAdminBasePath } from '@/lib/admin/config'

export default function AdminBannersPage() {
  const adminBasePath = getAdminBasePath()
  const [banners, setBanners] = useState([])
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState({ error: '', success: '' })
  const [editingBanner, setEditingBanner] = useState(null)

  const fetchBanners = async () => {
    const res = await fetch('/api/admin/banners')
    const data = await res.json()
    if (data.banners) setBanners(data.banners)
  }

  useEffect(() => {
    fetchBanners()
  }, [])

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this banner?')) return
    const res = await fetch('/api/admin/banners', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
      headers: { 'Content-Type': 'application/json' }
    })
    if (res.ok) fetchBanners()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setStatus({ error: '', success: '' })

    startTransition(async () => {
      const res = await fetch('/api/admin/banners', {
        method: editingBanner ? 'PATCH' : 'POST',
        body: formData
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus({ error: data.error, success: '' })
      } else {
        setStatus({ error: '', success: editingBanner ? 'Banner updated successfully!' : 'Banner created successfully!' })
        if (!editingBanner) e.target.reset()
        setEditingBanner(null)
        fetchBanners()
      }
    })
  }

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <Link href={adminBasePath} className="text-sm font-semibold text-slate-500 hover:text-slate-950">&larr; Dashboard</Link>
            <h1 className="mt-2 font-heading text-4xl font-bold text-slate-950">Manage Hero Banners</h1>
          </div>
        </div>

        {/* Create Form */}
        <form key={editingBanner?.id || 'create'} onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-xl font-bold">{editingBanner ? `Edit Slide: ${editingBanner.title}` : 'Add New Slide'}</h2>
            {editingBanner && (
              <button 
                type="button" 
                onClick={() => setEditingBanner(null)}
                className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-950 transition-colors"
              >
                Cancel Edit
              </button>
            )}
          </div>

          {editingBanner && <input type="hidden" name="id" value={editingBanner.id} />}

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
               <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Slide Title</label>
               <input suppressHydrationWarning name="title" defaultValue={editingBanner?.title} required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all" placeholder="Arduino Uno Q: From blink to think" />
            </div>
            <div className="sm:col-span-2">
               <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Subtitle / Description</label>
               <textarea suppressHydrationWarning name="subtitle" defaultValue={editingBanner?.subtitle} rows={2} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all" placeholder="Get power and ease of use all wrapped up into UNO." />
            </div>
            <div className="sm:col-span-2">
               <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Eyebrow (Overline text)</label>
               <input suppressHydrationWarning name="eyebrow" defaultValue={editingBanner?.eyebrow} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all" placeholder="Nexzen Launch Edition" />
            </div>
            <div>
               <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Link URL (Primary)</label>
               <input suppressHydrationWarning name="link" defaultValue={editingBanner?.link} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all" placeholder="/products" />
            </div>
            <div>
               <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Primary CTA Text</label>
               <input suppressHydrationWarning name="ctaText" defaultValue={editingBanner?.ctaText || "Explore Now"} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all" placeholder="Explore Now" />
            </div>
            <div>
               <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Secondary Link (Optional)</label>
               <input suppressHydrationWarning name="secondaryHref" defaultValue={editingBanner?.secondaryHref} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all" placeholder="/products?category=stem-kits" />
            </div>
            <div>
               <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Secondary CTA Text</label>
               <input suppressHydrationWarning name="secondaryCtaText" defaultValue={editingBanner?.secondaryCtaText} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all" placeholder="View top kits" />
            </div>
            <div>
               <div className="flex items-center gap-2 mb-2">
                 <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Metrics (Side data)</label>
                 <InsightBadge insightKey="banner-metric" />
               </div>
               <input suppressHydrationWarning name="metric" defaultValue={editingBanner?.metric} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all" placeholder="2,400+ curated SKUs" />
            </div>
            <div>
               <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Display Order</label>
               <input suppressHydrationWarning name="order" type="number" defaultValue={editingBanner?.order || 0} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all" />
            </div>
            <div className="sm:col-span-2">
               <div className="flex items-center gap-2 mb-2">
                 <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Accent Gradient (Tailwind classes)</label>
                 <InsightBadge insightKey="banner-accent" />
               </div>
               <input suppressHydrationWarning name="accent" defaultValue={editingBanner?.accent || "from-[#07111f] via-[#0f2a51] to-[#1d4ed8]"} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all" placeholder="from-[#07111f] via-[#0f2a51] to-[#1d4ed8]" />
            </div>
            <div className="sm:col-span-2">
               <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Banner Image {editingBanner ? '(Optional)' : '(Required)'}</label>
               <input suppressHydrationWarning name="image" type="file" required={!editingBanner} accept="image/*" className="w-full rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 hover:border-blue-400 hover:bg-blue-50/10 cursor-pointer" />
               <p className="mt-2 text-[10px] text-slate-400 uppercase tracking-widest text-center">Recommended size: 1920x800px. WebP suggested.</p>
            </div>
          </div>

          {status.error && <p className="mt-6 text-sm font-bold text-rose-500 bg-rose-50 border border-rose-100 p-4 rounded-xl">{status.error}</p>}
          {status.success && <p className="mt-6 text-sm font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 p-4 rounded-xl">{status.success}</p>}

          <div className="flex gap-4 mt-8">
            <button suppressHydrationWarning disabled={isPending} className="flex-1 rounded-full bg-slate-950 px-8 py-4 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-slate-400 transition-all">
              {isPending ? 'Processing...' : editingBanner ? 'Update Banner Slide' : 'Save Banner Slide'}
            </button>
            {editingBanner && (
              <button 
                type="button"
                onClick={() => setEditingBanner(null)}
                className="rounded-full border border-slate-200 px-8 py-4 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* List Banners */}
        <div className="space-y-6">
          <h2 className="font-heading text-2xl font-bold">Existing Slides ({banners.length})</h2>
          {banners.length === 0 ? (
            <div className="p-12 text-center rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400">
               No banners found. Upload one to see it on the home page.
            </div>
          ) : (
            <div className="grid gap-6">
              {banners.map(banner => (
                <div key={banner.id} className="group relative flex flex-col md:flex-row gap-6 p-6 rounded-[2rem] border border-slate-200 bg-white hover:border-blue-200 hover:shadow-xl transition-all">
                  <div className="relative h-32 w-full md:w-60 shrink-0 overflow-hidden rounded-2xl bg-slate-50 border border-slate-100">
                    <Image src={banner.imageUrl} alt={banner.title} fill className="object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Order: {banner.order}</p>
                    <h3 className="font-heading text-xl font-bold text-slate-950 mt-1">{banner.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-1 mt-1">{banner.subtitle}</p>
                    {banner.link && <p className="text-xs text-blue-600 font-medium mt-2">{banner.link}</p>}
                  </div>
                  <div className="flex items-center gap-3 pr-4">
                     <button 
                       suppressHydrationWarning 
                       onClick={() => {
                         setEditingBanner(banner);
                         window.scrollTo({ top: 0, behavior: 'smooth' });
                       }} 
                       className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" 
                       title="Edit Banner"
                     >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                     </button>
                     <button suppressHydrationWarning onClick={() => handleDelete(banner.id)} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Delete Banner">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                     </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
