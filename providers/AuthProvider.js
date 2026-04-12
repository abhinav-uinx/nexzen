'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/auth/supabase-browser'

const AuthContext = createContext(null)

async function syncUserSession(session) {
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

async function removeUserSession(session) {
  if (!session?.access_token) {
    return
  }

  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  })
}

function hasAuthHash() {
  if (typeof window === 'undefined') {
    return false
  }

  const hash = window.location.hash || ''
  return (
    hash.includes('access_token=') ||
    hash.includes('refresh_token=') ||
    hash.includes('provider_token=') ||
    hash.includes('token_type=')
  )
}

function getExistingName(user) {
  const metadata = user?.user_metadata || {}
  return `${metadata.full_name || metadata.name || metadata.user_name || ''}`.trim()
}

function cleanAuthHashFromUrl() {
  if (typeof window === 'undefined' || !window.location.hash) {
    return
  }

  const cleanUrl = `${window.location.pathname}${window.location.search}`
  window.history.replaceState({}, document.title, cleanUrl)
}

function maybeRedirectAfterHashLogin(session) {
  if (typeof window === 'undefined' || !session?.user) {
    return
  }

  const provider = `${session.user?.app_metadata?.provider || ''}`.toLowerCase()
  const hasProfileName = Boolean(getExistingName(session.user))

  if (
    (provider === 'google' ||
      provider === 'github' ||
      provider === 'facebook' ||
      provider === 'linkedin_oidc') &&
    !hasProfileName
  ) {
    cleanAuthHashFromUrl()
    window.location.replace('/complete-profile?next=%2F')
    return
  }

  cleanAuthHashFromUrl()
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    async function bootstrap() {
      // Fix: If Supabase drops the redirect path and lands on root with an access token, manually route it.
      if (typeof window !== 'undefined' && window.location.hash.includes('access_token=') && window.location.pathname !== '/auth/callback') {
        window.location.href = `/auth/callback${window.location.hash}`
        return
      }

      try {
        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        setSession(currentSession)
        setUser(currentSession?.user || null)

        const authHashPresent = hasAuthHash()

        if (currentSession && authHashPresent) {
          maybeRedirectAfterHashLogin(currentSession)
        }

        if (currentSession) {
          await syncUserSession(currentSession)
        }
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : 'Could not restore your login session.')
      } finally {
        setLoading(false)
      }
    }

    bootstrap()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user || null)

      const authHashPresent = hasAuthHash()

      if (nextSession && authHashPresent) {
        maybeRedirectAfterHashLogin(nextSession)
      }

      if (nextSession) {
        try {
          await syncUserSession(nextSession)
          setAuthError('')
        } catch (error) {
          setAuthError(error instanceof Error ? error.message : 'Could not save your login session.')
        }
      }

      if (event === 'SIGNED_OUT') {
        setAuthError('')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function refreshUser() {
    const supabase = createSupabaseBrowserClient()
    const {
      data: { session: nextSession },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      throw error
    }

    setSession(nextSession)
    setUser(nextSession?.user || null)

    if (nextSession) {
      await syncUserSession(nextSession)
    }

    return nextSession?.user || null
  }

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      authError,
      refreshUser,
      async signOut() {
        const supabase = createSupabaseBrowserClient()
        const activeSession = session

        await removeUserSession(activeSession)
        await supabase.auth.signOut()
        setSession(null)
        setUser(null)
      },
    }),
    [authError, loading, session, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.')
  }

  return context
}
