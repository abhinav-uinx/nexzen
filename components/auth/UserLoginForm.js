'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/auth/supabase-browser'

const providerButtons = [
  {
    name: 'GitHub',
    provider: 'github',
    label: 'Continue with GitHub',
    symbol: 'GH',
    className: 'bg-slate-950 text-white hover:bg-slate-800',
  },
  {
    name: 'Google',
    provider: 'google',
    label: 'Continue with Google',
    symbol: 'G',
    className: 'bg-white text-slate-950 border border-slate-200 hover:bg-slate-50',
  },
  {
    name: 'Facebook',
    provider: 'facebook',
    label: 'Continue with Facebook',
    symbol: 'f',
    className: 'bg-[#1877f2] text-white hover:bg-[#0f66db]',
  },
  {
    name: 'LinkedIn',
    provider: 'linkedin_oidc',
    label: 'Continue with LinkedIn',
    symbol: 'in',
    className: 'bg-[#0a66c2] text-white hover:bg-[#0856a3]',
  },
]

const authCallbackPath = '/auth/callback'
const authCallbackUrl = 'http://localhost:3000/auth/callback'

function getProviderSetupMessage(providerName) {
  return `${providerName} login is disabled in Supabase right now. Enable the ${providerName} provider in Supabase Authentication > Providers and add ${authCallbackUrl} as an allowed redirect URL.`
}

function PasswordField({
  name,
  value,
  onChange,
  placeholder,
  required = false,
  minLength,
  label,
  visible,
  onToggle,
}) {
  return (
    <label className="grid gap-2 text-sm text-slate-700">
      {label}
      <div className="relative">
        <input
          suppressHydrationWarning
          type={visible ? 'text' : 'password'}
          name={name}
          value={value}
          required={required}
          minLength={minLength}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-20 outline-none transition focus:border-blue-500"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 transition hover:text-slate-950"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </label>
  )
}

async function syncSession(session) {
  if (!session?.access_token) {
    return
  }

  const response = await fetch('/api/auth/sync', {
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

  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(result.error || 'Could not save your login session.')
  }
}

export default function UserLoginForm() {
  const router = useRouter()
  const [mode, setMode] = useState('signin')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const isReset = mode === 'reset'
  const isSignup = mode === 'signup'

  function resetState(nextMode) {
    setMode(nextMode)
    setPassword('')
    setShowPassword(false)
    setError('')
    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const formData = new FormData(event.currentTarget)
    const email = `${formData.get('email') || ''}`.trim()
    const supabase = createSupabaseBrowserClient()

    try {
      if (mode === 'reset') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`,
        })

        if (resetError) {
          throw resetError
        }

        router.push(`/verify-email?type=recovery&email=${encodeURIComponent(email)}`)
        return
      }

      if (mode === 'signup') {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: `${window.location.origin}/verify-email?type=signup&email=${encodeURIComponent(email)}`,
          },
        })

        if (otpError) {
          throw otpError
        }

        router.push(`/verify-email?type=signup&email=${encodeURIComponent(email)}`)
        return
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        throw signInError
      }

      if (data.session) {
        await syncSession(data.session)
      }

      router.replace('/')
      router.refresh()
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Could not complete your login request.')
    } finally {
      setLoading(false)
    }
  }

  async function handleProviderLogin(provider) {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const supabase = createSupabaseBrowserClient()
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (oauthError) {
        throw oauthError
      }
    } catch (oauthError) {
      const errorMessage =
        oauthError instanceof Error ? oauthError.message : 'Could not start that login provider.'
      const unsupportedProvider =
        errorMessage.includes('Unsupported provider') ||
        errorMessage.includes('provider is not enabled')

      setError(
        unsupportedProvider
          ? getProviderSetupMessage(providerButtons.find((item) => item.provider === provider)?.name || 'This')
          : errorMessage
      )
      setLoading(false)
    }
  }

  return (
    <>
      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm text-slate-700">
          Email
          <input
            suppressHydrationWarning
            type="email"
            name="email"
            required
            placeholder="name@example.com"
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
          />
        </label>

        {!isReset && !isSignup && (
          <PasswordField
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            placeholder="Enter password"
            label="Password"
            visible={showPassword}
            onToggle={() => setShowPassword((current) => !current)}
          />
        )}

        {isSignup && (
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
            We will send a one-time code to this email first. After you verify the OTP, Nexzen will ask you to set your password and then your profile name.
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-1 text-sm">
          <button
            suppressHydrationWarning
            type="button"
            onClick={() => resetState(isReset ? 'signin' : 'reset')}
            className="text-rose-600 transition hover:text-rose-700"
          >
            {isReset ? 'Back to sign in' : 'Forgot your password?'}
          </button>

          <button
            suppressHydrationWarning
            type="button"
            onClick={() => resetState(isSignup ? 'signin' : 'signup')}
            className="text-slate-600 transition hover:text-slate-950"
          >
            {isSignup ? 'Have an account?' : 'Create account'}
          </button>
        </div>

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

        <button
          suppressHydrationWarning
          type="submit"
          disabled={loading}
          className="interactive-button mt-3 inline-flex w-full items-center justify-center rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-700 hover:shadow-[0_16px_36px_rgba(225,29,72,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? 'Please wait...'
            : isReset
              ? 'Send reset OTP'
              : isSignup
                ? 'Send OTP'
                : 'Sign in'}
        </button>
      </form>

      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-sm font-medium text-slate-500">or continue with</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="space-y-3">
        {providerButtons.map((provider) => (
          <button
            key={provider.name}
            suppressHydrationWarning
            type="button"
            disabled={loading}
            onClick={() => handleProviderLogin(provider.provider)}
            className={`interactive-button flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${provider.className}`}
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/10 text-base font-bold">
              {provider.symbol}
            </span>
            <span>{provider.label}</span>
            <span className="w-9" />
          </button>
        ))}
      </div>

      <p className="mt-6 text-sm leading-6 text-slate-500">
        GitHub, Google, Facebook, and LinkedIn buttons now start real Supabase auth flows. Make sure each provider is enabled in your Supabase dashboard with this callback URL:
        <br />
        <span className="font-medium text-slate-700">{authCallbackPath}</span>
      </p>

      <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
        {isReset
          ? 'We will send a password reset email to your inbox. If your email template is set to OTP mode in Supabase, enter that code on the next screen. If it is set to link mode, use the link from your inbox and then choose a new password.'
          : isSignup
            ? 'Nexzen signup is now email-first: email, OTP, password, then your name. For real OTP inbox delivery in production, configure custom SMTP in Supabase Auth.'
            : 'Use your Nexzen email/password or a connected social provider to sign in and sync your account.'}
      </div>

      <div className="mt-5 text-sm text-slate-500">
        <Link href="/" className="transition hover:text-slate-950">
          Continue browsing without login
        </Link>
      </div>
    </>
  )
}
