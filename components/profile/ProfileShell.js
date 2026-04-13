'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { createSupabaseBrowserClient } from '@/lib/auth/supabase-browser'
import { useAuth } from '@/providers/AuthProvider'

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

export default function ProfileShell({ tools = [], showProfileForm = false, showAccountSummary = true, children }) {
  const router = useRouter()
  const { user, session, loading, refreshUser } = useAuth()
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState('')
  const [profileName, setProfileName] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [profileAddress, setProfileAddress] = useState('')
  const [profileCity, setProfileCity] = useState('')
  const [profilePincode, setProfilePincode] = useState('')
  const [profileUpi, setProfileUpi] = useState('')
  
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [isSavingProfile, startProfileTransition] = useTransition()
  const [isSendingReset, startResetTransition] = useTransition()

  const hasNameInitially = !!(user?.user_metadata?.full_name || user?.user_metadata?.name)

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
            setProfileCity(profile.city || '')
            setProfilePincode(profile.pincode || '')
            setProfileUpi(profile.savedUpiId || '')
            if (profile.name) setProfileName(profile.name)
          }
        } catch (e) {
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
            city: profileCity,
            pincode: profilePincode,
            savedUpiId: profileUpi,
          })
        })

        if (!profileRes.ok) throw new Error('Prisma profile update failed')

        await refreshUser()
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
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-slate-200 bg-white p-10 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
          <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Account</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold text-slate-950">Loading your profile...</h1>
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

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {showAccountSummary && (
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top,#2155ff_0%,#0f172a_58%,#020617_100%)] p-8 text-white shadow-[0_20px_70px_rgba(15,23,42,0.2)] sm:p-10">
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Your Account</p>
              <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight sm:text-5xl">
                Welcome back, {user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'builder'}.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-200">
                Keep your profile updated, track active shipments, and review delivered orders from one clean account center.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/70">Signed in as</p>
                  <p className="mt-3 text-lg font-semibold">{user.email}</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/70">Order visibility</p>
                  <p className="mt-3 text-lg font-semibold">{orders.length} saved orders in your account</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-10">
              <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Account Tools</p>
              <div className="mt-6 space-y-4">
                {tools.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="interactive-button flex items-center justify-between rounded-[1.5rem] border border-slate-200 px-5 py-4 text-base font-medium text-slate-950 hover:border-blue-200 hover:bg-blue-50/60"
                  >
                    <span>{tool.label}</span>
                    <span aria-hidden="true">-&gt;</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {showProfileForm && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Profile</p>
                <h2 className="mt-3 font-heading text-3xl font-semibold text-slate-950">Update your account details</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/active-orders')}
                  className="interactive-button inline-flex rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-slate-950"
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

            <form onSubmit={handleProfileSave} className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
              <div className="grid gap-5">
                <div className="grid gap-2 text-sm font-medium text-slate-700">
                  <label htmlFor="fullName">Full name</label>
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
                </div>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Email
                  <input
                    value={user.email || ''}
                    disabled
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500 outline-none"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2 text-sm font-medium text-slate-700">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      id="phone"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="+91 00000 00000"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="grid gap-2 text-sm font-medium text-slate-700">
                    <label htmlFor="upi">Saved UPI ID (Default)</label>
                    <input
                      id="upi"
                      value={profileUpi}
                      onChange={(e) => setProfileUpi(e.target.value)}
                      placeholder="user@upi"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="grid gap-2 text-sm font-medium text-slate-700">
                  <label htmlFor="address">Shipping Address</label>
                  <input
                    id="address"
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                    placeholder="House No, Building, Street"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2 text-sm font-medium text-slate-700">
                    <label htmlFor="city">City / District</label>
                    <input
                      id="city"
                      value={profileCity}
                      onChange={(e) => setProfileCity(e.target.value)}
                      placeholder="City Name"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="grid gap-2 text-sm font-medium text-slate-700">
                    <label htmlFor="pincode">Pincode</label>
                    <input
                      id="pincode"
                      value={profilePincode}
                      onChange={(e) => setProfilePincode(e.target.value)}
                      placeholder="000000"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-4">
                  <button
                    type="submit"
                    disabled={isSavingProfile || isSendingReset}
                    className="interactive-button inline-flex min-w-[11.5rem] items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 hover:shadow-[0_16px_36px_rgba(37,99,235,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingProfile ? 'Saving profile...' : 'Save Account & Profile'}
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
                    className="interactive-button inline-flex min-w-[11.5rem] items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSendingReset ? 'Sending OTP...' : 'Reset password'}
                  </button>
                </div>

                {profileMessage && <p className="text-sm text-emerald-600">{profileMessage}</p>}
                {profileError && <p className="text-sm text-rose-600">{profileError}</p>}
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Account snapshot</p>
                <div className="mt-5 space-y-4 text-sm text-slate-600">
                  <div className="rounded-2xl border border-white bg-white px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Saved orders</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{orders.length}</p>
                  </div>
                  <div className="rounded-2xl border border-white bg-white px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Primary email</p>
                    <p className="mt-2 font-medium text-slate-950">{user.email}</p>
                  </div>
                  <div className="rounded-2xl border border-white bg-white px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Preferred provider</p>
                    <p className="mt-2 font-medium capitalize text-slate-950">
                      {user.app_metadata?.provider || 'email'}
                    </p>
                  </div>
                </div>
              </div>
            </form>
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
