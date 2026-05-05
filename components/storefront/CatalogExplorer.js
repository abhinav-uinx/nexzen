'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import ProductCard from '@/components/storefront/ProductCard'
import CatalogFilters from '@/components/storefront/CatalogFilters'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const SEARCH_STORAGE_KEY = 'nexzen:search-state'
const CATALOG_STORAGE_KEY = 'nexzen:catalog-state'
const DEFAULT_LIMIT = 20

function readStoredState(key, fallback) {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const raw = window.sessionStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

function writeStoredState(key, value) {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(key, JSON.stringify(value))
}

async function persistSearchQuery(query, accessToken) {
  if (!accessToken || !query?.trim()) {
    return
  }

  try {
    await fetch('/api/search/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ query }),
    })
  } catch {}
}

function buildPagination(currentPage, totalPages) {
  if (totalPages <= 1) {
    return []
  }

  const pages = new Set([1, totalPages, currentPage])
  if (currentPage > 1) pages.add(currentPage - 1)
  if (currentPage < totalPages) pages.add(currentPage + 1)

  const sortedPages = Array.from(pages).sort((a, b) => a - b)
  const items = []

  for (let index = 0; index < sortedPages.length; index += 1) {
    const page = sortedPages[index]
    const previousPage = sortedPages[index - 1]

    if (index > 0 && previousPage + 1 < page) {
      items.push(`gap-${previousPage}-${page}`)
    }

    items.push(page)
  }

  return items
}

export default function CatalogExplorer({ mode = 'catalog' }) {
  const router = useRouter()
  const { session } = useAuth()
  const storageKey = mode === 'search' ? SEARCH_STORAGE_KEY : CATALOG_STORAGE_KEY
  const lastPersistedQueryRef = useRef('')
  const fallbackState = useMemo(() => ({
    query: '',
    availability: '',
    minPrice: 0,
    maxPrice: 25000,
    page: 1,
  }), [])
  const [state, setState] = useState({
    query: '',
    availability: '',
    minPrice: 0,
    maxPrice: 25000,
    page: 1,
  })
  const [bootstrapped, setBootstrapped] = useState(false)
  const [products, setProducts] = useState([])
  const [wishlistedIds, setWishlistedIds] = useState([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const nextState = readStoredState(storageKey, fallbackState)
    setState(nextState)
    setBootstrapped(true)
  }, [fallbackState, storageKey])

  useEffect(() => {
    if (!bootstrapped) {
      return
    }
    writeStoredState(storageKey, state)
  }, [bootstrapped, state, storageKey])

  useEffect(() => {
    let cancelled = false

    async function loadResults() {
      if (!bootstrapped) {
        return
      }

      if (mode === 'search' && !state.query.trim()) {
        if (!cancelled) {
          setProducts([])
          setWishlistedIds([])
          setTotalItems(0)
          setLoading(false)
        }
        return
      }

      try {
        if (!cancelled) {
          setLoading(true)
        }

        const response = await fetch('/api/catalog/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            query: state.query,
            availability: state.availability,
            minPrice: state.minPrice,
            maxPrice: state.maxPrice,
            page: state.page,
            limit: DEFAULT_LIMIT,
          }),
        })

        const result = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(result.error || 'Could not load products.')
        }

        if (!cancelled) {
          setProducts(Array.isArray(result.products) ? result.products : [])
          setWishlistedIds(Array.isArray(result.wishlistedIds) ? result.wishlistedIds : [])
          setTotalItems(Number(result.totalItems || 0))
        }

        if (
          mode === 'search' &&
          session?.access_token &&
          state.query.trim() &&
          lastPersistedQueryRef.current !== state.query.trim().toLowerCase()
        ) {
          await persistSearchQuery(state.query, session.access_token)
          lastPersistedQueryRef.current = state.query.trim().toLowerCase()
        }
      } catch {
        if (!cancelled) {
          setProducts([])
          setWishlistedIds([])
          setTotalItems(0)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadResults()

    return () => {
      cancelled = true
    }
  }, [bootstrapped, mode, session?.access_token, state])

  const totalPages = Math.max(1, Math.ceil(totalItems / DEFAULT_LIMIT))
  const rangeStart = totalItems === 0 ? 0 : (state.page - 1) * DEFAULT_LIMIT + 1
  const rangeEnd = totalItems === 0 ? 0 : rangeStart + products.length - 1
  const paginationItems = useMemo(
    () => buildPagination(state.page, totalPages),
    [state.page, totalPages]
  )
  const heading = mode === 'search' ? `Results for "${state.query || 'your search'}"` : 'All products'
  const subheading = mode === 'search'
    ? 'Browse matching hardware, kits, and components with a clean search experience and compact filters.'
    : 'Engineered for modern builders. Explore our curated selection of maker kits and development boards.'

  const activeCount = useMemo(() => {
    let count = 0
    if (state.availability) count += 1
    if (state.minPrice > 0 || state.maxPrice < 25000) count += 1
    return count
  }, [state])

  useEffect(() => {
    if (!loading && totalItems > 0 && state.page > totalPages) {
      setState((current) => ({ ...current, page: totalPages }))
    }
  }, [loading, state.page, totalItems, totalPages])

  function updateFilters(nextValues) {
    setState((current) => ({
      ...current,
      ...nextValues,
      page: 1,
    }))
  }

  return (
    <section className="px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:rounded-[2rem] sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-blue-700">
                {mode === 'search' ? 'Search Results' : 'Catalog'}
              </p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">{heading}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:leading-7">{subheading}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              <CatalogFilters
                availability={state.availability}
                minPrice={state.minPrice}
                maxPrice={state.maxPrice}
                onAvailabilityChange={(availability) => updateFilters({ availability })}
                onPriceChange={({ min, max }) => updateFilters({ minPrice: min, maxPrice: max })}
                onClearAll={() => setState((current) => ({ ...current, availability: '', minPrice: 0, maxPrice: 25000, page: 1 }))}
              />
              {mode === 'search' ? (
                <button
                  type="button"
                  onClick={() => {
                    window.sessionStorage.removeItem(SEARCH_STORAGE_KEY)
                    router.replace('/search')
                    setState({ query: '', availability: '', minPrice: 0, maxPrice: 25000, page: 1 })
                  }}
                  className="interactive-button min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:border-blue-200 hover:bg-blue-50"
                >
                  Clear search
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 sm:mt-6">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
            {!bootstrapped || loading ? <LoadingSpinner size="sm" tone="blue" label="Loading" /> : totalItems === 0 ? '0 of 0 items' : `${rangeStart}-${rangeEnd} of ${totalItems} items`}
          </span>
          {activeCount > 0 ? (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-blue-700">
              {activeCount} active filter{activeCount > 1 ? 's' : ''}
            </span>
          ) : null}
          {totalPages > 1 ? (
            <span className="inline-flex items-center rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-500 border border-slate-200">
              Page {state.page} of {totalPages}
            </span>
          ) : null}
        </div>

        {!bootstrapped || loading ? (
          <div className="mt-8 grid gap-3 sm:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white p-4">
                <LoadingSkeleton className="h-40 w-full rounded-[1.4rem]" />
                <div className="mt-4 space-y-3">
                  <LoadingSkeleton className="h-3 w-20 rounded-full" />
                  <LoadingSkeleton className="h-6 w-full rounded-full" />
                  <LoadingSkeleton className="h-4 w-3/4 rounded-full" />
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <LoadingSkeleton className="h-8 w-24 rounded-full" />
                  <LoadingSkeleton className="h-10 w-10 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                initiallyWishlisted={wishlistedIds.includes(product.id)}
              />
            ))}
          </div>
        )}

        {!loading && products.length === 0 ? (
          <div className="mt-8 rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            {mode === 'search' && state.query
              ? `Nothing matched "${state.query}" yet.`
              : 'No products matched your current filters.'}
          </div>
        ) : null}

        {!loading && totalPages > 1 ? (
          <div className="mt-8 flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="text-sm text-slate-500">
              Showing page <span className="font-semibold text-slate-900">{state.page}</span> of{' '}
              <span className="font-semibold text-slate-900">{totalPages}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={state.page <= 1}
                onClick={() => setState((current) => ({ ...current, page: Math.max(1, current.page - 1) }))}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={16} />
                Prev
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {paginationItems.map((item) =>
                  typeof item === 'string' ? (
                    <span key={item} className="px-1 text-sm font-semibold text-slate-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setState((current) => ({ ...current, page: item }))}
                      className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition ${
                        state.page === item
                          ? 'bg-slate-950 text-white'
                          : 'border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                disabled={state.page >= totalPages}
                onClick={() => setState((current) => ({ ...current, page: Math.min(totalPages, current.page + 1) }))}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
