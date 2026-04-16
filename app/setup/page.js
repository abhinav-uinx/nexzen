'use client'

import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/auth/supabase-browser'
import { useAuth } from '@/providers/AuthProvider'

function getExistingName(user) {
  const metadata = user?.user_metadata || {}

  return `${metadata.full_name || metadata.name || metadata.user_name || ''}`.trim()
}

import { Suspense } from 'react'

function CompleteProfileContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading, refreshUser } = useAuth()
  const [fullName, setFullName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSaving, startSavingTransition] = useTransition()
  const next = searchParams.get('next') || '/'
  const mode = searchParams.get('mode') || 'profile'
  const isSignupCompletion = mode === 'signup'

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
      return
    }

    if (user) {
      const existingName = getExistingName(user)

      if (existingName) {
        router.replace(next)
        return
      }

      setFullName(user.email?.split('@')?.[0] || '')
    }
  }, [loading, next, router, user])

  function handleSubmit(event) {
    event.preventDefault()
    const trimmedName = fullName.trim()

    if (!trimmedName) {
      setError('Please enter your name before continuing.')
      setMessage('')
      return
    }

    startSavingTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            full_name: trimmedName,
            name: trimmedName,
          },
        })

        if (updateError) {
          throw updateError
        }

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.access_token) {
          await fetch('/api/auth/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              provider: session.user?.app_metadata?.provider,
              expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
            }),
          })

          await fetch('/api/auth/welcome', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              name: trimmedName,
            }),
          }).catch(() => null)
        }

        await refreshUser()
        setMessage(
          isSignupCompletion
            ? 'Your Nexzen account is ready.'
            : 'Your profile name has been saved.'
        )
        setError('')
        router.replace(next)
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Could not save your name.')
        setMessage('')
      }
    })
  }

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top,#2155ff_0%,#0f172a_58%,#020617_100%)] p-8 text-white shadow-[0_20px_70px_rgba(15,23,42,0.2)] sm:p-10">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Finish Setup</p>
          <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight sm:text-5xl">
            {isSignupCompletion
              ? 'Add the name you want shown on your new Nexzen account.'
              : 'Add the name you want shown across your Nexzen account.'}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-200">
            {isSignupCompletion
              ? 'This is the final step. Your name will appear in the header, profile dropdown, and account page, and you can edit it later anytime.'
              : 'This only takes a moment. Your name will appear in the header, profile dropdown, and account page, and you can edit it later anytime.'}
          </p>

          <div className="mt-8 rounded-[1.5rem] border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-white/70">Editable later</p>
            <p className="mt-3 text-lg font-semibold">You can change this anytime from your profile page.</p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-10">
          <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Profile Name</p>
          <h2 className="mt-3 font-heading text-4xl font-semibold text-slate-950">Tell us what to call you</h2>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm text-slate-700">
              Full name
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your full name"
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              />
            </label>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="interactive-button inline-flex rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 hover:shadow-[0_16px_36px_rgba(37,99,235,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving
                  ? (isSignupCompletion ? 'Creating account...' : 'Saving...')
                  : (isSignupCompletion ? 'Create account' : 'Save and continue')}
              </button>
              {!isSignupCompletion && (
                <Link
                  href={next}
                  className="interactive-button inline-flex rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-slate-950"
                >
                  Skip for now
                </Link>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
           <p className="mt-4 text-sm leading-6 text-slate-600">Loading...</p>
        </div>
      </section>
    }>
      <CompleteProfileContent />
    </Suspense>
  )
}
