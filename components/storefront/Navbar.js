'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { useCart } from '@/providers/CartProvider'
import { Search, ShoppingBag, User, Menu, X, ChevronRight, SlidersHorizontal } from 'lucide-react'

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
    return () => document.addEventListener('mousedown', handleOutsideClick)
  }, [])

  function submitSearch(event) {
    event.preventDefault()
    const value = query.trim()
    router.push(value ? `/p?query=${encodeURIComponent(value)}` : '/p')
    setMobileOpen(false)
  }

  async function handleLogout() {
    await signOut()
    setProfileOpen(false)
    setMobileOpen(false)
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
            onClick={() => setMobileOpen(!mobileOpen)}
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

        {/* Central Search Bar */}
        {!isAdminRoute && (
          <div className="hidden flex-1 max-w-xl md:block">
            <form onSubmit={submitSearch} className="relative group">
              <div className="flex items-center rounded-full bg-black border border-white/20 p-1.5 pl-2 transition-all focus-within:border-white/40 focus-within:ring-2 focus-within:ring-white/5">
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => router.push('/p?filter=open')}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-all hover:scale-110 active:scale-90"
                  title="Advanced Filters"
                >
                  <SlidersHorizontal size={16} />
                </button>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products..."
                  className="flex-1 bg-transparent py-2 pl-3 text-sm text-white placeholder:text-white/30 outline-none"
                  suppressHydrationWarning={true}
                />
                <button 
                  type="submit"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105 active:scale-95"
                  suppressHydrationWarning={true}
                >
                  <ChevronRight size={20} strokeWidth={3} />
                </button>
              </div>
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
                  <User size={20} />
                  <span className="hidden lg:inline text-sm font-medium">
                    { (typeof window !== 'undefined' && user) ? userLabel : 'Sign In' }
                  </span>
                </button>
                
                {profileOpen && user && (
                  <div className="absolute right-0 top-[calc(100%+20px)] w-64 animate-apple-fade overflow-hidden rounded-2xl border border-white/5 bg-[#1a1a1a] p-2 shadow-2xl ring-1 ring-white/10">
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
                        { label: 'Profile', href: '/u' },
                        { label: 'Wishlist', href: '/u?tab=wishlist' },
                        { label: 'Orders', href: '/o' }
                      ].map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                        >
                          {item.label}
                          <ChevronRight size={14} className="opacity-40" />
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
      {mobileOpen && (
        <div className="fixed inset-0 top-[80px] z-40 bg-[#000] px-10 pt-10 text-white animate-apple-fade">
          <nav className="flex flex-col gap-6 text-3xl font-bold tracking-tight">
            <Link href="/p" onClick={() => setMobileOpen(false)}>Catalog</Link>
            <Link href="/p?category=stem-kits" onClick={() => setMobileOpen(false)}>STEM Kits</Link>
            <Link href="/p?sort=newest" onClick={() => setMobileOpen(false)}>New Arrivals</Link>
            <Link href="/support" onClick={() => setMobileOpen(false)}>Support</Link>
          </nav>

          <form onSubmit={submitSearch} className="mt-12">
            <div className="flex items-center rounded-full bg-white/5 border border-white/10 p-2 pl-2">
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => { setMobileOpen(false); router.push('/p?filter=open'); }}
                className="flex h-12 w-12 items-center justify-center rounded-full text-white active:scale-90"
              >
                <SlidersHorizontal size={20} />
              </button>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Nexzen..."
                className="flex-1 bg-transparent py-2 pl-4 text-lg text-white placeholder:text-white/20 outline-none"
              />
              <button 
                type="submit"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black"
              >
                <ChevronRight size={24} strokeWidth={3} />
              </button>
            </div>
          </form>
        </div>
      )}
    </header>
  )
}
