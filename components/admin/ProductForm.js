'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import InsightBadge from './InsightBadge'
import { withAdminHeaders } from '@/lib/admin/client'

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
    brandId: brands[0]?.id || '',
    brandName: brands[0]?.name || '',
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
  adminBasePath = '/admin',
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
  
  // Controlled States
  const [name, setName] = useState(defaults.name || '')
  const [sku, setSku] = useState(defaults.sku || '')
  const [shortSpec, setShortSpec] = useState(defaults.shortSpec || '')
  const [dependencies, setDependencies] = useState(defaults.dependencies || '')
  const [featureContent, setFeatureContent] = useState(defaults.featureContent || defaults.benefitContent || '')
  const [technicalContent, setTechnicalContent] = useState(defaults.technicalContent || defaults.usageContent || '')
  const [shortDescription, setShortDescription] = useState(defaults.shortDescription || '')
  const [description, setDescription] = useState(defaults.description || '')
  const [brandId, setBrandId] = useState(defaults.brandId || '')
  const [brandSearch, setBrandSearch] = useState(brands.find(b => b.id === (defaults.brandId || ''))?.name || defaults.brandName || '')
  const [accent, setAccent] = useState(defaults.accent || PRESET_THEMES[0].accent)
  const [surface, setSurface] = useState(defaults.surface || PRESET_THEMES[0].surface)
  const [badgeTone, setBadgeTone] = useState(defaults.badgeTone || 'slate')

  // New Controlled States for Full AI Auto-fill
  const [price, setPrice] = useState(defaults.price || '')
  const [compareAtPrice, setCompareAtPrice] = useState(defaults.compareAtPrice || '')
  const [costPrice, setCostPrice] = useState(defaults.costPrice || '')
  const [stockQuantity, setStockQuantity] = useState(defaults.stockQuantity || '')
  const [barcode, setBarcode] = useState(defaults.barcode || '')
  const [categoryId, setCategoryId] = useState(defaults.categoryId || '')
  const [badge, setBadge] = useState(defaults.badge || '')
  const [weightGrams, setWeightGrams] = useState(defaults.weightGrams || '')
  const [variants, setVariants] = useState(defaults.variants || defaults.flavours || '')
  const [configs, setConfigs] = useState(defaults.configs || defaults.sizes || '')

  const [isAiLoading, setIsAiLoading] = useState(false)
  const nameRef = useRef(null)

  async function handleAiGeneration(currentName) {
    if (isAiLoading) return
    
    setIsAiLoading(true)
    setStatus(initialState)

      try {
        const response = await fetch('/api/admin/ai/generate-product', {
          method: 'POST',
          headers: withAdminHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ 
            name: currentName, 
            sku,
            categories: categories.map(c => ({ id: c.id, name: c.name }))
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'AI generation failed')
        }

        const { data } = result
        
        // Comprehensive update of all form states
        setName(currentName.replace(/!$/, '').trim())
        setShortSpec(data.shortSpec || '')
        setDependencies(data.dependencies || '')
        setFeatureContent(data.technicalHighlights || '')
        setTechnicalContent(data.usageGuide || '')
        setShortDescription(data.shortDescription || '')
        setDescription(data.description || '')
        setPrice(data.price?.toString() || '')
        setCompareAtPrice(data.compareAtPrice?.toString() || '')
        setCostPrice(data.costPrice?.toString() || '')
        const matchedBrand = brands.find(b => b.name.toLowerCase() === (data.brand || '').toLowerCase())
        if (matchedBrand) {
          setBrandId(matchedBrand.id)
          setBrandSearch(matchedBrand.name)
        } else {
          setBrandSearch(data.brand || '')
        }
        setBarcode(data.barcode || '')
        if (data.categoryId) setCategoryId(data.categoryId)
        setWeightGrams(data.weightGrams?.toString() || '')
        setBadge(data.badge || '')
        if (data.badgeTone) setBadgeTone(data.badgeTone)
        setVariants(data.variants || '')
        setConfigs(data.configs || '')

        // Auto-match theme based on badge tone recommendation
        const matchingTheme = PRESET_THEMES.find(t => t.tone === data.badgeTone)
        if (matchingTheme) {
          setAccent(matchingTheme.accent)
          setSurface(matchingTheme.surface)
        }

        setStatus({
          error: '',
          success: 'AI Agent has successfully researched and populated the entire form!',
        })
      } catch (err) {
      console.error('AI Generation Error:', err)
      setStatus({
        error: `AI Error: ${err.message}`,
        success: '',
      })
    } finally {
      setIsAiLoading(false)
    }
  }

  function handleNameChange(e) {
    const newValue = e.target.value
    setName(newValue)

    if (newValue.endsWith('!')) {
      handleAiGeneration(newValue)
    }
  }

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
    formData.set('brandId', brandId)
    formData.set('brandName', brandSearch) // Fallback or for existing logic
    // Ensure controlled values are in FormData
    formData.set('name', name)
    formData.set('sku', sku)
    formData.set('shortSpec', shortSpec)
    formData.set('dependencies', dependencies)
    formData.set('featureContent', featureContent)
    formData.set('technicalContent', technicalContent)
    formData.set('shortDescription', shortDescription)
    formData.set('description', description)
    formData.set('price', price)
    formData.set('compareAtPrice', compareAtPrice)
    formData.set('costPrice', costPrice)
    formData.set('stockQuantity', stockQuantity)
    formData.set('barcode', barcode)
    formData.set('categoryId', categoryId)
    formData.set('badge', badge)
    formData.set('weightGrams', weightGrams)
    formData.set('variants', variants)
    formData.set('configs', configs)
    formData.set('accent', accent)
    formData.set('surface', surface)
    formData.set('badgeTone', badgeTone)

    setStatus(initialState)

    startTransition(async () => {
      const response = await fetch('/api/admin/products', {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: withAdminHeaders(),
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

      if (mode === 'create') {
        form.reset()
        setName('')
        setSku('')
        setShortSpec('')
        setDependencies('')
        setFeatureContent('')
        setTechnicalContent('')
        setShortDescription('')
        setDescription('')
        setBrandId(brands[0]?.id || '')
        setBrandSearch(brands[0]?.name || '')
        setPrice('')
        setCompareAtPrice('')
        setCostPrice('')
        setStockQuantity('')
        setBarcode('')
        setCategoryId('')
        setBadge('')
        setWeightGrams('')
        setVariants('')
        setConfigs('')
      }

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
        <p className="text-sm uppercase tracking-[0.24em] text-blue-700 font-bold flex items-center gap-2">
          Product Upload
          {isAiLoading && (
            <span className="flex items-center gap-1 animate-pulse text-rose-500">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
              AI Agent is researching...
            </span>
          )}
        </p>
        <h2 className="font-heading text-3xl font-semibold text-slate-950">
          {mode === 'edit' ? 'Edit product details' : 'Add a product with image and inventory details'}
        </h2>
        <p className="text-sm leading-7 text-slate-600">
          Tip: Add an <span className="font-bold text-blue-600">!</span> at the end of the product name to let the AI Agent fill the details for you.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2 text-sm text-slate-700">
          <div className="flex items-center gap-2">
            <label htmlFor="product-name">Product name</label>
            <InsightBadge insightKey="product-ai" />
          </div>
          <div className="flex gap-2">
            <input
              suppressHydrationWarning
              id="product-name"
              name="name"
              required
              value={name}
              onChange={handleNameChange}
              disabled={isAiLoading}
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 disabled:bg-slate-50"
              placeholder="ESP32 Development Board"
            />
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => handleAiGeneration(name)}
              disabled={isAiLoading || !name.trim()}
              title="Generate details with AI Agent"
              className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl border-2 border-blue-600 bg-blue-50 text-xl font-black text-blue-700 transition hover:bg-blue-600 hover:text-white disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300"
            >
              !
            </button>
          </div>
        </div>
        <label className="grid gap-2 text-sm text-slate-700">
          SKU
          <input
            suppressHydrationWarning
            name="sku"
            required
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            placeholder="NX-ESP32-020"
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-700">
          Category
          <select
            suppressHydrationWarning
            name="categoryId"
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
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
        <div className="grid gap-2 text-sm text-slate-700">
          <div className="flex items-center justify-between">
            <label>Brand</label>
            <Link 
              href={`${adminBasePath}/brands`} 
              target="_blank"
              className="text-[10px] uppercase font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
              Add Brand
            </Link>
          </div>
          <div className="relative">
            <input
              suppressHydrationWarning
              name="brandSearch"
              value={brandSearch}
              onChange={(e) => {
                setBrandSearch(e.target.value)
                const match = brands.find(b => b.name.toLowerCase() === e.target.value.toLowerCase())
                if (match) setBrandId(match.id)
                else setBrandId('')
              }}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              placeholder="Search or type brand name"
              list="brand-list"
            />
            <datalist id="brand-list">
              {brands.map((b) => (
                <option key={b.id} value={b.name} />
              ))}
            </datalist>
            <input type="hidden" name="brandId" value={brandId} />
          </div>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
            {brandId ? 'Linked to existing brand' : 'Brand will be saved as text if not selected'}
          </p>
        </div>
        <label className="grid gap-2 text-sm text-slate-700">
          Barcode
          <input
            suppressHydrationWarning
            name="barcode"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            placeholder="8901234567890"
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-700">
          Status
          <select
            suppressHydrationWarning
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
            suppressHydrationWarning
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            placeholder="399"
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-700">
          Compare at price
          <input
            suppressHydrationWarning
            name="compareAtPrice"
            type="number"
            step="0.01"
            min="0"
            value={compareAtPrice}
            onChange={(e) => setCompareAtPrice(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            placeholder="499"
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-700">
          Cost price
          <input
            suppressHydrationWarning
            name="costPrice"
            type="number"
            step="0.01"
            min="0"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            placeholder="265"
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-700">
          Stock quantity
          <input
            suppressHydrationWarning
            name="stockQuantity"
            type="number"
            min="0"
            required
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            placeholder="50"
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-700">
          Low stock threshold
          <input
            suppressHydrationWarning
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
            suppressHydrationWarning
            name="weightGrams"
            type="number"
            min="0"
            value={weightGrams}
            onChange={(e) => setWeightGrams(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            placeholder="120"
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-700">
          Rating
          <input
            suppressHydrationWarning
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
            suppressHydrationWarning
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
            suppressHydrationWarning
            name="badge"
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            placeholder="New"
          />
        </label>
        <div className="grid gap-2 text-sm text-slate-700">
          <div className="flex items-center gap-2">
            <label>Badge tone</label>
            <InsightBadge insightKey="product-badge-tone" />
          </div>
          <select
            suppressHydrationWarning
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
        </div>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
          <input 
            suppressHydrationWarning
            name="requiresShipping" 
            type="checkbox" 
            defaultChecked={defaults.requiresShipping} 
            className="h-4 w-4 rounded border-slate-300" 
          />
          Requires shipping
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
          <input 
            suppressHydrationWarning
            name="trackInventory" 
            type="checkbox" 
            defaultChecked={defaults.trackInventory} 
            className="h-4 w-4 rounded border-slate-300" 
          />
          Track inventory
        </label>
        <label className="grid gap-2 text-sm text-slate-700 md:col-span-2">
          Short spec
          <input
            suppressHydrationWarning
            name="shortSpec"
            value={shortSpec}
            onChange={(e) => setShortSpec(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            placeholder="Wi-Fi, BLE, dual-core MCU"
          />
        </label>
        <div className="grid gap-2 text-sm text-slate-700 md:col-span-2">
          <div className="flex items-center gap-2">
            <label>Dependencies</label>
            <InsightBadge insightKey="product-dependencies" />
          </div>
          <input
            suppressHydrationWarning
            name="dependencies"
            value={dependencies}
            onChange={(e) => setDependencies(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            placeholder="e.g. nex-uno-r4, nex-lidar-mini (comma-separated SKUs or Slugs)"
          />
        </div>
        <div className="md:col-span-2 grid gap-4 grid-cols-1 md:grid-cols-3 items-end p-4 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
            <div className="grid gap-2 text-sm font-semibold text-blue-700">
              <div className="flex items-center gap-2">
                <label>Design Preset Theme</label>
                <InsightBadge insightKey="product-theme" />
              </div>
              <select
                suppressHydrationWarning
                onChange={handleThemeChange}
                defaultValue={PRESET_THEMES.find(t => t.accent === accent)?.name || 'custom'}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
              >
                {PRESET_THEMES.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                <option value="custom">Manual / Custom</option>
              </select>
            </div>
          <label className="grid gap-2 text-sm text-slate-700">
            Accent Gradient (Tailwind)
            <input
              suppressHydrationWarning
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
              suppressHydrationWarning
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
              suppressHydrationWarning
              name="variants"
              value={variants}
              onChange={(e) => setVariants(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              placeholder="Standard, Pro, Headerless"
            />
            <p className="text-[10px] text-slate-400">Comma-separated list of product types (e.g. Pin types, Colors).</p>
          </label>
          <label className="grid gap-2 text-sm text-slate-700">
            Configuration / Specs
            <input
              suppressHydrationWarning
              name="configs"
              value={configs}
              onChange={(e) => setConfigs(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              placeholder="4GB, 8GB, 128MB Flash"
            />
            <p className="text-[10px] text-slate-400">Comma-separated list of hardware configurations.</p>
          </label>
          <label className="grid gap-2 text-sm text-slate-700 md:col-span-2">
            Gallery Image URLs
            <textarea
              suppressHydrationWarning
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
              suppressHydrationWarning
              name="featureContent"
              rows={3}
              value={featureContent}
              onChange={(e) => setFeatureContent(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              placeholder="Describe the main technical features and certifications."
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-700 md:col-span-2">
            Usage & Setup Guide
            <textarea
              suppressHydrationWarning
              name="technicalContent"
              rows={3}
              value={technicalContent}
              onChange={(e) => setTechnicalContent(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              placeholder="How should the customer initialize or wire this product?"
            />
          </label>
        </div>
      </div>

      <label className="grid gap-2 text-sm text-slate-700">
        Short description
        <textarea
          suppressHydrationWarning
          name="shortDescription"
          rows={2}
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
          placeholder="Short line shown in cards and summaries."
        />
      </label>

      <label className="grid gap-2 text-sm text-slate-700">
        Description
        <textarea
          suppressHydrationWarning
          name="description"
          rows={4}
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
          placeholder="Full product description"
        />
      </label>

      <label className="grid gap-2 text-sm text-slate-700">
        Gallery photos (Upload Multiple)
        <input
          suppressHydrationWarning
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
          suppressHydrationWarning
          name="image"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="rounded-2xl border border-dashed border-slate-300 px-4 py-3"
        />
        <p className="text-[10px] text-slate-400">Main photo shown in search and catalog.</p>
      </label>

      {status.error && (
        <p suppressHydrationWarning className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {status.error}
        </p>
      )}

      {status.success && (
        <p suppressHydrationWarning className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {status.success}
        </p>
      )}

      <button
        suppressHydrationWarning
        type="submit"
        disabled={isPending}
        className="interactive-button inline-flex w-fit items-center justify-center rounded-full bg-slate-950 px-8 py-4 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-slate-300 transition-all shadow-xl shadow-slate-900/10"
      >
        {isPending ? 'Processing...' : mode === 'edit' ? 'Update product' : 'Create product'}
      </button>

      {mode === 'edit' && (
        <button
          suppressHydrationWarning
          type="button"
          onClick={onCancelEdit}
          className="interactive-button inline-flex w-fit items-center justify-center rounded-full border border-slate-200 px-8 py-4 text-sm font-bold text-slate-600 hover:border-slate-950 hover:text-slate-950 transition-all"
        >
          Cancel edit
        </button>
      )}
    </form>
  )
}
