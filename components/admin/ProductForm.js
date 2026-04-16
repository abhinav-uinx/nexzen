'use client'

import { useState, useTransition } from 'react'

const initialState = {
  error: '',
  success: '',
}

const PRESET_THEMES = [
  { name: 'Default Nexzen', accent: 'from-[#0f172a] via-[#1d4ed8] to-[#38bdf8]', surface: 'bg-[#eff6ff]', tone: 'slate' },
  { name: 'Hardware Pro (Blue)', accent: 'from-[#1e40af] via-[#3b82f6] to-[#60a5fa]', surface: 'bg-[#f0f9ff]', tone: 'sky' },
  { name: 'Logic Green (Arduino)', accent: 'from-[#065f46] via-[#059669] to-[#34d399]', surface: 'bg-[#ecfdf5]', tone: 'emerald' },
  { name: 'Signal Red (R-Pi)', accent: 'from-[#991b1b] via-[#dc2626] to-[#f87171]', surface: 'bg-[#fef2f2]', tone: 'rose' },
  { name: 'Energy Orange', accent: 'from-[#9a3412] via-[#ea580c] to-[#fb923c]', surface: 'bg-[#fff7ed]', tone: 'orange' },
  { name: 'Deep Space (Dark)', accent: 'from-[#020617] via-[#1e293b] to-[#475569]', surface: 'bg-[#f8fafc]', tone: 'slate' },
  { name: 'Vision Purple', accent: 'from-[#581c87] via-[#9333ea] to-[#c084fc]', surface: 'bg-[#faf5ff]', tone: 'violet' },
]

function getDefaultValues(brands) {
  return {
    id: '',
    name: '',
    sku: '',
    categoryId: '',
    brand: brands[0] || '',
    barcode: '',
    status: 'ACTIVE',
    price: '',
    compareAtPrice: '',
    costPrice: '',
    stockQuantity: '',
    lowStockThreshold: 5,
    weightGrams: '',
    rating: 4.8,
    reviews: 100,
    badge: '',
    badgeTone: 'slate',
    requiresShipping: true,
    trackInventory: true,
    shortSpec: '',
    accent: '',
    surface: '',
    dependencies: '',
    shortDescription: '',
    description: '',
    // Premium Specifications
    variants: '',
    configs: '',
    galleryUrls: '',
    featureContent: '',
    technicalContent: '',
  }
}

export default function ProductForm({
  categories,
  brands = [],
  mode = 'create',
  initialValues = null,
  onSaved,
  onCancelEdit,
}) {
  const [status, setStatus] = useState(initialState)
  const [isPending, startTransition] = useTransition()
  const defaults = initialValues || getDefaultValues(brands)
  const [brandValue, setBrandValue] = useState(defaults.brand || brands[0] || '')
  
  const [accent, setAccent] = useState(defaults.accent || PRESET_THEMES[0].accent)
  const [surface, setSurface] = useState(defaults.surface || PRESET_THEMES[0].surface)
  const [badgeTone, setBadgeTone] = useState(defaults.badgeTone || 'slate')

  function handleThemeChange(e) {
    const themeName = e.target.value
    if (themeName === 'custom') return
    
    const theme = PRESET_THEMES.find(t => t.name === themeName)
    if (theme) {
      setAccent(theme.accent)
      setSurface(theme.surface)
      setBadgeTone(theme.tone)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    formData.set('brand', brandValue.trim())

    setStatus(initialState)

    startTransition(async () => {
      const response = await fetch('/api/admin/products', {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        setStatus({
          error: result.error || 'Unable to create product.',
          success: '',
        })
        return
      }

      form.reset()
      setBrandValue(brands[0] || '')
      setStatus({
        error: '',
        success: `${mode === 'edit' ? 'Updated' : 'Created'} ${result.product.name} successfully.`,
      })
      onSaved?.(result.product)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-8">
      {mode === 'edit' && <input type="hidden" name="id" value={defaults.id} />}
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Product Upload</p>
        <h2 className="font-heading text-3xl font-semibold text-slate-950">
          {mode === 'edit' ? 'Edit product details' : 'Add a product with image and inventory details'}
        </h2>
        <p className="text-sm leading-7 text-slate-600">
          This form writes into your Supabase product tables, including image, stock, pricing, status, and dependency information.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-slate-700">
          Product name
          <input
            name="name"
            required
            defaultValue={defaults.name}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            placeholder="ESP32 Development Board"
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-700">
          SKU
          <input
            name="sku"
            required
            defaultValue={defaults.sku}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            placeholder="NX-ESP32-020"
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-700">
          Category
          <select
            name="categoryId"
            required
            defaultValue={defaults.categoryId || ''}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
          >
            <option value="" disabled>
              Select category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm text-slate-700">
          Brand
          <>
            <input
              name="brand"
              list="brand-options"
              value={brandValue}
              onChange={(event) => setBrandValue(event.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              placeholder="Choose or type a brand"
            />
            {brands.length > 0 && (
              <datalist id="brand-options">
                {brands.map((brand) => (
                  <option key={brand} value={brand} />
                ))}
              </datalist>
            )}
            <p className="text-xs text-slate-500">Start typing or pick an existing brand from the suggestions.</p>
          </>
        </label>
        <label className="grid gap-2 text-sm text-slate-700">
          Barcode
          <input
            name="barcode"
            defaultValue={defaults.barcode}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            placeholder="8901234567890"
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-700">
          Status
          <select
            name="status"
            defaultValue={defaults.status || 'ACTIVE'}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
          >
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm text-slate-700">
          Price
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={defaults.price}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            placeholder="399"
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-700">
          Compare at price
          <input
            name="compareAtPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaults.compareAtPrice}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            placeholder="499"
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-700">
          Cost price
          <input
            name="costPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaults.costPrice}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            placeholder="265"
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-700">
          Stock quantity
          <input
            name="stockQuantity"
            type="number"
            min="0"
            required
            defaultValue={defaults.stockQuantity}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            placeholder="50"
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-700">
          Low stock threshold
          <input
            name="lowStockThreshold"
            type="number"
            min="0"
            defaultValue={defaults.lowStockThreshold}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-700">
          Weight (grams)
          <input
            name="weightGrams"
            type="number"
            min="0"
            defaultValue={defaults.weightGrams}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            placeholder="120"
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-700">
          Rating
          <input
            name="rating"
            type="number"
            step="0.1"
            min="0"
            max="5"
            defaultValue={defaults.rating}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-700">
          Reviews
          <input
            name="reviews"
            type="number"
            min="0"
            defaultValue={defaults.reviews}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-700">
          Badge
          <input
            name="badge"
            defaultValue={defaults.badge}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            placeholder="New"
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-700">
          Badge tone
          <select
            name="badgeTone"
            value={badgeTone}
            onChange={(e) => setBadgeTone(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
          >
            <option value="slate">Slate (Default)</option>
            <option value="amber">Amber (Premium)</option>
            <option value="emerald">Emerald (New/Success)</option>
            <option value="rose">Rose (Hot/Sale)</option>
            <option value="violet">Violet (Exclusive)</option>
            <option value="sky">Sky (Pro)</option>
            <option value="orange">Orange (Industrial)</option>
          </select>
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
          <input name="requiresShipping" type="checkbox" defaultChecked={defaults.requiresShipping} className="h-4 w-4 rounded border-slate-300" />
          Requires shipping
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
          <input name="trackInventory" type="checkbox" defaultChecked={defaults.trackInventory} className="h-4 w-4 rounded border-slate-300" />
          Track inventory
        </label>
        <label className="grid gap-2 text-sm text-slate-700 md:col-span-2">
          Short spec
          <input
            name="shortSpec"
            defaultValue={defaults.shortSpec}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            placeholder="Wi-Fi, BLE, dual-core MCU"
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-700 md:col-span-2">
          Dependencies
          <input
            name="dependencies"
            defaultValue={defaults.dependencies}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            placeholder="e.g. nex-uno-r4, nex-lidar-mini (comma-separated SKUs or Slugs)"
          />
        </label>
        <div className="md:col-span-2 grid gap-4 grid-cols-1 md:grid-cols-3 items-end p-4 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
          <label className="grid gap-2 text-sm font-semibold text-blue-700">
            Design Preset Theme
            <select
              onChange={handleThemeChange}
              defaultValue={PRESET_THEMES.find(t => t.accent === accent)?.name || 'custom'}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
            >
              {PRESET_THEMES.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
              <option value="custom">Manual / Custom</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm text-slate-700">
            Accent Gradient (Tailwind)
            <input
              name="accent"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              placeholder="from-[#0f172a] via-[#1d4ed8] to-[#38bdf8]"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-700">
            Surface Color (Tailwind)
            <input
              name="surface"
              value={surface}
              onChange={(e) => setSurface(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              placeholder="bg-[#eff6ff]"
            />
          </label>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-8 mt-4 space-y-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-blue-700">Premium Specifications</h3>
          <p className="text-xs text-slate-500 mt-1">Manage variants, configurations and technical sections stored as metadata.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-slate-700">
            Variants / Type
            <input
              name="variants"
              defaultValue={defaults.variants || defaults.flavours}
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              placeholder="Standard, Pro, Headerless"
            />
            <p className="text-[10px] text-slate-400">Comma-separated list of product types (e.g. Pin types, Colors).</p>
          </label>
          <label className="grid gap-2 text-sm text-slate-700">
            Configuration / Specs
            <input
              name="configs"
              defaultValue={defaults.configs || defaults.sizes}
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              placeholder="4GB, 8GB, 128MB Flash"
            />
            <p className="text-[10px] text-slate-400">Comma-separated list of hardware configurations.</p>
          </label>
          <label className="grid gap-2 text-sm text-slate-700 md:col-span-2">
            Gallery Image URLs
            <textarea
              name="galleryUrls"
              rows={2}
              defaultValue={defaults.galleryUrls}
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              placeholder="https://example.com/img1.png, https://example.com/img2.png"
            />
            <p className="text-[10px] text-slate-400">Comma-separated URLs for the product image carousel.</p>
          </label>
          <label className="grid gap-2 text-sm text-slate-700 md:col-span-2">
            Technical Highlights
            <textarea
              name="featureContent"
              rows={3}
              defaultValue={defaults.featureContent || defaults.benefitContent}
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              placeholder="Describe the main technical features and certifications."
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-700 md:col-span-2">
            Usage & Setup Guide
            <textarea
              name="technicalContent"
              rows={3}
              defaultValue={defaults.technicalContent || defaults.usageContent}
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              placeholder="How should the customer initialize or wire this product?"
            />
          </label>
        </div>
      </div>

      <label className="grid gap-2 text-sm text-slate-700">
        Short description
        <textarea
          name="shortDescription"
          rows={2}
          defaultValue={defaults.shortDescription}
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
          placeholder="Short line shown in cards and summaries."
        />
      </label>

      <label className="grid gap-2 text-sm text-slate-700">
        Description
        <textarea
          name="description"
          rows={4}
          required
          defaultValue={defaults.description}
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
          placeholder="Full product description"
        />
      </label>

      <label className="grid gap-2 text-sm text-slate-700">
        Gallery photos (Upload Multiple)
        <input
          name="gallery"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="rounded-2xl border border-dashed border-slate-300 px-4 py-3"
        />
        <p className="text-[10px] text-slate-400">Select multiple image files to build the storefront carousel.</p>
      </label>

      <label className="grid gap-2 text-sm text-slate-700">
        Product image (Primary)
        <input
          name="image"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="rounded-2xl border border-dashed border-slate-300 px-4 py-3"
        />
        <p className="text-[10px] text-slate-400">Main photo shown in search and catalog.</p>
      </label>

      {status.error && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {status.error}
        </p>
      )}

      {status.success && (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {status.success}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="interactive-button inline-flex w-fit items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isPending ? 'Saving product...' : mode === 'edit' ? 'Update product' : 'Create product'}
      </button>

      {mode === 'edit' && (
        <button
          type="button"
          onClick={onCancelEdit}
          className="interactive-button inline-flex w-fit items-center justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-slate-950 hover:text-slate-950"
        >
          Cancel editing
        </button>
      )}
    </form>
  )
}
