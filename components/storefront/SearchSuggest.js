'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock3 } from 'lucide-react'

export default function SearchSuggest({
  value,
  onChange,
  onSubmit,
  placeholder,
  inputClassName,
  wrapperClassName = '',
  renderLeading,
  renderTrailing,
  basePath = '/p',
  authToken = '',
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [recentSearches, setRecentSearches] = useState([])
  const [trendingSearches, setTrendingSearches] = useState([])
  const [recentSearchesToken, setRecentSearchesToken] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [panelMode, setPanelMode] = useState('suggestions')
  const [recentLoaded, setRecentLoaded] = useState(false)
  const [loadingRecent, setLoadingRecent] = useState(false)
  const containerRef = useRef(null)

  const trimmedValue = value.trim()
  const shouldSuggest = trimmedValue.length >= 2
  const panelItems = panelMode === 'recent' ? recentSearches : suggestions

  useEffect(() => {
    function handleOutsideClick(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    if (!shouldSuggest) {
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(trimmedValue)}`, {
          signal: controller.signal,
        })
        const result = await response.json().catch(() => ({ suggestions: [] }))
        const nextSuggestions = Array.isArray(result.suggestions) ? result.suggestions : []
        setSuggestions(nextSuggestions)
        setPanelMode('suggestions')
        setOpen(nextSuggestions.length > 0)
        setHighlightedIndex(nextSuggestions.length > 0 ? 0 : -1)
      } catch (error) {
        if (error?.name !== 'AbortError') {
          setSuggestions([])
          setOpen(false)
          setHighlightedIndex(-1)
        }
      }
    }, 180)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [trimmedValue, shouldSuggest])

  const activeSuggestion = useMemo(
    () => (highlightedIndex >= 0 ? panelItems[highlightedIndex] : null),
    [highlightedIndex, panelItems]
  )

  function submitValue(nextValue = trimmedValue) {
    onSubmit(nextValue)
    setOpen(false)
  }

  function openSuggestion(suggestion) {
    setOpen(false)
    router.push(`${basePath}/${suggestion.slug}`)
  }

  async function loadTrendingSearches() {
    try {
      const response = await fetch('/api/search/history?scope=trending&limit=6')
      const result = await response.json().catch(() => ({ searches: [] }))
      const nextSearches = Array.isArray(result.searches) ? result.searches : []
      setTrendingSearches(nextSearches)
      return nextSearches
    } catch {
      setTrendingSearches([])
      return []
    }
  }

  async function loadRecentSearches() {
    setLoadingRecent(true)

    if (!authToken) {
      const trends = await loadTrendingSearches()
      setPanelMode('recent')
      setOpen(trends.length > 0)
      setHighlightedIndex(-1)
      setLoadingRecent(false)
      return
    }

    if (recentLoaded && recentSearchesToken === authToken) {
      setPanelMode(recentSearches.length > 0 ? 'recent' : 'suggestions')
      const trends = trendingSearches.length > 0 ? trendingSearches : await loadTrendingSearches()
      const hasPanelItems = recentSearches.length > 0 || trends.length > 0
      setOpen(hasPanelItems)
      setHighlightedIndex(recentSearches.length > 0 ? 0 : -1)
      setLoadingRecent(false)
      return
    }

    setOpen(false)

    try {
      const [recentResponse, trends] = await Promise.all([
        fetch('/api/search/history?limit=6', {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }),
        loadTrendingSearches(),
      ])
      const result = await recentResponse.json().catch(() => ({ searches: [] }))
      const nextSearches = Array.isArray(result.searches) ? result.searches : []
      setRecentSearches(nextSearches)
      setRecentLoaded(true)
      setRecentSearchesToken(authToken)
      setPanelMode(nextSearches.length > 0 ? 'recent' : 'suggestions')
      setOpen(nextSearches.length > 0 || trends.length > 0)
      setHighlightedIndex(nextSearches.length > 0 ? 0 : -1)
    } catch {
      const trends = await loadTrendingSearches()
      setRecentLoaded(true)
      setRecentSearches([])
      setRecentSearchesToken(authToken)
      setOpen(trends.length > 0)
      setHighlightedIndex(-1)
    } finally {
      setLoadingRecent(false)
    }
  }

  async function clearRecentSearches() {
    if (!authToken) {
      return
    }

    try {
      await fetch('/api/search/history', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
      setRecentSearches([])
      setPanelMode('recent')
      setOpen(trendingSearches.length > 0)
      setHighlightedIndex(-1)
    } catch {}
  }

  function handleChange(nextValue) {
    onChange(nextValue)

    const nextTrimmedValue = nextValue.trim()
    if (nextTrimmedValue.length >= 2) {
      return
    }

    if (nextTrimmedValue.length === 0 && authToken && recentLoaded && recentSearchesToken === authToken) {
      setPanelMode(recentSearches.length > 0 ? 'recent' : 'suggestions')
      setOpen(recentSearches.length > 0)
      setHighlightedIndex(recentSearches.length > 0 ? 0 : -1)
      return
    }

    setOpen(false)
    setHighlightedIndex(-1)
  }

  function handleKeyDown(event) {
    if (!open || panelItems.length === 0) {
      if (event.key === 'Enter') {
        event.preventDefault()
        submitValue()
      }
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex((current) => (current + 1) % panelItems.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex((current) => (current <= 0 ? panelItems.length - 1 : current - 1))
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      submitValue(activeSuggestion?.query || activeSuggestion?.name || trimmedValue)
      return
    }

    if (event.key === 'Escape') {
      setOpen(false)
      setHighlightedIndex(-1)
    }
  }

  return (
    <div ref={containerRef} className={`relative ${wrapperClassName}`}>
      <div className="relative">
        {renderLeading ? renderLeading() : null}
        <input
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => {
            if (trimmedValue.length >= 2) {
              setOpen(suggestions.length > 0)
              return
            }

            loadRecentSearches()
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={inputClassName}
          suppressHydrationWarning
        />
        {renderTrailing ? renderTrailing() : null}
      </div>

      {open && (panelItems.length > 0 || (!trimmedValue && trendingSearches.length > 0)) ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-[24rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.14)]">
          <div className="max-h-[19rem] overflow-y-auto py-2">
            {trimmedValue.length === 0 ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Recent searches
                  </span>
                  {recentSearches.length > 0 ? (
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500"
                    >
                      Clear all
                    </button>
                  ) : null}
                </div>
                {loadingRecent ? (
                  <div className="px-4 py-4 text-sm text-slate-500">Loading search history...</div>
                ) : recentSearches.length > 0 ? (
                  recentSearches.map((item, index) => (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        onChange(item.query)
                        submitValue(item.query)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          onChange(item.query)
                          submitValue(item.query)
                        }
                      }}
                      className={`flex items-center justify-between gap-4 px-4 py-3 transition ${
                        index === highlightedIndex ? 'bg-blue-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                          <Clock3 size={16} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-950">{item.query}</p>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {item.searchCount > 1 ? `${item.searchCount} searches` : 'Recent search'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          onChange(item.query)
                          submitValue(item.query)
                        }}
                        className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        Search
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-4 text-sm text-slate-500">No recent searches yet.</div>
                )}

                {trendingSearches.length > 0 ? (
                  <>
                    <div className="border-b border-t border-slate-100 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Trending searches
                    </div>
                    {trendingSearches.map((item) => (
                      <div
                        key={`trend-${item.id}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          onChange(item.query)
                          submitValue(item.query)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            onChange(item.query)
                            submitValue(item.query)
                          }
                        }}
                        className="flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-slate-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-950">{item.query}</p>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {item.searchCount > 1 ? `${item.searchCount} searches` : 'Trending now'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            onChange(item.query)
                            submitValue(item.query)
                          }}
                          className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          Search
                        </button>
                      </div>
                    ))}
                  </>
                ) : null}
              </>
            ) : (
              <>
                <div className="border-b border-slate-100 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {panelMode === 'recent' ? 'Recent searches' : 'Suggestions'}
                </div>
                {panelItems.map((item, index) => (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (panelMode === 'recent') {
                        onChange(item.query)
                        submitValue(item.query)
                        return
                      }

                      openSuggestion(item)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        if (panelMode === 'recent') {
                          onChange(item.query)
                          submitValue(item.query)
                          return
                        }

                        openSuggestion(item)
                      }
                    }}
                    className={`flex items-center justify-between gap-4 px-4 py-3 transition ${
                      index === highlightedIndex ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    {panelMode === 'recent' ? (
                      <>
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                            <Clock3 size={16} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-950">{item.query}</p>
                            <p className="mt-1 truncate text-xs text-slate-500">
                              {item.searchCount > 1 ? `${item.searchCount} searches` : 'Recent search'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            onChange(item.query)
                            submitValue(item.query)
                          }}
                          className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          Search
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-950">{item.name}</p>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {[item.brand, item.categoryName].filter(Boolean).join(' - ') || item.slug}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            onChange(item.name)
                            submitValue(item.name)
                          }}
                          className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          Search
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
