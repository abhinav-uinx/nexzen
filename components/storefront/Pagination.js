'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ currentPage, totalPages, baseUrl, queryParams = {} }) {
  if (totalPages <= 1) return null

  const getPageUrl = (page) => {
    const params = new URLSearchParams(queryParams)
    params.set('page', page)
    return `${baseUrl}?${params.toString()}`
  }

  // Generate page numbers to show (e.g., [1, 2, 3, '...', 10])
  const getPages = () => {
    const pages = []
    const range = 2 // How many pages to show around current page

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || 
        i === totalPages || 
        (i >= currentPage - range && i <= currentPage + range)
      ) {
        pages.push(i)
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...')
      }
    }
    return pages
  }

  return (
    <div className="mt-12 flex items-center justify-center gap-2">
      {/* Previous Button */}
      {currentPage > 1 ? (
        <Link
          href={getPageUrl(currentPage - 1)}
          className="interactive-button flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:border-slate-950 hover:text-slate-950 shadow-sm"
        >
          <ChevronLeft size={18} />
        </Link>
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-300">
          <ChevronLeft size={18} />
        </div>
      )}

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {getPages().map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-slate-400">...</span>
          ) : (
            <Link
              key={page}
              href={getPageUrl(page)}
              className={`flex h-10 min-w-[2.5rem] items-center justify-center rounded-xl px-3 text-sm font-bold transition-all ${
                currentPage === page
                  ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/10'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-950 shadow-sm'
              }`}
            >
              {page}
            </Link>
          )
        ))}
      </div>

      {/* Next Button */}
      {currentPage < totalPages ? (
        <Link
          href={getPageUrl(currentPage + 1)}
          className="interactive-button flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:border-slate-950 hover:text-slate-950 shadow-sm"
        >
          <ChevronRight size={18} />
        </Link>
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-300">
          <ChevronRight size={18} />
        </div>
      )}
    </div>
  )
}
