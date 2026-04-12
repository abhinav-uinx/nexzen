'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { useCart } from '@/providers/CartProvider'

const navLinkClass =
  'interactive-button rounded-full px-2 py-1 text-sm text-slate-300 transition-all duration-300 hover:bg-white/8 hover:text-white hover:shadow-[0_10px_24px_rgba(15,23,42,0.18)]'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { cartCount } = useCart()
  const { user, loading, signOut } = useAuth()
  const [query, setQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)
  const hiddenAdminBasePath = process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || '/nexzen-control-room'
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith(hiddenAdminBasePath)
  const userLabel =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')?.[0] ||
    'Account'
  const userEmail = user?.email || ''
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

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  function submitSearch(event) {
    event.preventDefault()
    const value = query.trim()
    router.push(value ? `/products?query=${encodeURIComponent(value)}` : '/products')
    setMobileOpen(false)
  }

  async function handleLogout() {
    await signOut()
    setProfileOpen(false)
    setMobileOpen(false)
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(5,10,20,0.78)] backdrop-blur-xl">
      {!isAdminRoute && (
        <div className="border-b border-white/10 bg-[linear-gradient(90deg,rgba(38,92,255,0.2),rgba(17,24,39,0))]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 px-4 py-2 text-center text-xs text-slate-200 sm:justify-between sm:gap-4 sm:px-6 md:text-left">
            <p className="w-full sm:w-auto">Launch offer: 5% off on your first build with code `NEXZEN5`.</p>
            <p className="hidden md:block">Trusted by student teams, labs, and hardware makers across India.</p>
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-slate-950 shadow-[0_10px_24px_rgba(15,23,42,0.28)] sm:h-16 sm:w-16 sm:rounded-2xl">
              <Image
                src="/nexzen-logo.png"
                alt="Nexzen logo"
                fill
                sizes="(max-width: 640px) 48px, 64px"
                className="scale-125 object-cover"
                priority
              />
            </div>
            <div>
              <p className="font-heading text-lg font-semibold tracking-tight text-white sm:text-xl">Nexzen</p>
              <p className="hidden text-xs text-slate-400 sm:block">Electronics for modern builders</p>
            </div>
          </div>
        </Link>

        {!isAdminRoute && (
          <>
            <form
              onSubmit={submitSearch}
              className="hidden flex-1 items-center rounded-full border border-white/10 bg-white/5 px-2 md:flex"
            >
              <input
                suppressHydrationWarning
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search boards, kits, sensors, or power modules"
                className="w-full bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400"
              />
              <button
                suppressHydrationWarning
                type="submit"
                className="interactive-button rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200 hover:shadow-[0_12px_30px_rgba(255,255,255,0.18)]"
              >
                Search
              </button>
            </form>

            <nav className="hidden items-center gap-5 text-sm text-slate-300 lg:flex">
              <Link href="/products" className={navLinkClass}>
                Catalog
              </Link>
              <Link href="/products?category=stem-kits" className={navLinkClass}>
                Kits
              </Link>
              <Link href="/products?sort=newest" className={navLinkClass}>
                New arrivals
              </Link>
            </nav>
          </>
        )}

        <div className="ml-auto flex items-center gap-3">
          {!isAdminRoute && (
            <Link href="/cart" className={`relative inline-flex items-center gap-2 ${navLinkClass}`}>
              <span className="inline-flex h-5 w-5 items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3.75h1.386c.51 0 .955.343 1.084.837l.383 1.473m0 0 1.5 5.772A1.125 1.125 0 0 0 7.69 12.75h8.74a1.125 1.125 0 0 0 1.087-.838l1.823-6.838H5.103Zm3.147 11.94a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm9 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
              </span>
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="inline-flex min-w-6 justify-center rounded-full bg-cyan-300 px-2 py-0.5 text-xs font-semibold text-slate-950">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {!isAdminRoute &&
            (user ? (
              <div ref={profileRef} className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setProfileOpen((open) => !open)}
                  className={`inline-flex items-center gap-2 ${navLinkClass}`}
                >
                  <span className="relative inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-slate-950 text-[11px] font-semibold text-white">
                    <Image
                      src={profileImageSrc}
                      alt="Profile logo"
                      fill
                      sizes="24px"
                      className="object-cover scale-110"
                    />
                  </span>
                  <span>{userLabel}</span>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[320px] rounded-[1.75rem] border border-white/10 bg-[rgba(12,18,32,0.96)] p-4 text-white shadow-[0_24px_70px_rgba(2,6,23,0.45)] backdrop-blur-xl">
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-center">
                      <div className="relative mx-auto inline-flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-slate-950 text-2xl font-semibold">
                        <Image
                          src={profileImageSrc}
                          alt="Profile logo"
                          fill
                          sizes="80px"
                          className="object-cover scale-110"
                        />
                      </div>
                      <p className="mt-4 text-2xl font-semibold">{userLabel}</p>
                      <p className="mt-1 text-sm text-slate-300">{userEmail}</p>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Link
                        href="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="interactive-button flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-slate-200 hover:bg-white/10 hover:text-white"
                      >
                        <span>View profile</span>
                        <span aria-hidden="true">-&gt;</span>
                      </Link>
                      <Link
                        href="/active-orders"
                        onClick={() => setProfileOpen(false)}
                        className="interactive-button flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-slate-200 hover:bg-white/10 hover:text-white"
                      >
                        <span>Active orders</span>
                        <span aria-hidden="true">-&gt;</span>
                      </Link>
                      <Link
                        href="/ordered-items"
                        onClick={() => setProfileOpen(false)}
                        className="interactive-button flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-slate-200 hover:bg-white/10 hover:text-white"
                      >
                        <span>Ordered items</span>
                        <span aria-hidden="true">-&gt;</span>
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="interactive-button flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm text-rose-200 hover:bg-rose-500/15 hover:text-white"
                      >
                        <span>Logout</span>
                        <span aria-hidden="true">-&gt;</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className={`hidden items-center gap-2 sm:inline-flex ${navLinkClass}`}>
                <span className="inline-flex h-5 w-5 items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.125a7.5 7.5 0 0 1 15 0" />
                  </svg>
                </span>
                <span>{loading ? '...' : 'Login'}</span>
              </Link>
            ))}

          <button
            suppressHydrationWarning
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className={`interactive-button rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 md:hidden${isAdminRoute ? ' hidden' : ''}`}
          >
            Menu
          </button>
        </div>
      </div>

      {mobileOpen && !isAdminRoute && (
        <div className="border-t border-white/10 bg-slate-950/95 px-4 py-4 md:hidden">
          <form onSubmit={submitSearch} className="mb-4 flex items-center rounded-2xl border border-white/10 bg-white/5 px-2">
            <input
              suppressHydrationWarning
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search catalog"
              className="w-full bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400"
            />
            <button suppressHydrationWarning type="submit" className="interactive-button rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 hover:bg-slate-200">
              Go
            </button>
          </form>
          <div className="flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="interactive-button rounded-2xl border border-white/10 px-4 py-3 text-sm hover:bg-white/10"
                  style={{ color: '#ffffff' }}
                >
                  {userLabel}
                </Link>
                <Link
                  href="/active-orders"
                  onClick={() => setMobileOpen(false)}
                  className="interactive-button rounded-2xl border border-white/10 px-4 py-3 text-sm hover:bg-white/10"
                  style={{ color: '#ffffff' }}
                >
                  Active orders
                </Link>
                <Link
                  href="/ordered-items"
                  onClick={() => setMobileOpen(false)}
                  className="interactive-button rounded-2xl border border-white/10 px-4 py-3 text-sm hover:bg-white/10"
                  style={{ color: '#ffffff' }}
                >
                  Ordered items
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="interactive-button rounded-2xl border border-white/10 px-4 py-3 text-left text-sm hover:bg-white/10"
                  style={{ color: '#ffffff' }}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="interactive-button rounded-2xl border border-white/10 px-4 py-3 text-sm hover:bg-white/10"
                style={{ color: '#ffffff' }}
              >
                Login
              </Link>
            )}
            <Link
              href="/cart"
              onClick={() => setMobileOpen(false)}
              className="interactive-button rounded-2xl border border-white/10 px-4 py-3 text-sm hover:bg-white/10"
              style={{ color: '#ffffff' }}
            >
              Cart
            </Link>
            <Link
              href="/products"
              onClick={() => setMobileOpen(false)}
              className="interactive-button rounded-2xl border border-white/10 px-4 py-3 text-sm hover:bg-white/10"
              style={{ color: '#ffffff' }}
            >
              Full catalog
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
