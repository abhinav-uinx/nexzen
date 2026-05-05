'use client'

import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useTransition, Suspense } from 'react'
import { createSupabaseBrowserClient } from '@/lib/auth/supabase-browser'
import { useAuth } from '@/providers/AuthProvider'
import ProductCard from '@/components/storefront/ProductCard'
import Image from 'next/image'
import LoadingPanel from '@/components/ui/LoadingPanel'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

function EmptyState({ title, description, actionHref = '/login', actionLabel = 'Sign in' }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
      <h2 className="font-heading text-2xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
      <Link
        href={actionHref}
        className="interactive-button mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 hover:shadow-[0_16px_36px_rgba(37,99,235,0.24)]"
      >
        {actionLabel}
      </Link>
    </div>
  )
}

function ProfileShellInner({ tools = [], showProfileForm = false, showAccountSummary = true, children }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, session, loading, refreshUser } = useAuth()
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
  const [addressLabel, setAddressLabel] = useState('Home')
  const [wishlist, setWishlist] = useState([])
  const [wishlistLoading, setWishlistLoading] = useState(false)
  
  const [activeTab, setActiveTab] = useState('profile') // 'profile', 'wishlist'
  
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [isSavingProfile, startProfileTransition] = useTransition()
  const [isSendingReset, startResetTransition] = useTransition()
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
  const activeOrdersCount = orders.filter((order) => !['delivered', 'completed', 'cancelled'].includes(`${order.status || ''}`.toLowerCase())).length

  function saveCurrentAddress() {
    if (!profileAddress || !profileCity || !profileState || !profilePincode) {
      setProfileError('Complete the address fields before saving an address card.')
      setProfileMessage('')
      return
    }

    const nextId = `addr-${Date.now()}`
    const nextAddress = {
      id: nextId,
      label: addressLabel || `Address ${savedAddresses.length + 1}`,
      addressLine1: profileAddress,
      addressLine2: profileAddress2,
      city: profileCity,
      state: profileState,
      pincode: profilePincode,
      phone: profilePhone,
      isDefault: savedAddresses.length === 0,
    }

    const deduped = [nextAddress, ...savedAddresses.filter((item) =>
      item.addressLine1 !== nextAddress.addressLine1 ||
      item.city !== nextAddress.city ||
      item.pincode !== nextAddress.pincode
    )].slice(0, 5)

    setSavedAddresses(deduped.map((item, index) => ({ ...item, isDefault: item.isDefault || index === 0 })))
    setProfileMessage('Address saved. It will be available in checkout after you save the profile.')
    setProfileError('')
  }

  function applySavedAddress(address) {
    setProfileAddress(address.addressLine1 || '')
    setProfileAddress2(address.addressLine2 || '')
    setProfileCity(address.city || '')
    setProfileState(address.state || '')
    setProfilePincode(address.pincode || '')
    setProfilePhone(address.phone || profilePhone || '')
    setAddressLabel(address.label || 'Home')
    setIsEditing(true)
  }

  function removeSavedAddress(id) {
    const nextAddresses = savedAddresses.filter((item) => item.id !== id)
    setSavedAddresses(nextAddresses.map((item, index) => ({ ...item, isDefault: item.isDefault || index === 0 })))
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
                       <p className="text-sm font-semibold text-slate-900">{savedAddresses.length} <span className="font-normal text-slate-500">Addresses</span></p>
                    </div>
                  </div>
               </div>
            </div>
            <div className="flex flex-wrap gap-3">
               {tools.map(tool => (
                 <Link 
                   key={tool.href} 
                   href={tool.href} 
                   className="interactive-button text-xs font-bold uppercase tracking-widest text-slate-500 border border-slate-200 rounded-full px-5 py-2.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all duration-300 shadow-sm"
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
                <p className="text-sm uppercase tracking-[0.24em] text-blue-700">{isEditing ? 'Editing Profile' : 'Profile'}</p>
                <h2 className="mt-3 font-heading text-3xl font-semibold text-slate-950">
                  {isEditing ? 'Update your account details' : 'Your account details'}
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {activeTab === 'profile' && !isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="interactive-button inline-flex rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 shadow-md"
                  >
                    Edit Profile Information
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className={`interactive-button inline-flex rounded-full border px-5 py-3 text-sm font-semibold transition-all ${activeTab === 'profile' ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  View Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('wishlist')}
                  className={`interactive-button inline-flex rounded-full border px-5 py-3 text-sm font-semibold transition-all ${activeTab === 'wishlist' ? 'border-rose-200 bg-rose-50 text-rose-700 shadow-sm' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  Wishlist ({wishlist.length})
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/active-orders')}
                  className="interactive-button inline-flex rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50"
                >
                  Active orders
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/ordered-items')}
                  className="interactive-button inline-flex rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-slate-950"
                >
                  Ordered items
                </button>
              </div>
            </div>

            {activeTab === 'profile' ? (
              <div className="space-y-12">
                <form onSubmit={handleProfileSave} className="mt-8 grid gap-10">
                  <div className="grid gap-8">
                    {/* Primary Identity */}
                    <div className="grid gap-6 sm:grid-cols-2">
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
                          <p className="px-4 py-3 bg-slate-50 rounded-2xl text-slate-900 border border-slate-100 font-semibold">{profileName || '(Not set)'}</p>
                        )}
                      </div>
                      <div className="grid gap-2 text-sm font-medium text-slate-700">
                        <label>Email address</label>
                        <p className="px-4 py-3 bg-slate-50 rounded-2xl text-slate-500 border border-slate-100 italic">{user.email}</p>
                      </div>
                    </div>

                    {/* Contact & Payment */}
                    <div className="grid gap-6 sm:grid-cols-2">
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
                          <p className="px-4 py-3 bg-slate-50 rounded-2xl text-slate-900 border border-slate-100 font-semibold">{profilePhone || '(Not set)'}</p>
                        )}
                      </div>
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
                          <p className="px-4 py-3 bg-slate-50 rounded-2xl text-slate-900 border border-slate-100 font-semibold">{profileUpi || '(Not set)'}</p>
                        )}
                      </div>
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
                              className="interactive-button inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50"
                            >
                              Save address
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="px-4 py-4 bg-slate-50 rounded-2xl text-slate-900 border border-slate-100 font-semibold space-y-1">
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
                        <p className="px-4 py-3 bg-slate-50 rounded-2xl text-slate-900 border border-slate-100 font-semibold">{profileCity || '(Not set)'}</p>
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
                        <p className="px-4 py-3 bg-slate-50 rounded-2xl text-slate-900 border border-slate-100 font-semibold">{profileState || '(Not set)'}</p>
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
                        <p className="px-4 py-3 bg-slate-50 rounded-2xl text-slate-900 border border-slate-100 font-semibold">{profilePincode || '(Not set)'}</p>
                      )}
                    </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Saved addresses</h3>
                      <p className="text-xs text-slate-400">Up to 5 addresses for faster checkout</p>
                    </div>
                    {savedAddresses.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                        Save a few addresses here and they will show up in checkout as quick-select cards.
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {savedAddresses.map((address) => (
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
                                <button
                                  type="button"
                                  onClick={() => applySavedAddress(address)}
                                  className="interactive-button inline-flex rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50"
                                >
                                  Use in form
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeSavedAddress(address.id)}
                                  className="interactive-button inline-flex rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-rose-600 hover:border-rose-200 hover:bg-rose-50"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="submit"
                        disabled={isSavingProfile || isSendingReset}
                        className="interactive-button inline-flex min-w-[11.5rem] items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 hover:shadow-[0_16px_36px_rgba(37,99,235,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSavingProfile ? <LoadingSpinner size="sm" tone="light" label="Saving profile..." /> : 'Save Account & Profile'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="interactive-button inline-flex rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {profileMessage && <p className="text-sm text-emerald-600">{profileMessage}</p>}
                  {profileError && <p className="text-sm text-rose-600">{profileError}</p>}
                </form>

                <div className="border-t border-slate-100 pt-8">
                  <h3 className="text-lg font-semibold text-slate-950 mb-4">Account Security</h3>
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
                    className="interactive-button inline-flex min-w-[11.5rem] items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSendingReset ? <LoadingSpinner size="sm" tone="dark" label="Sending OTP..." /> : 'Reset password'}
                  </button>
                </div>
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
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {wishlist.map((item) => (
                      <ProductCard 
                        key={item.id} 
                        product={item.product} 
                        initiallyWishlisted={true} 
                      />
                    ))}
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
