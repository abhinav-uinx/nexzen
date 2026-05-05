'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/auth/supabase-browser'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

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

function getProviderSetupMessage(providerName) {
  const url = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '/auth/callback'
  return `${providerName} login is disabled in Supabase right now. Enable the ${providerName} provider in Supabase Authentication > Providers and add ${url} as an allowed redirect URL.`
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
  const [rateLimitMessage, setRateLimitMessage] = useState('')
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
    setRateLimitMessage('')
  }

  async function readJson(response) {
    try {
      const text = await response.text()
      return text ? JSON.parse(text) : {}
    } catch {
      return {}
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    setRateLimitMessage('')

    const formData = new FormData(event.currentTarget)
    const email = `${formData.get('email') || ''}`.trim()
    const supabase = createSupabaseBrowserClient()

    try {
      if (mode === 'reset') {
        const resetResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'reset',
            email,
          }),
        })

        const resetResult = await readJson(resetResponse)
        if (!resetResponse.ok) {
          if (resetResponse.status === 429) {
            setRateLimitMessage('Password reset is temporarily rate-limited. Please wait a few minutes before trying again.')
          }
          throw new Error(resetResult.error || 'Could not start password reset.')
        }

        sessionStorage.setItem('verifyEmail', email)
        router.push('/verify-email?type=recovery')
        return
      }

      if (mode === 'signup') {
        const signupResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'signup',
            email,
          }),
        })

        const signupResult = await readJson(signupResponse)
        if (!signupResponse.ok) {
          if (signupResponse.status === 429) {
            setRateLimitMessage('OTP requests are temporarily rate-limited. Please wait before requesting another code.')
          }
          throw new Error(signupResult.error || 'Could not send signup OTP.')
        }

        sessionStorage.setItem('verifyEmail', email)
        router.push('/verify-email?type=signup')
        return
      }

      const signInResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'signin',
          email,
          password,
        }),
      })

      const signInResult = await readJson(signInResponse)

      if (!signInResponse.ok) {
        if (signInResponse.status === 429) {
          setRateLimitMessage('Too many login attempts. Please wait a few minutes before trying again.')
        }
        throw new Error(signInResult.error || 'Could not complete your login request.')
      }

      if (signInResult.session?.access_token && signInResult.session?.refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: signInResult.session.access_token,
          refresh_token: signInResult.session.refresh_token,
        })

        if (sessionError) {
          throw sessionError
        }

        await syncSession(signInResult.session)
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

        {rateLimitMessage && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {rateLimitMessage}
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
            ? <LoadingSpinner size="sm" tone="light" label="Please wait..." />
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
            <span>{loading ? <LoadingSpinner size="sm" tone={provider.name === 'Google' ? 'dark' : 'light'} label="Connecting..." /> : provider.label}</span>
            <span className="w-9" />
          </button>
        ))}
      </div>

      <div className="mt-5 text-sm text-slate-500">
        <Link href="/" className="transition hover:text-slate-950">
          Continue browsing without login
        </Link>
      </div>
    </>
  )
}
