'use client'

import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useTransition, Suspense } from 'react'
import { createSupabaseBrowserClient } from '@/lib/auth/supabase-browser'
import { useAuth } from '@/providers/AuthProvider'
import { useCart } from '@/providers/CartProvider'
import ProductCard from '@/components/storefront/ProductCard'
import StockAlertButton from '@/components/storefront/StockAlertButton'
import Image from 'next/image'
import LoadingPanel from '@/components/ui/LoadingPanel'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { getVisibleSavedAddresses } from '@/lib/profile/addresses'

const ORDER_TIMELINE = ['pending', 'processing', 'shipped', 'delivered']

function getTimelineState(order) {
  const normalized = `${order?.status || ''}`.toLowerCase()

  if (normalized === 'cancelled') {
    return ['pending']
  }

  if (normalized === 'return_requested') {
    return ORDER_TIMELINE
  }

  const currentIndex = ORDER_TIMELINE.indexOf(normalized)
  if (currentIndex === -1) {
    return ['pending', 'processing']
  }

  return ORDER_TIMELINE.slice(0, currentIndex + 1)
}

function EmptyState({ title, description, actionHref = '/login', actionLabel = 'Sign in' }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
      <h2 className="font-heading text-2xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
      <Link
        href={actionHref}
        className="interactive-button mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
      >
        {actionLabel}
      </Link>
    </div>
  )
}

const SEARCH_STORAGE_KEY = 'nexzen:search-state'

function ProfileShellInner({
  tools = [],
  showProfileForm = false,
  showAccountSummary = true,
  initialAddressBookOpen = false,
  autoStartNewAddress = false,
  addressOnlyMode = false,
  children
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, session, loading, refreshUser } = useAuth()
  const { addToCart } = useCart()
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState('')
  const [profileName, setProfileName] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [profileAddress, setProfileAddress] = useState('')
  const [profileAddress2, setProfileAddress2] = useState('')
  const [profileCity, setProfileCity] = useState('')
  const [profileState, setProfileState] = useState('')
  const [profilePincode, setProfilePincode] = useState('')
  const [profileUpi, setProfileUpi] = useState('')
  const [savedAddresses, setSavedAddresses] = useState([])
  const [editingAddressId, setEditingAddressId] = useState(null)
  const [addressLabel, setAddressLabel] = useState('Home')
  const [addressBookOpen, setAddressBookOpen] = useState(initialAddressBookOpen)
  const [bootstrappedNewAddress, setBootstrappedNewAddress] = useState(false)
  const [wishlist, setWishlist] = useState([])
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [wishlistMessage, setWishlistMessage] = useState('')
  const [securitySnapshot, setSecuritySnapshot] = useState(null)
  const [securityLoading, setSecurityLoading] = useState(false)
  const [securityError, setSecurityError] = useState('')
  const [recentSearches, setRecentSearches] = useState([])
  const [recentSearchesLoading, setRecentSearchesLoading] = useState(false)
  const [trendingSearches, setTrendingSearches] = useState([])
  const [passwordDraft, setPasswordDraft] = useState({ next: '', confirm: '' })
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  
  const [activeTab, setActiveTab] = useState('profile') // 'profile', 'wishlist'
  
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [isSavingProfile, startProfileTransition] = useTransition()
  const [isSendingReset, startResetTransition] = useTransition()
  const [isUpdatingPassword, startPasswordTransition] = useTransition()
  const [isRevokingSessions, startRevokeSessionsTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)

  const hasNameInitially = !!(user?.user_metadata?.full_name || user?.user_metadata?.name)
  const tabParam = searchParams.get('tab')

  // Support direct linking to tabs (e.g. ?tab=wishlist)
  useEffect(() => {
    if (tabParam === 'wishlist') {
      setActiveTab('wishlist')
    } else if (tabParam === 'profile') {
      setActiveTab('profile')
    }
  }, [tabParam])

  useEffect(() => {
    if (user) {
      setProfileName(user.user_metadata?.full_name || user.user_metadata?.name || '')
      
      // Fetch Prisma-resident profile data
      async function fetchPrismaProfile() {
        try {
          const response = await fetch('/api/profile', {
            headers: { Authorization: `Bearer ${session?.access_token}` }
          })
          const { profile } = await response.json()
          if (profile) {
            setProfilePhone(profile.phone || '')
            setProfileAddress(profile.addressLine1 || '')
            setProfileAddress2(profile.addressLine2 || '')
            setProfileCity(profile.city || '')
            setProfileState(profile.state || '')
            setProfilePincode(profile.pincode || '')
            setSavedAddresses(Array.isArray(profile.savedAddresses) ? profile.savedAddresses : [])
            setProfileUpi(profile.savedUpiId || '')
            if (profile.name) setProfileName(profile.name)
          }
        } catch {
          console.warn('Could not load extended profile details')
        }
      }
      
      if (session?.access_token) fetchPrismaProfile()
    }
  }, [user, session?.access_token])

  useEffect(() => {
    if (!autoStartNewAddress || bootstrappedNewAddress) {
      return
    }

    setAddressBookOpen(true)
    setEditingAddressId(null)
    setAddressLabel(`Address ${getVisibleSavedAddresses(savedAddresses).length + 1}`)
    setProfileAddress('')
    setProfileAddress2('')
    setProfileCity('')
    setProfileState('')
    setProfilePincode('')
    setIsEditing(true)
    setBootstrappedNewAddress(true)
  }, [autoStartNewAddress, bootstrappedNewAddress, savedAddresses])

  useEffect(() => {
    let cancelled = false

    async function loadOrders() {
      if (!session?.access_token) {
        if (!cancelled) {
          setOrders([])
          setOrdersLoading(false)
          setOrdersError('')
        }
        return
      }

      try {
        if (!cancelled) {
          setOrdersLoading(true)
          setOrdersError('')
        }

        const response = await fetch('/api/orders', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })

        const result = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(result.error || 'Could not load your orders.')
        }

        if (!cancelled) {
          setOrders(Array.isArray(result.orders) ? result.orders : [])
        }
      } catch (error) {
        if (!cancelled) {
          setOrdersError(error instanceof Error ? error.message : 'Could not load your orders.')
        }
      } finally {
        if (!cancelled) {
          setOrdersLoading(false)
        }
      }
    }

    if (!loading) {
      loadOrders()
    }

    return () => {
      cancelled = true
    }
  }, [loading, session?.access_token])

  useEffect(() => {
    let cancelled = false
    async function loadWishlist() {
      if (!session?.access_token) return
      try {
        setWishlistLoading(true)
        const res = await fetch('/api/wishlist', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        const data = await res.json()
        if (!cancelled && data.ok) {
          setWishlist(data.wishlist)
        }
      } catch {
        console.error('Wishlist load failed')
      } finally {
        if (!cancelled) setWishlistLoading(false)
      }
    }

    if (!loading) loadWishlist()
    return () => { cancelled = true }
  }, [loading, session?.access_token])

  useEffect(() => {
    let cancelled = false

    async function loadSecuritySnapshot() {
      if (!session?.access_token) {
        if (!cancelled) {
          setSecuritySnapshot(null)
          setSecurityLoading(false)
        }
        return
      }

      try {
        if (!cancelled) {
          setSecurityLoading(true)
          setSecurityError('')
        }

        const response = await fetch('/api/profile/security', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })
        const result = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(result.error || 'Could not load your session activity.')
        }

        if (!cancelled) {
          setSecuritySnapshot(result.security || null)
        }
      } catch (error) {
        if (!cancelled) {
          setSecurityError(error instanceof Error ? error.message : 'Could not load your session activity.')
        }
      } finally {
        if (!cancelled) {
          setSecurityLoading(false)
        }
      }
    }

    if (!loading) {
      loadSecuritySnapshot()
    }

    return () => {
      cancelled = true
    }
  }, [loading, session?.access_token])

  useEffect(() => {
    let cancelled = false

    async function loadSearches() {
      if (!session?.access_token) {
        if (!cancelled) {
          setRecentSearches([])
          setTrendingSearches([])
          setRecentSearchesLoading(false)
        }
        return
      }

      try {
        if (!cancelled) {
          setRecentSearchesLoading(true)
        }

        const [recentResponse, trendingResponse] = await Promise.all([
          fetch('/api/search/history?limit=5', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
          fetch('/api/search/history?scope=trending&limit=5'),
        ])

        const recentResult = await recentResponse.json().catch(() => ({ searches: [] }))
        const trendingResult = await trendingResponse.json().catch(() => ({ searches: [] }))

        if (!cancelled) {
          setRecentSearches(Array.isArray(recentResult.searches) ? recentResult.searches : [])
          setTrendingSearches(Array.isArray(trendingResult.searches) ? trendingResult.searches : [])
        }
      } catch {
        if (!cancelled) {
          setRecentSearches([])
          setTrendingSearches([])
        }
      } finally {
        if (!cancelled) {
          setRecentSearchesLoading(false)
        }
      }
    }

    if (!loading) {
      loadSearches()
    }

    return () => {
      cancelled = true
    }
  }, [loading, session?.access_token])

  function handleProfileSave(event) {
    event.preventDefault()
    const nextName = profileName.trim()

    if (!nextName) {
      setProfileError('Enter your full name before saving.')
      setProfileMessage('')
      return
    }

    if (!hasNameInitially) {
      const confirmed = window.confirm("Warning: Your name cannot be changed once you save it. Are you sure you want to proceed?")
      if (!confirmed) return
    }

    startProfileTransition(async () => {
      try {
        setProfileError('')
        setProfileMessage('')
        
        // 1. Update Supabase Metadata (Name)
        const supabase = createSupabaseBrowserClient()
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            full_name: nextName,
            name: nextName,
          },
        })

        if (authError) throw authError

        // 2. Update Prisma Extended Profile (Phone, Address, UPI)
        const profileRes = await fetch('/api/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            phone: profilePhone,
            addressLine1: profileAddress,
            addressLine2: profileAddress2,
            city: profileCity,
            state: profileState,
            pincode: profilePincode,
            savedAddresses,
            savedUpiId: profileUpi,
          })
        })

        if (!profileRes.ok) throw new Error('Prisma profile update failed')

        await refreshUser()
        setIsEditing(false) // Exit edit mode on success
        setProfileMessage('Your account and shipping profile have been updated.')
        setProfileError('')
      } catch (error) {
        setProfileError(error instanceof Error ? error.message : 'Could not update your profile.')
        setProfileMessage('')
      }
    })
  }

  if (loading) {
    return (
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <LoadingPanel
            eyebrow="Account"
            title="Loading your profile"
            description="We are pulling in your profile details, saved addresses, orders, and wishlist."
          />
        </div>
      </section>
    )
  }

  if (!user) {
    return (
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <EmptyState
            title="Sign in to view your account"
            description="Your profile, active orders, and delivered items are only available after you sign in."
          />
        </div>
      </section>
    )
  }

  const renderChildren = typeof children === 'function' ? children : null
  const visibleSavedAddresses = getVisibleSavedAddresses(savedAddresses)
  const activeOrdersCount = orders.filter((order) => !['delivered', 'completed', 'cancelled'].includes(`${order.status || ''}`.toLowerCase())).length
  const deliveredOrdersCount = orders.filter((order) => ['delivered', 'completed'].includes(`${order.status || ''}`.toLowerCase()) || order.deliveredAt).length
  const recentOrders = orders.slice(0, 2)

  function saveCurrentAddress() {
    if (!profileAddress || !profileCity || !profileState || !profilePincode) {
      setProfileError('Complete the address fields before saving an address card.')
      setProfileMessage('')
      return
    }

    if (!editingAddressId && visibleSavedAddresses.length >= 5) {
      setProfileError('You can save up to 5 addresses.')
      setProfileMessage('')
      return
    }

    const nextId = `addr-${Date.now()}`
    const nextAddress = {
      id: nextId,
      label: addressLabel || `Address ${visibleSavedAddresses.length + 1}`,
      addressLine1: profileAddress,
      addressLine2: profileAddress2,
      city: profileCity,
      state: profileState,
      pincode: profilePincode,
      phone: profilePhone,
      isDefault: visibleSavedAddresses.length === 0,
      hidden: false,
    }

    const deduped = [nextAddress, ...savedAddresses.filter((item) =>
      item.addressLine1 !== nextAddress.addressLine1 ||
      item.city !== nextAddress.city ||
      item.pincode !== nextAddress.pincode
    )]

    setSavedAddresses(deduped.map((item, index) => ({ ...item, isDefault: item.hidden ? false : item.isDefault || index === 0 })))
    setEditingAddressId(null)
    setProfileMessage('Address saved. It will be available in checkout after you save the profile.')
    setProfileError('')

    if (pathname === '/u/addresses') {
      router.push('/u')
    }
  }

  function startNewAddress() {
    if (visibleSavedAddresses.length >= 5) {
      setProfileError('You can save up to 5 addresses.')
      setProfileMessage('')
      return
    }

    setEditingAddressId(null)
    setAddressLabel(`Address ${visibleSavedAddresses.length + 1}`)
    setProfileAddress('')
    setProfileAddress2('')
    setProfileCity('')
    setProfileState('')
    setProfilePincode('')
    setIsEditing(true)
    setAddressBookOpen(true)
    setProfileMessage('')
    setProfileError('')
  }

  function setDefaultSavedAddress(id) {
    setSavedAddresses((current) => {
      const nextAddresses = current.map((item) => ({
        ...item,
        isDefault: !item.hidden && item.id === id,
      }))

      return nextAddresses
    })
    setProfileMessage('Default address updated. Save the profile to sync it everywhere.')
    setProfileError('')
  }

  function removeSavedAddress(id) {
    const nextAddresses = savedAddresses.map((item) =>
      item.id === id
        ? {
            ...item,
            hidden: true,
            isDefault: false,
          }
        : item
    )
    const nextVisible = nextAddresses.filter((item) => !item.hidden)
    const hasVisibleDefault = nextVisible.some((item) => item.isDefault)
    const normalized = nextAddresses.map((item) => {
      if (item.hidden) {
        return item
      }

      if (hasVisibleDefault) {
        return item
      }

      const visibleIndex = nextVisible.findIndex((candidate) => candidate.id === item.id)
      return {
        ...item,
        isDefault: visibleIndex === 0,
      }
    })

    if (editingAddressId === id) {
      setEditingAddressId(null)
    }

    setSavedAddresses(normalized)
    setProfileMessage('Address hidden from your account view.')
    setProfileError('')
  }

  async function clearRecentSearchHistory() {
    if (!session?.access_token) {
      return
    }

    try {
      await fetch('/api/search/history', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      setRecentSearches([])
    } catch {}
  }

  async function removeOtherSessions() {
    if (!session?.access_token) {
      return
    }

    startRevokeSessionsTransition(async () => {
      try {
        setSecurityError('')
        const response = await fetch('/api/profile/security', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ scope: 'others' }),
        })
        const result = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(result.error || 'Could not sign out other devices.')
        }

        setSecuritySnapshot((current) =>
          current
            ? {
                ...current,
                sessions: (current.sessions || []).filter((item) => item.isCurrent),
              }
            : current
        )
        setProfileMessage(`Signed out ${result.revokedCount || 0} other session(s).`)
      } catch (error) {
        setSecurityError(error instanceof Error ? error.message : 'Could not sign out other devices.')
      }
    })
  }

  function moveWishlistItemToCart(product) {
    addToCart(product)
    setWishlistMessage(`${product.name} added to your cart.`)
  }

  function openSavedSearch(query) {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(
        SEARCH_STORAGE_KEY,
        JSON.stringify({
          query,
          availability: '',
          minPrice: 0,
          maxPrice: 25000,
        })
      )
    }

    router.push('/search')
  }

  function buyAgain(order) {
    const validProducts = (order.items || [])
      .map((item) => item.product)
      .filter(Boolean)

    validProducts.forEach((product) => addToCart(product))
    setProfileMessage(`${validProducts.length} item(s) added back to your cart.`)
  }

  function submitInProfilePasswordChange(event) {
    event.preventDefault()

    if (!passwordDraft.next || passwordDraft.next.length < 8) {
      setPasswordError('Use at least 8 characters for the new password.')
      setPasswordMessage('')
      return
    }

    if (passwordDraft.next !== passwordDraft.confirm) {
      setPasswordError('Password confirmation does not match.')
      setPasswordMessage('')
      return
    }

    startPasswordTransition(async () => {
      try {
        setPasswordError('')
        setPasswordMessage('')
        const supabase = createSupabaseBrowserClient()
        const { error } = await supabase.auth.updateUser({
          password: passwordDraft.next,
        })

        if (error) {
          throw error
        }

        setPasswordDraft({ next: '', confirm: '' })
        setPasswordMessage('Your password has been updated for this account.')
      } catch (error) {
        setPasswordError(error instanceof Error ? error.message : 'Could not update your password.')
      }
    })
  }

  function openAddressPage() {
    if (pathname === '/u/addresses') {
      startNewAddress()
      return
    }

    router.push('/u/addresses')
  }

  function handleEditCancel() {
    setIsEditing(false)

    if (pathname === '/u/addresses') {
      router.push('/u')
    }
  }

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {showAccountSummary && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
               <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-slate-50 shadow-sm">
                  <Image src={user.user_metadata?.avatar_url || '/nexzen-logo.png'} fill alt="Profile" className="object-cover" />
               </div>
               <div>
                  <h1 className="font-heading text-3xl font-bold text-slate-950">
                    Welcome, {user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]}.
                  </h1>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-1">
                      <p className="text-slate-500">{user.email}</p>
                    <div className="flex gap-4 border-l border-slate-200 pl-6">
                       <p className="text-sm font-semibold text-slate-900">{orders.length} <span className="font-normal text-slate-500">Orders</span></p>
                       <p className="text-sm font-semibold text-slate-900">{activeOrdersCount} <span className="font-normal text-slate-500">Active</span></p>
                       <p className="text-sm font-semibold text-slate-900">{visibleSavedAddresses.length} <span className="font-normal text-slate-500">Addresses</span></p>
                    </div>
                  </div>
               </div>
            </div>
            <div className="flex flex-wrap gap-3">
               {tools.map(tool => (
                 <Link 
                   key={tool.href} 
                   href={tool.href} 
                   className="interactive-button rounded-full border border-slate-200 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-500 shadow-sm"
                 >
                    {tool.label}
                 </Link>
               ))}
            </div>
          </div>
        )}

        {showProfileForm && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-blue-700">
                  {addressOnlyMode ? 'Address Book' : isEditing ? 'Editing Profile' : 'Profile'}
                </p>
                <h2 className="mt-3 font-heading text-3xl font-semibold text-slate-950">
                  {addressOnlyMode ? 'Add a new address' : isEditing ? 'Update your account details' : 'Your account details'}
                </h2>
              </div>
              {!addressOnlyMode ? <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab('wishlist')}
                  className={`interactive-button inline-flex w-full justify-center rounded-full px-5 py-3 text-sm font-semibold sm:w-auto ${activeTab === 'wishlist' ? 'bg-slate-950 text-white shadow-md' : 'bg-slate-950 text-white'}`}
                >
                  Wishlist ({wishlist.length})
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/active-orders')}
                  className="interactive-button inline-flex w-full justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white sm:w-auto"
                >
                  Active orders ({activeOrdersCount > 99 ? '99+' : activeOrdersCount})
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/ordered-items')}
                  className="interactive-button inline-flex w-full justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white sm:w-auto"
                >
                  Ordered items ({deliveredOrdersCount > 99 ? '99+' : deliveredOrdersCount})
                </button>
              </div> : null}
            </div>

            {activeTab === 'profile' ? (
              <div className="space-y-12">
                <form onSubmit={handleProfileSave} className="mt-8 grid gap-10">
                  {!addressOnlyMode ? <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setAddressBookOpen((current) => !current)}
                        className="flex flex-1 items-center justify-between text-left"
                      >
                        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Saved addresses</h3>
                        <div className="flex items-center gap-3">
                          <p className="text-xs text-slate-400">{visibleSavedAddresses.length}/5 saved</p>
                          <span className="text-lg font-semibold text-slate-500">{addressBookOpen ? '−' : '+'}</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={openAddressPage}
                        className="interactive-button inline-flex rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white"
                      >
                        Add address
                      </button>
                    </div>
                    {visibleSavedAddresses.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                        Save a few addresses here and they will show up in checkout as quick-select cards.
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {visibleSavedAddresses.map((address) => (
                          <div key={address.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-slate-950">{address.label}</p>
                                  {address.isDefault && (
                                    <span className="rounded-full bg-slate-950 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                  {[address.addressLine1, address.addressLine2, address.city, address.state, address.pincode]
                                    .filter(Boolean)
                                    .join(', ')}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {!address.isDefault && (
                                  <button
                                    type="button"
                                    onClick={() => setDefaultSavedAddress(address.id)}
                                    className="interactive-button inline-flex rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white"
                                  >
                                    Set default
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeSavedAddress(address.id)}
                                  className="interactive-button inline-flex rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div> : null}

                  {addressBookOpen ? (
                    <div className="grid gap-8 rounded-[1.75rem] border border-slate-200 bg-slate-50/60 p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-950">
                          {addressOnlyMode ? 'Address details' : 'Address details and profile contact'}
                        </p>
                        {!addressOnlyMode ? (
                          <button
                            type="button"
                            onClick={openAddressPage}
                            className="interactive-button inline-flex rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white"
                          >
                            Add another address
                          </button>
                        ) : null}
                      </div>

                      {!addressOnlyMode ? <div className="grid gap-6 sm:grid-cols-2">
                        <div className="grid gap-2 text-sm font-medium text-slate-700">
                          <label htmlFor="fullName">Full name</label>
                          {isEditing ? (
                            <>
                              <input
                                id="fullName"
                                value={profileName}
                                onChange={(event) => setProfileName(event.target.value)}
                                disabled={hasNameInitially}
                                placeholder="Your full name"
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
                              />
                              {hasNameInitially && (
                                <p className="text-xs text-slate-500">Name cannot be changed once set.</p>
                              )}
                            </>
                          ) : (
                            <p className="rounded-2xl border border-slate-100 bg-white px-4 py-3 font-semibold text-slate-900">{profileName || '(Not set)'}</p>
                          )}
                        </div>
                        <div className="grid gap-2 text-sm font-medium text-slate-700">
                          <label>Email address</label>
                          <p className="rounded-2xl border border-slate-100 bg-white px-4 py-3 italic text-slate-500">{user.email}</p>
                        </div>
                      </div> : null}

                      <div className={`grid gap-6 ${addressOnlyMode ? 'sm:grid-cols-1' : 'sm:grid-cols-2'}`}>
                        <div className="grid gap-2 text-sm font-medium text-slate-700">
                          <label htmlFor="phone">Phone Number</label>
                          {isEditing ? (
                            <input
                              id="phone"
                              value={profilePhone}
                              onChange={(e) => setProfilePhone(e.target.value)}
                              placeholder="+91 00000 00000"
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          ) : (
                            <p className="rounded-2xl border border-slate-100 bg-white px-4 py-3 font-semibold text-slate-900">{profilePhone || '(Not set)'}</p>
                          )}
                        </div>
                        {!addressOnlyMode ? (
                          <div className="grid gap-2 text-sm font-medium text-slate-700">
                            <label htmlFor="upi">Saved UPI ID (Default)</label>
                            {isEditing ? (
                              <input
                                id="upi"
                                value={profileUpi}
                                onChange={(e) => setProfileUpi(e.target.value)}
                                placeholder="user@upi"
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              />
                            ) : (
                              <p className="rounded-2xl border border-slate-100 bg-white px-4 py-3 font-semibold text-slate-900">{profileUpi || '(Not set)'}</p>
                            )}
                          </div>
                        ) : null}
                      </div>

                      <div className="space-y-4">
                        <div className="grid gap-2 text-sm font-medium text-slate-700">
                          <label htmlFor="address">Shipping Address</label>
                          {isEditing ? (
                            <div className="space-y-4">
                              <input
                                id="address"
                                value={profileAddress}
                                onChange={(e) => setProfileAddress(e.target.value)}
                                placeholder="House No, Building, Street"
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              />
                              <input
                                id="address2"
                                value={profileAddress2}
                                onChange={(e) => setProfileAddress2(e.target.value)}
                                placeholder="Locality, Landmark"
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              />
                              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                                <input
                                  value={addressLabel}
                                  onChange={(e) => setAddressLabel(e.target.value)}
                                  placeholder="Label this address (Home, Office)"
                                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                                <button
                                  type="button"
                                  onClick={saveCurrentAddress}
                                  className="interactive-button inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                                >
                                  {editingAddressId ? 'Update address' : 'Save address'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1 rounded-2xl border border-slate-100 bg-white px-4 py-4 font-semibold text-slate-900">
                              <p>{profileAddress || '(Not set)'}</p>
                              {profileAddress2 && <p>{profileAddress2}</p>}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="grid gap-2 text-sm font-medium text-slate-700">
                          <label htmlFor="city">City</label>
                          {isEditing ? (
                            <input
                              id="city"
                              value={profileCity}
                              onChange={(e) => setProfileCity(e.target.value)}
                              placeholder="City Name"
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          ) : (
                            <p className="rounded-2xl border border-slate-100 bg-white px-4 py-3 font-semibold text-slate-900">{profileCity || '(Not set)'}</p>
                          )}
                        </div>
                        <div className="grid gap-2 text-sm font-medium text-slate-700">
                          <label htmlFor="state">State</label>
                          {isEditing ? (
                            <input
                              id="state"
                              value={profileState}
                              onChange={(e) => setProfileState(e.target.value)}
                              placeholder="State Name"
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          ) : (
                            <p className="rounded-2xl border border-slate-100 bg-white px-4 py-3 font-semibold text-slate-900">{profileState || '(Not set)'}</p>
                          )}
                        </div>
                        <div className="grid gap-2 text-sm font-medium text-slate-700">
                          <label htmlFor="pincode">Pincode</label>
                          {isEditing ? (
                            <input
                              id="pincode"
                              value={profilePincode}
                              onChange={(e) => setProfilePincode(e.target.value)}
                              placeholder="000000"
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          ) : (
                            <p className="rounded-2xl border border-slate-100 bg-white px-4 py-3 font-semibold text-slate-900">{profilePincode || '(Not set)'}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {isEditing && (
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="submit"
                        disabled={isSavingProfile || isSendingReset}
                        className="interactive-button inline-flex min-w-[11.5rem] items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSavingProfile ? <LoadingSpinner size="sm" tone="light" label="Saving profile..." /> : 'Save Account & Profile'}
                      </button>
                      <button
                        type="button"
                        onClick={handleEditCancel}
                        className="interactive-button inline-flex rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {profileMessage && <p className="text-sm text-emerald-600">{profileMessage}</p>}
                  {profileError && <p className="text-sm text-rose-600">{profileError}</p>}
                </form>

                {!addressOnlyMode ? <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Order snapshot</p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-950">Recent order activity</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push('/active-orders')}
                      className="interactive-button inline-flex rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white"
                    >
                      View full timeline
                    </button>
                  </div>

                  {ordersLoading ? (
                    <div className="mt-5 text-sm text-slate-500">Loading recent order activity...</div>
                  ) : recentOrders.length === 0 ? (
                    <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
                      Your first order timeline will appear here once you complete checkout.
                    </div>
                  ) : (
                    <div className="mt-5 grid gap-4">
                      {recentOrders.map((order) => (
                        <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-950">{order.displayId || order.id}</p>
                              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                                {`${order.status || 'processing'}`.replace(/_/g, ' ')}
                              </p>
                            </div>
                            {['delivered', 'completed'].includes(`${order.status || ''}`.toLowerCase()) ? (
                              <button
                                type="button"
                                onClick={() => buyAgain(order)}
                                className="interactive-button inline-flex rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white"
                              >
                                Buy again
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => router.push('/active-orders')}
                                className="interactive-button inline-flex rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
                              >
                                Track order
                              </button>
                            )}
                          </div>
                          <div className="mt-4 grid gap-3 sm:grid-cols-4">
                            {ORDER_TIMELINE.map((step, index) => {
                              const completed = getTimelineState(order).includes(step)
                              return (
                                <div key={`${order.id}-${step}`} className="flex items-center gap-3">
                                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${completed ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-slate-50 text-slate-400'}`}>
                                    {index + 1}
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">{step}</p>
                                    <p className="text-[11px] text-slate-400">{completed ? 'Recorded' : 'Pending'}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div> : null}

                {!addressOnlyMode ? <div className="border-t border-slate-100 pt-8">
                  <h3 className="text-lg font-semibold text-slate-950 mb-4">Account Security</h3>
                  <div className="space-y-6">
                    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">Recent login activity</p>
                            <p className="mt-1 text-xs text-slate-500">We keep the latest devices and session activity visible here.</p>
                          </div>
                          <button
                            type="button"
                            onClick={removeOtherSessions}
                            disabled={isRevokingSessions}
                            className="interactive-button inline-flex rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                          >
                            {isRevokingSessions ? 'Updating...' : 'Logout other devices'}
                          </button>
                        </div>
                        {securityLoading ? (
                          <div className="mt-4 text-sm text-slate-500">Loading session activity...</div>
                        ) : (
                          <div className="mt-4 space-y-3">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Latest sign-in</p>
                              <p className="mt-2 text-sm font-semibold text-slate-950">
                                {securitySnapshot?.lastLoginAt ? new Date(securitySnapshot.lastLoginAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not available yet'}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">Preferred provider: {securitySnapshot?.preferredProvider || 'email'}</p>
                            </div>
                            <div className="space-y-2">
                              {(securitySnapshot?.sessions || []).slice(0, 4).map((item) => (
                                <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-950">{item.deviceLabel}</p>
                                      <p className="mt-1 text-xs text-slate-500">{item.ipAddress || 'IP unavailable'} • {item.provider}</p>
                                    </div>
                                    {item.isCurrent ? (
                                      <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                                        Current
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="mt-3 text-xs text-slate-500">
                                    Last active {item.lastSeenAt ? new Date(item.lastSeenAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'recently'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {securityError ? <p className="mt-3 text-sm text-rose-600">{securityError}</p> : null}
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                        <p className="text-sm font-semibold text-slate-950">Change password</p>
                        <p className="mt-1 text-xs text-slate-500">Update it right here without leaving your account page.</p>
                        <form onSubmit={submitInProfilePasswordChange} className="mt-4 space-y-3">
                          <input
                            type="password"
                            value={passwordDraft.next}
                            onChange={(event) => setPasswordDraft((current) => ({ ...current, next: event.target.value }))}
                            placeholder="New password"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                          <input
                            type="password"
                            value={passwordDraft.confirm}
                            onChange={(event) => setPasswordDraft((current) => ({ ...current, confirm: event.target.value }))}
                            placeholder="Confirm new password"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                          <div className="flex flex-wrap gap-3">
                            <button
                              type="submit"
                              disabled={isUpdatingPassword}
                              className="interactive-button inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                            >
                              {isUpdatingPassword ? 'Updating...' : 'Change password'}
                            </button>
                            <button
                              type="button"
                              disabled={isSavingProfile || isSendingReset}
                              onClick={() => {
                                startResetTransition(async () => {
                                  try {
                                    setProfileError('')
                                    setProfileMessage('')
                                    const supabase = createSupabaseBrowserClient()
                                    const { error } = await supabase.auth.resetPasswordForEmail(user.email || '', {
                                      redirectTo: `${window.location.origin}/update-password`,
                                    })

                                    if (error) {
                                      throw error
                                    }

                                    setProfileMessage('We sent a password reset email to your inbox. Enter the OTP on the next screen if your Supabase template is using code mode.')
                                    sessionStorage.setItem('verifyEmail', user.email || '')
                                    router.push('/verify-email?type=recovery')
                                  } catch (resetError) {
                                    setProfileError(
                                      resetError instanceof Error ? resetError.message : 'Could not start password reset.'
                                    )
                                    setProfileMessage('')
                                  }
                                })
                              }}
                              className="interactive-button inline-flex rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-60"
                            >
                              {isSendingReset ? <LoadingSpinner size="sm" tone="dark" label="Sending OTP..." /> : 'Send reset email'}
                            </button>
                          </div>
                          {passwordMessage ? <p className="text-sm text-emerald-600">{passwordMessage}</p> : null}
                          {passwordError ? <p className="text-sm text-rose-600">{passwordError}</p> : null}
                        </form>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">Search activity</p>
                          <p className="mt-1 text-xs text-slate-500">Recent account searches and the terms other shoppers are looking for.</p>
                        </div>
                        <button
                          type="button"
                          onClick={clearRecentSearchHistory}
                          className="interactive-button inline-flex rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
                        >
                          Clear recent searches
                        </button>
                      </div>
                      {recentSearchesLoading ? (
                        <div className="mt-4 text-sm text-slate-500">Loading searches...</div>
                      ) : (
                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Recent</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {recentSearches.length > 0 ? recentSearches.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => openSavedSearch(item.query)}
                                  className="interactive-button rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200"
                                >
                                  {item.query}
                                </button>
                              )) : <p className="text-sm text-slate-500">No recent searches saved yet.</p>}
                            </div>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Trending</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {trendingSearches.length > 0 ? trendingSearches.map((item) => (
                                <button
                                  key={`trend-${item.id}`}
                                  type="button"
                                  onClick={() => openSavedSearch(item.query)}
                                  className="interactive-button rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200"
                                >
                                  {item.query}
                                </button>
                              )) : <p className="text-sm text-slate-500">Trending search terms will appear here.</p>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div> : null}
              </div>
            ) : (
              <div className="mt-10">
                {wishlistLoading ? (
                  <div className="py-20 text-center text-slate-500">
                    <LoadingSpinner tone="blue" label="Loading your wishlist items..." className="justify-center" />
                  </div>
                ) : wishlist.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-300">
                       <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                       </svg>
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-slate-950">Your wishlist is empty</h3>
                    <p className="mt-2 text-slate-500">Save products to build your dream electronics list.</p>
                    <Link href="/products" className="interactive-button mt-6 inline-flex rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white">
                       Browse Catalog
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {wishlistMessage ? <p className="text-sm text-emerald-600">{wishlistMessage}</p> : null}
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {wishlist.map((item) => {
                        const hasPriceDrop =
                          Number(item.product?.originalPrice || 0) > Number(item.product?.price || 0)

                        return (
                          <div key={item.id} className="space-y-3">
                            <ProductCard 
                              product={item.product} 
                              initiallyWishlisted={true} 
                            />
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                              <div className="flex flex-wrap gap-2">
                                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${item.product?.inStock ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                  {item.product?.inStock ? 'In stock' : 'Out of stock'}
                                </span>
                                {hasPriceDrop ? (
                                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                                    Price drop
                                  </span>
                                ) : null}
                                {!item.product?.inStock ? (
                                  <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
                                    Back-in-stock alert available
                                  </span>
                                ) : null}
                              </div>
                              <div className="mt-4 flex flex-wrap gap-3">
                                <button
                                  type="button"
                                  onClick={() => moveWishlistItemToCart(item.product)}
                                  disabled={!item.product?.inStock}
                                  className="interactive-button inline-flex rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                                >
                                  Move to cart
                                </button>
                              </div>
                            </div>
                            {item.product?.inStock ? null : <StockAlertButton product={item.product} />}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {renderChildren &&
          renderChildren({
            user,
            orders,
            ordersLoading,
            ordersError,
          })}
      </div>
    </section>
  )
}

export default function ProfileShell(props) {
  return (
    <Suspense fallback={null}>
      <ProfileShellInner {...props} />
    </Suspense>
  )
}
