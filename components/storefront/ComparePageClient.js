'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'
import { Trash2, X } from 'lucide-react'
import { clearCompareItems, removeCompareItem, useCompareItems } from '@/components/storefront/CompareButton'

export default function ComparePageClient() {
  const items = useCompareItems()

  const rows = useMemo(
    () => [
      { label: 'Category', getValue: (item) => item.categoryName || 'N/A' },
      { label: 'Price', getValue: (item) => `Rs. ${Number(item.price || 0).toLocaleString('en-IN')}` },
      { label: 'Stock', getValue: (item) => (item.inStock ? 'In stock' : 'Out of stock') },
      { label: 'Rating', getValue: (item) => `${item.rating || 0} (${item.reviews || 0} reviews)` },
      { label: 'Spec', getValue: (item) => item.shortSpec || 'N/A' },
      { label: 'Summary', getValue: (item) => item.blurb || 'N/A' },
    ],
    []
  )

  if (items.length === 0) {
    return (
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
          <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Compare</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold text-slate-950">No products in compare yet</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Add up to four products from the catalog to compare them side by side.
          </p>
          <Link href="/p" className="interactive-button mt-6 inline-flex rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white">
            Browse catalog
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Compare</p>
              <h1 className="mt-3 font-heading text-4xl font-semibold text-slate-950">Side-by-side product comparison</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                Review specs, pricing, stock, and positioning across your shortlisted boards and kits.
              </p>
            </div>
            <button
              type="button"
              onClick={clearCompareItems}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              <Trash2 size={16} />
              Remove all
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-[2rem] border border-slate-200 bg-white shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="min-w-[180px] border-b border-slate-200 p-4 text-left text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                  Attribute
                </th>
                {items.map((item) => (
                  <th key={item.id} className="min-w-[260px] border-b border-l border-slate-200 p-4 align-top">
                    <div className="space-y-4 text-left">
                      <div className="flex items-start justify-between gap-3">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                          Compared
                        </span>
                        <button
                          type="button"
                          onClick={() => removeCompareItem(item.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                          title={`Remove ${item.name}`}
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="relative h-36 overflow-hidden rounded-2xl bg-slate-50">
                        {item.imageUrl ? <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-4" sizes="260px" /> : null}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-700">{item.categoryName}</p>
                        <Link href={`/p/${item.slug || item.id}`} className="mt-2 block text-lg font-semibold text-slate-950 hover:text-blue-700">
                          {item.name}
                        </Link>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td className="border-b border-slate-200 p-4 text-sm font-semibold text-slate-950">{row.label}</td>
                  {items.map((item) => (
                    <td key={`${item.id}-${row.label}`} className="border-b border-l border-slate-200 p-4 text-sm leading-6 text-slate-600">
                      {row.getValue(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
