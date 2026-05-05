'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { createSupabaseBrowserClient } from '@/lib/auth/supabase-browser'

function getVerificationConfig(type) {
  if (type === 'recovery') {
    return {
      heading: 'Verify your reset code',
      description: 'Enter the code sent to your email to continue with password reset. If your Supabase email template uses a recovery link instead of a code, opening that link will bring you back into this flow automatically.',
      verifyType: 'recovery',
      successPath: '/update-password',
      resendLabel: 'Resend reset code',
      resendAction: 'recovery',
      successMessage: 'Code verified. You can set a new password now.',
    }
  }

  return {
    heading: 'Verify your email',
    description: 'Enter the code sent to your email to confirm your Nexzen account.',
    verifyType: 'email',
    successPath: '/set-password',
    resendLabel: 'Resend verification code',
    resendAction: 'signup',
    successMessage: 'Email verified. Set your password next.',
  }
}

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

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const flowType = searchParams.get('type') === 'recovery' ? 'recovery' : 'signup'
  const config = useMemo(() => getVerificationConfig(flowType), [flowType])
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')

  useEffect(() => {
    const memory = typeof window !== 'undefined' ? sessionStorage.getItem('verifyEmail') : null
    setEmail(searchParams.get('email') || memory || '')
  }, [searchParams])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isVerifying, startVerifyTransition] = useTransition()
  const [isResending, startResendTransition] = useTransition()

  function handleVerify(event) {
    event.preventDefault()
    const otp = token.trim()

    if (!email || !otp) {
      setError('Enter both your email and the verification code.')
      setMessage('')
      return
    }

    if (otp.length < 6 || otp.length > 8) {
      setError('Please enter a valid verification code (6-8 characters).')
      setMessage('')
      return
    }

    startVerifyTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: config.verifyType,
        })

        if (verifyError) {
          throw verifyError
        }

        if (data?.session) {
          await syncSession(data.session)
        }

        setMessage(config.successMessage)
        setError('')
        router.replace(
          flowType === 'recovery'
            ? '/update-password'
            : `/set-password?next=${encodeURIComponent('/complete-profile?mode=signup&next=/')}`
        )
      } catch (verifyError) {
        setError(verifyError instanceof Error ? verifyError.message : 'Could not verify your code.')
        setMessage('')
      }
    })
  }

  function handleResend() {
    if (!email) {
      setError('Missing email address for verification.')
      setMessage('')
      return
    }

    startResendTransition(async () => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: flowType === 'recovery' ? 'reset-resend' : 'signup-resend',
            email,
          }),
        })

        const result = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(result.error || 'Could not resend the code.')
        }

        setMessage(`A new code has been sent to ${email}.`)
        setError('')
      } catch (resendError) {
        setError(resendError instanceof Error ? resendError.message : 'Could not resend the code.')
        setMessage('')
      }
    })
  }

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top,#2155ff_0%,#0f172a_58%,#020617_100%)] p-8 text-white shadow-[0_20px_70px_rgba(15,23,42,0.2)] sm:p-10">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Email Verification</p>
          <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight sm:text-5xl">{config.heading}</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-200">{config.description}</p>
          <div className="mt-8 rounded-[1.5rem] border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-white/70">Email</p>
            <p className="mt-3 text-lg font-semibold">{email || 'Enter the email used during signup'}</p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-10">
          <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Verification Code</p>
          <h2 className="mt-3 font-heading text-4xl font-semibold text-slate-950">Enter your OTP</h2>

          <form className="mt-8 space-y-5" onSubmit={handleVerify}>
            <label className="grid gap-2 text-sm text-slate-700">
              Email
              <input
                suppressHydrationWarning
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                placeholder="Enter your email address"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
              />
            </label>

            <label className="grid gap-2 text-sm text-slate-700">
              One-time code
              <input
                suppressHydrationWarning
                value={token}
                onChange={(event) => setToken(event.target.value.replace(/\s+/g, '').slice(0, 8))}
                placeholder="Enter verification code"
                maxLength={10}
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
                suppressHydrationWarning
                type="submit"
                disabled={isVerifying || isResending}
                className="interactive-button inline-flex rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 hover:shadow-[0_16px_36px_rgba(37,99,235,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isVerifying ? 'Verifying...' : 'Verify code'}
              </button>
              <button
                suppressHydrationWarning
                type="button"
                disabled={isVerifying || isResending}
                onClick={handleResend}
                className="interactive-button inline-flex rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResending ? 'Resending...' : config.resendLabel}
              </button>
            </div>
          </form>

          <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
            Supabase supports both code-based and link-based email verification. This page is ready for OTP entry. If your recovery emails are still using link mode, the reset link in the inbox will take the user straight to the password update page instead.
          </div>

          <div className="mt-5 text-sm text-slate-500">
            <Link href="/login" className="transition hover:text-slate-950">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
           <p className="mt-4 text-sm leading-6 text-slate-600">Loading...</p>
        </div>
      </section>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
