'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const INITIAL_STEP_UP_STATE = {
  failedAttempts: 0,
  stepUpRequired: false,
  stepUpThreshold: 10,
}

export default function AdminLoginForm({ adminBasePath }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') || 'login'
  const token = searchParams.get('token') || ''
  const usernameFromQuery = searchParams.get('username') || ''
  const [username, setUsername] = useState(usernameFromQuery)
  const [otpCode, setOtpCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [otpRequested, setOtpRequested] = useState(false)
  const [stepUpState, setStepUpState] = useState(INITIAL_STEP_UP_STATE)
  const [isPending, startTransition] = useTransition()

  const isResetMode = mode === 'reset' && token
  const canUseRecovery = stepUpState.stepUpRequired

  const helperText = useMemo(() => {
    if (canUseRecovery) {
      return 'Password attempts are being throttled. You can continue with OTP or reset your password.'
    }

    const remainingBeforeRecovery = Math.max(0, stepUpState.stepUpThreshold - stepUpState.failedAttempts)
    return `OTP and password reset unlock after ${remainingBeforeRecovery} more failed attempt${remainingBeforeRecovery === 1 ? '' : 's'}.`
  }, [canUseRecovery, stepUpState.failedAttempts, stepUpState.stepUpThreshold])

  async function readJson(response) {
    try {
      const text = await response.text()
      return text ? JSON.parse(text) : {}
    } catch {
      return {}
    }
  }

  function updateStepUp(result) {
    setStepUpState((current) => ({
      failedAttempts: result.failedAttempts ?? current.failedAttempts,
      stepUpRequired: result.stepUpRequired ?? current.stepUpRequired,
      stepUpThreshold: result.stepUpThreshold ?? current.stepUpThreshold,
    }))
  }

  function handlePasswordLogin(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    startTransition(async () => {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })

      const result = await readJson(response)
      updateStepUp(result)

      if (!response.ok) {
        setError(result.error || 'Login failed. Please try again.')
        return
      }

      router.push(adminBasePath)
      router.refresh()
    })
  }

  function handleRequestOtp() {
    setError('')
    setMessage('')

    startTransition(async () => {
      const response = await fetch('/api/admin/login/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'request',
          username,
        }),
      })

      const result = await readJson(response)
      updateStepUp(result)

      if (!response.ok) {
        setError(result.error || 'Could not send OTP.')
        return
      }

      setOtpRequested(true)
      setMessage(result.message || 'OTP sent successfully.')
    })
  }

  function handleVerifyOtp(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    startTransition(async () => {
      const response = await fetch('/api/admin/login/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'verify',
          username,
          code: otpCode,
        }),
      })

      const result = await readJson(response)
      updateStepUp(result)

      if (!response.ok) {
        setError(result.error || 'OTP verification failed.')
        return
      }

      router.push(adminBasePath)
      router.refresh()
    })
  }

  function handleRequestReset() {
    setError('')
    setMessage('')

    startTransition(async () => {
      const response = await fetch('/api/admin/password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'request',
          username,
        }),
      })

      const result = await readJson(response)
      updateStepUp(result)

      if (!response.ok) {
        setError(result.error || 'Could not send password reset email.')
        return
      }

      setMessage(result.message || 'Password reset link sent.')
    })
  }

  function handleConfirmReset(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    startTransition(async () => {
      const response = await fetch('/api/admin/password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'confirm',
          token,
          password,
          confirmPassword,
        }),
      })

      const result = await readJson(response)

      if (!response.ok) {
        setError(result.error || 'Could not reset the password.')
        return
      }

      setMessage('Password reset successful. You can sign in with the new password now.')
      setPassword('')
      setConfirmPassword('')
      router.replace(`${adminBasePath}/login`)
    })
  }

  if (isResetMode) {
    return (
      <form onSubmit={handleConfirmReset} className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-8">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Password Reset</p>
          <h2 className="mt-2 font-heading text-3xl font-semibold text-slate-950">Choose a new admin password</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Set a new password for <strong>{usernameFromQuery || 'your admin account'}</strong>. This link can only be used once.
          </p>
        </div>

        <label className="grid gap-2 text-sm text-slate-700">
          New password
          <input
            suppressHydrationWarning
            type="password"
            required
            minLength={10}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            placeholder="At least 10 characters"
          />
        </label>

        <label className="grid gap-2 text-sm text-slate-700">
          Confirm new password
          <input
            suppressHydrationWarning
            type="password"
            required
            minLength={10}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            placeholder="Re-enter password"
          />
        </label>

        {error && (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        {message && (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </p>
        )}

        <button
          suppressHydrationWarning
          type="submit"
          disabled={isPending}
          className="interactive-button inline-flex w-fit items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isPending ? 'Resetting...' : 'Reset password'}
        </button>
      </form>
    )
  }

  return (
    <div className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-8">
      <form onSubmit={handlePasswordLogin} className="grid gap-5">
        <label className="grid gap-2 text-sm text-slate-700">
          Username
          <input
            suppressHydrationWarning
            name="username"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            placeholder="admin"
          />
        </label>

        <label className="grid gap-2 text-sm text-slate-700">
          Password
          <input
            suppressHydrationWarning
            name="password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            placeholder="Enter password"
          />
        </label>

        {error && (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        {message && (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </p>
        )}

        <button
          suppressHydrationWarning
          type="submit"
          disabled={isPending}
          className="interactive-button inline-flex w-fit items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isPending ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Recovery options</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{helperText}</p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRequestOtp}
            disabled={isPending || !username || !canUseRecovery}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Login with OTP
          </button>
          <button
            type="button"
            onClick={handleRequestReset}
            disabled={isPending || !username || !canUseRecovery}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reset password
          </button>
        </div>
      </div>

      {otpRequested && (
        <form onSubmit={handleVerifyOtp} className="grid gap-4 rounded-[1.5rem] border border-blue-100 bg-blue-50/40 p-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">One-time passcode</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Enter the 6-digit code sent to the configured admin recovery email.
            </p>
          </div>

          <label className="grid gap-2 text-sm text-slate-700">
            OTP code
            <input
              suppressHydrationWarning
              required
              value={otpCode}
              onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              placeholder="6-digit code"
              inputMode="numeric"
            />
          </label>

          <button
            suppressHydrationWarning
            type="submit"
            disabled={isPending || otpCode.length !== 6}
            className="interactive-button inline-flex w-fit items-center justify-center rounded-full bg-blue-700 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-950 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isPending ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      )}
    </div>
  )
}
