'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/auth/supabase-browser'

async function syncSession(session) {
  if (!session?.access_token) {
    return
  }

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
}

import { Suspense } from 'react'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState('Completing your login...')
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let mounted = true

    async function finishLogin() {
      const supabase = createSupabaseBrowserClient()
      const code = searchParams.get('code')
      const next = searchParams.get('next') || '/'
      const errorCode = searchParams.get('error_code')
      const errorDescription = searchParams.get('error_description')
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const hashErrorCode = hashParams.get('error_code')
      const hashErrorDescription = hashParams.get('error_description')

      try {
        if (errorCode || errorDescription || hashErrorCode || hashErrorDescription) {
          throw new Error(
            decodeURIComponent(
              errorDescription ||
                hashErrorDescription ||
                errorCode ||
                hashErrorCode ||
                'Could not complete your login.'
            )
          )
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)

          if (error) {
            throw error
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          throw new Error('No login session was returned. Check your Supabase provider settings.')
        }

        await syncSession(session)

        const metadata = session.user?.user_metadata || {}
        const provider = `${session.user?.app_metadata?.provider || ''}`.toLowerCase()
        const hasProfileName = Boolean(
          `${metadata.full_name || metadata.name || metadata.user_name || ''}`.trim()
        )

        if (mounted) {
          // Fix URL hash lingering after client-side route replacement
          if (typeof window !== 'undefined' && window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search)
          }

          if ((provider === 'google' || provider === 'github' || provider === 'facebook' || provider === 'linkedin_oidc') && !hasProfileName) {
            router.replace(`/complete-profile?next=${encodeURIComponent(next)}`)
            return
          }

          router.replace(next)
        }
      } catch (error) {
        if (mounted) {
          setHasError(true)
          setMessage(error instanceof Error ? error.message : 'Could not complete your login.')
        }
      }
    }

    finishLogin()

    return () => {
      mounted = false
    }
  }, [router, searchParams])

  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Auth Callback</p>
        <h1 className="mt-4 font-heading text-3xl font-semibold text-slate-950">Finishing your sign-in</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">{message}</p>
        {hasError && (
          <div className="mt-6">
            <Link
              href="/login"
              className="interactive-button inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Back to login
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-slate-50 min-h-screen">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
           <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Auth Callback</p>
           <h1 className="mt-4 font-heading text-3xl font-semibold text-slate-950 border-none bg-transparent">Finishing your sign-in</h1>
           <p className="mt-4 text-sm leading-6 text-slate-600">Loading...</p>
        </div>
      </section>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
