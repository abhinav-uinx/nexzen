'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Pencil, Trash2, X } from 'lucide-react'
import { withAdminHeaders } from '@/lib/admin/client'
import { getAdminBasePath } from '@/lib/admin/config'

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  icon: 'CPU',
  imageUrl: '',
}

export default function AdminCategoriesPage() {
  const adminBasePath = getAdminBasePath()
  const [categories, setCategories] = useState([])
  const [editingId, setEditingId] = useState('')
  const [formState, setFormState] = useState(EMPTY_FORM)
  const [imageFile, setImageFile] = useState(null)
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState({ error: '', success: '' })

  const isEditing = Boolean(editingId)
  const submitLabel = isEditing ? 'Update Category' : 'Save Category'
  const heading = isEditing ? 'Edit category card' : 'Add new category'
  const previewSrc = useMemo(() => {
    if (!imageFile) {
      return formState.imageUrl || ''
    }

    return URL.createObjectURL(imageFile)
  }, [formState.imageUrl, imageFile])

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  )

  useEffect(() => {
    return () => {
      if (previewSrc && previewSrc.startsWith('blob:')) {
        URL.revokeObjectURL(previewSrc)
      }
    }
  }, [previewSrc])

  useEffect(() => {
    let active = true

    async function loadCategories() {
      const res = await fetch('/api/admin/categories', {
        headers: withAdminHeaders(),
      })
      const data = await res.json().catch(() => ({}))
      if (active && data.categories) {
        setCategories(data.categories)
      }
    }

    loadCategories()

    return () => {
      active = false
    }
  }, [])

  async function fetchCategories() {
    const res = await fetch('/api/admin/categories', {
      headers: withAdminHeaders(),
    })
    const data = await res.json().catch(() => ({}))
    if (data.categories) {
      setCategories(data.categories)
    }
  }

  function resetForm() {
    setEditingId('')
    setFormState(EMPTY_FORM)
    setImageFile(null)
  }

  function populateForm(category) {
    setEditingId(category.id)
    setFormState({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
      icon: category.icon || 'CPU',
      imageUrl: category.imageUrl || '',
    })
    setImageFile(null)
    setStatus({ error: '', success: '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this category?')) return

    const res = await fetch('/api/admin/categories', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
      headers: withAdminHeaders({ 'Content-Type': 'application/json' }),
    })

    if (res.ok) {
      if (editingId === id) {
        resetForm()
      }
      fetchCategories()
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = new FormData()
    payload.set('id', editingId)
    payload.set('name', formState.name)
    payload.set('slug', formState.slug)
    payload.set('description', formState.description)
    payload.set('icon', formState.icon)
    payload.set('imageUrl', formState.imageUrl)
    if (imageFile) {
      payload.set('image', imageFile)
    }

    setStatus({ error: '', success: '' })

    startTransition(async () => {
      const res = await fetch('/api/admin/categories', {
        method: isEditing ? 'PATCH' : 'POST',
        body: payload,
        headers: withAdminHeaders(),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus({ error: data.error || 'Could not save category.', success: '' })
      } else {
        resetForm()
        setStatus({
          error: '',
          success: isEditing ? 'Category updated successfully!' : 'Category created successfully!',
        })
        fetchCategories()
      }
    })
  }

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link href={adminBasePath} className="text-sm font-semibold text-slate-500 hover:text-slate-950">&larr; Dashboard</Link>
            <h1 className="mt-2 font-heading text-4xl font-bold text-slate-950">Edit Category Architecture</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              These cards drive the homepage Category architecture section, so names, images, icons, and descriptions stay editable from admin.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold">{heading}</h2>
              <p className="mt-2 text-sm text-slate-500">Use a category image URL to get the rees52-style visual card on the storefront.</p>
            </div>
            {isEditing ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-950 hover:text-slate-950"
              >
                <X size={16} />
                Cancel edit
              </button>
            ) : null}
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Category Name</label>
              <input
                required
                value={formState.name}
                onChange={(e) => setFormState((current) => ({ ...current, name: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none transition-all focus:border-blue-500 focus:bg-white"
                placeholder="Development Boards"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Slug</label>
              <input
                required
                value={formState.slug}
                onChange={(e) => setFormState((current) => ({ ...current, slug: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none transition-all focus:border-blue-500 focus:bg-white"
                placeholder="development-boards"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Description</label>
              <input
                value={formState.description}
                onChange={(e) => setFormState((current) => ({ ...current, description: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none transition-all focus:border-blue-500 focus:bg-white"
                placeholder="Arduino, ESP32, Raspberry Pi, and embedded prototyping kits."
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Icon Identifier</label>
              <input
                value={formState.icon}
                onChange={(e) => setFormState((current) => ({ ...current, icon: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none transition-all focus:border-blue-500 focus:bg-white"
                placeholder="CPU"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Image URL</label>
              <input
                value={formState.imageUrl}
                onChange={(e) => setFormState((current) => ({ ...current, imageUrl: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none transition-all focus:border-blue-500 focus:bg-white"
                placeholder="https://... or /uploads/category-card.jpg"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Upload Category Image</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm outline-none transition-all file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white focus:border-blue-500 focus:bg-white"
              />
              <p className="mt-2 text-xs text-slate-500">
                PNG, JPG, or WebP up to 5MB. Uploaded files will be saved to the local uploads directory.
              </p>
            </div>
          </div>

          {previewSrc && (
            <div className="mt-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Preview</p>
              <div className="relative aspect-[16/10] max-w-md overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100">
                <Image
                  src={previewSrc}
                  alt="Category preview"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 420px"
                  unoptimized={Boolean(imageFile)}
                />
              </div>
            </div>
          )}

          {status.error ? <p className="mt-6 rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-500">{status.error}</p> : null}
          {status.success ? <p className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-600">{status.success}</p> : null}

          <button disabled={isPending} className="mt-8 rounded-full bg-slate-950 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:bg-slate-400">
            {isPending ? 'Saving...' : submitLabel}
          </button>
        </form>

        <div className="space-y-6">
          <h2 className="font-heading text-2xl font-bold">Existing Categories ({categories.length})</h2>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {sortedCategories.map((category) => (
              <div key={category.id} className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
                <div className="relative aspect-[5/4] overflow-hidden bg-[radial-gradient(circle_at_top,#c8102e_0%,#960019_45%,#5f0714_100%)]">
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,#c8102e_0%,#960019_45%,#5f0714_100%)]">
                      <div className="rounded-2xl bg-black/75 px-4 py-3 text-sm font-bold tracking-[0.24em] text-cyan-300">
                        {category.icon || 'CPU'}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3 p-5">
                  <div>
                    <h3 className="text-2xl font-semibold text-slate-950">{category.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{category.description || 'No description yet.'}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{category.slug}</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => populateForm(category)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(category.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
