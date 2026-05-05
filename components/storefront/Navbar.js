'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { useCart } from '@/providers/CartProvider'
import { ShoppingBag, User, Menu, X, ChevronRight, SlidersHorizontal, GitCompareArrows, Search } from 'lucide-react'
import SearchSuggest from '@/components/storefront/SearchSuggest'
import { useCompareItems } from '@/components/storefront/CompareButton'
import { buildSearchPath } from '@/lib/catalog/search-url'

const SEARCH_STORAGE_KEY = 'nexzen:search-state'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { cartCount } = useCart()
  const compareItems = useCompareItems()
  const { session, user, signOut } = useAuth()
  const [query, setQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [accountSummary, setAccountSummary] = useState({
    wishlistCount: 0,
    orderCount: 0,
    profileIncomplete: false,
  })
  
  const profileRef = useRef(null)
  const hiddenAdminBasePath = process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || '/nexzen-control-room'
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith(hiddenAdminBasePath)
  
  const userLabel =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')?.[0] ||
    'Account'
  
  const profileImageSrc =
    user?.user_metadata?.avatar_url ||
    process.env.NEXT_PUBLIC_SUPABASE_BRAND_LOGO_URL ||
    '/nexzen-logo.png'

  useEffect(() => {
    function handleOutsideClick(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (pathname === '/search') {
      try {
        const raw = window.sessionStorage.getItem(SEARCH_STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          setQuery(parsed?.query || '')
        }
      } catch {
        setQuery('')
      }
      return
    }

    if (!pathname.startsWith('/search')) {
      setQuery('')
    }
  }, [pathname])

  useEffect(() => {
    let active = true

    async function loadAccountSummary() {
      if (!user || !session?.access_token || isAdminRoute) {
        if (active) {
          setAccountSummary({
            wishlistCount: 0,
            orderCount: 0,
            profileIncomplete: false,
          })
        }
        return
      }

      try {
        const headers = {
          Authorization: `Bearer ${session.access_token}`,
        }

        const [profileResponse, ordersResponse, wishlistResponse] = await Promise.all([
          fetch('/api/profile', { headers }),
          fetch('/api/orders', { headers }),
          fetch('/api/wishlist', { headers }),
        ])

        const profileResult = await profileResponse.json().catch(() => ({}))
        const ordersResult = await ordersResponse.json().catch(() => ({}))
        const wishlistResult = await wishlistResponse.json().catch(() => ({}))

        const profile = profileResult?.profile || {}
        const orderCount = Array.isArray(ordersResult?.orders) ? ordersResult.orders.length : 0
        const wishlistCount = Array.isArray(wishlistResult?.wishlist) ? wishlistResult.wishlist.length : 0
        const profileIncomplete = !(
          profile?.name &&
          profile?.phone &&
          profile?.addressLine1 &&
          profile?.city &&
          profile?.state &&
          profile?.pincode
        )

        if (active) {
          setAccountSummary({
            wishlistCount,
            orderCount,
            profileIncomplete,
          })
        }
      } catch {
        if (active) {
          setAccountSummary((current) => ({
            ...current,
            profileIncomplete: false,
          }))
        }
      }
    }

    loadAccountSummary()

    return () => {
      active = false
    }
  }, [isAdminRoute, session?.access_token, user])

  function goToSearch(value = query.trim()) {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(
        SEARCH_STORAGE_KEY,
        JSON.stringify({
          query: value,
          availability: '',
          minPrice: 0,
          maxPrice: 25000,
        })
      )
    }
    router.push(buildSearchPath(value))
    setMobileOpen(false)
    setMobileSearchOpen(false)
  }

  function submitSearch(event) {
    event.preventDefault()
    goToSearch(query.trim())
  }

  async function handleLogout() {
    await signOut()
    setProfileOpen(false)
    setMobileOpen(false)
    setMobileSearchOpen(false)
    router.push('/')
  }

  return (
    <header 
      className="sticky top-0 z-50 w-full bg-[#000000] text-white transition-all border-b border-white/5 h-[80px] sm:h-[90px]"
    >
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-6 lg:px-10 gap-8">
        {/* Brand Area */}
        <div className="flex items-center gap-4 shrink-0">
          <button 
            onClick={() => {
              setMobileSearchOpen(false)
              setMobileOpen(!mobileOpen)
            }}
            className="md:hidden flex items-center justify-center w-10 h-10 text-white transition-all active:scale-95"
            suppressHydrationWarning={true}
          >
            {mobileOpen ? (
              <X size={26} className="animate-in fade-in zoom-in spin-in-90 duration-300" />
            ) : (
              <Menu size={26} className="animate-in fade-in zoom-in duration-300" />
            )}
          </button>
          
          <Link href="/" className="flex items-center gap-4 group">
            <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full transition-transform duration-300 group-hover:scale-110">
              <Image
                src="https://wqnjxafgzldzqpazzxaw.supabase.co/storage/v1/object/public/brand-assets/smiplelogo.png"
                alt="NZ"
                fill
                className="object-contain p-1"
                priority
              />
            </div>
            <div className="hidden lg:block">
              <h1 className="text-xl font-bold leading-none tracking-tight">Nexzen</h1>
              <p className="mt-1 text-[11px] font-medium text-white/40">Electronics for modern builders</p>
            </div>
          </Link>
        </div>

        {!isAdminRoute && mobileSearchOpen && (
          <div className="absolute inset-x-0 top-0 z-50 flex h-full items-center bg-black px-4 md:hidden">
            <form onSubmit={submitSearch} className="relative w-full">
              <SearchSuggest
                value={query}
                onChange={setQuery}
                onSubmit={goToSearch}
                authToken={session?.access_token || ''}
                placeholder="Search products..."
                wrapperClassName="text-slate-950"
                inputClassName="w-full rounded-full border border-white/15 bg-white/5 py-3 pl-[3.75rem] pr-[6.5rem] text-sm text-white placeholder:text-white/30 outline-none"
                renderLeading={() => (
                  <span className="absolute left-4 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center text-white/70">
                    <Search size={18} />
                  </span>
                )}
                renderTrailing={() => (
                  <div className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1">
                    <button
                      type="submit"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black"
                    >
                      <ChevronRight size={18} strokeWidth={3} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileSearchOpen(false)}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-white/70"
                      aria-label="Close search"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              />
            </form>
          </div>
        )}

        {/* Central Search Bar */}
        {!isAdminRoute && (
          <div className="hidden flex-1 max-w-xl md:block">
            <form onSubmit={submitSearch} className="relative group">
              <SearchSuggest
                value={query}
                onChange={setQuery}
                onSubmit={goToSearch}
                authToken={session?.access_token || ''}
                placeholder="Search products..."
                wrapperClassName="text-slate-950"
                inputClassName="w-full rounded-full bg-black border border-white/20 py-3 pl-[4.25rem] pr-14 text-sm text-white placeholder:text-white/30 outline-none transition-all focus:border-white/40 focus:ring-2 focus:ring-white/5"
                renderLeading={() => (
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={() => router.push('/p')}
                    className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-white transition-all hover:scale-110 active:scale-90"
                    title="Advanced Filters"
                  >
                    <SlidersHorizontal size={16} />
                  </button>
                )}
                renderTrailing={() => (
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105 active:scale-95"
                    suppressHydrationWarning
                  >
                    <ChevronRight size={20} strokeWidth={3} />
                  </button>
                )}
              />
            </form>
          </div>
        )}

        {/* Desktop Nav Links & Actions */}
        <div className="flex items-center gap-10">
          {!isAdminRoute && (
            <nav className="hidden items-center gap-8 md:flex">
              <Link href="/p" className="text-[14px] font-medium text-white/70 transition-colors hover:text-white">Catalog</Link>
              <Link href="/p?category=stem-kits" className="text-[14px] font-medium text-white/70 transition-colors hover:text-white">Kits</Link>
              <Link href="/p?sort=newest" className="text-[14px] font-medium text-white/70 transition-colors hover:text-white">New arrivals</Link>
            </nav>
          )}

          <div className="flex items-center gap-6">
            {!isAdminRoute && (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false)
                  setMobileSearchOpen(true)
                }}
                className="flex items-center justify-center text-white/70 transition-colors hover:text-white md:hidden"
                aria-label="Open search"
              >
                <Search size={20} />
              </button>
            )}

            {!isAdminRoute && compareItems.length > 0 && (
              <Link href="/compare" className="flex items-center gap-2 text-white/70 transition-colors hover:text-white">
                <div className="relative">
                  <GitCompareArrows size={20} />
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black border border-[#111]">
                    {compareItems.length}
                  </span>
                </div>
                <span className="hidden lg:inline text-sm font-medium">Compare</span>
              </Link>
            )}

            {!isAdminRoute && (
              <Link href="/cart" className="flex items-center gap-2 text-white/70 transition-colors hover:text-white">
                <div className="relative">
                  <ShoppingBag size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black border border-[#111]">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="hidden lg:inline text-sm font-medium">Cart</span>
              </Link>
            )}

            {!isAdminRoute && (
              <div ref={profileRef} className="relative">
                <button 
                  onClick={() => user ? setProfileOpen(!profileOpen) : router.push('/login')} 
                  className="flex items-center gap-2 text-white/70 transition-colors hover:text-white"
                  suppressHydrationWarning={true}
                >
                  <div className="relative">
                    <User size={20} />
                    {accountSummary.profileIncomplete ? (
                      <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                        !
                      </span>
                    ) : null}
                  </div>
                  <span className="hidden lg:inline text-sm font-medium">
                    { (typeof window !== 'undefined' && user) ? userLabel : 'Sign In' }
                  </span>
                </button>
                
                {profileOpen && user && (
                  <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-64 overflow-hidden rounded-2xl border border-white/5 bg-[#1a1a1a] p-2 shadow-2xl ring-1 ring-white/10 animate-[apple-fade_0.18s_var(--ease-apple)_both]">
                    <div className="mb-2 flex items-center gap-3 border-b border-white/5 px-3 py-3">
                      <div className="relative h-10 w-10 overflow-hidden rounded-full bg-white/5">
                        <Image src={profileImageSrc} alt="Profile" fill className="object-cover" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="truncate text-xs font-semibold text-white">{userLabel}</p>
                        <p className="truncate text-[10px] text-white/40">{user?.email}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      {[ 
                        { label: 'Profile', href: '/u', alert: accountSummary.profileIncomplete ? '!' : null, alertTone: 'rose' },
                        { label: 'Wishlist', href: '/u?tab=wishlist', count: accountSummary.wishlistCount },
                        { label: 'Orders', href: '/o', count: accountSummary.orderCount }
                      ].map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                        >
                          <span>{item.label}</span>
                          <div className="flex items-center gap-2">
                            {item.alert ? (
                              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                                {item.alert}
                              </span>
                            ) : null}
                            {item.count > 0 ? (
                              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-white/10 px-1.5 text-[10px] font-bold text-white">
                                {item.count > 99 ? '99+' : item.count}
                              </span>
                            ) : null}
                            <ChevronRight size={14} className="opacity-40" />
                          </div>
                        </Link>
                      ))}
                      <button
                        onClick={handleLogout}
                        className="mt-2 w-full rounded-lg bg-rose-500/10 px-3 py-2 text-left text-xs font-semibold text-rose-500 transition-colors hover:bg-rose-500/20"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileOpen && !mobileSearchOpen && (
        <div className="fixed inset-0 top-[80px] z-40 bg-[#000] px-10 pt-10 text-white animate-apple-fade">
          <nav className="flex flex-col gap-6 text-3xl font-bold tracking-tight">
            <Link href="/p" onClick={() => setMobileOpen(false)}>Catalog</Link>
            <Link href="/compare" onClick={() => setMobileOpen(false)}>Compare</Link>
            <Link href="/p?category=stem-kits" onClick={() => setMobileOpen(false)}>STEM Kits</Link>
            <Link href="/p?sort=newest" onClick={() => setMobileOpen(false)}>New Arrivals</Link>
            <Link href="/support" onClick={() => setMobileOpen(false)}>Support</Link>
          </nav>

          <form onSubmit={submitSearch} className="mt-12">
            <SearchSuggest
              value={query}
              onChange={setQuery}
              onSubmit={goToSearch}
              authToken={session?.access_token || ''}
              placeholder="Search Nexzen..."
              inputClassName="w-full rounded-full border border-white/10 bg-white/5 py-4 pl-16 pr-16 text-lg text-white placeholder:text-white/20 outline-none"
              renderLeading={() => (
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => { setMobileOpen(false); router.push('/p'); }}
                  className="absolute left-2 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-white active:scale-90"
                >
                  <SlidersHorizontal size={20} />
                </button>
              )}
              renderTrailing={() => (
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black"
                >
                  <ChevronRight size={24} strokeWidth={3} />
                </button>
              )}
            />
          </form>
        </div>
      )}
    </header>
  )
}
