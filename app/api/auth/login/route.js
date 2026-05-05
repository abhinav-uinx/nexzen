import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/auth/supabase-server'
import { getClientIpFromHeaders } from '@/lib/security/request'
import { normalizeEmail } from '@/lib/security/validation'
import {
  clearUserAuthAttempts,
  getUserAuthRateLimitState,
  recordUserAuthAttempt,
} from '@/lib/auth/rate-limit'
import { getPrismaClient } from '@/lib/database/nexus-db'

function rateLimitError(state, message) {
  return NextResponse.json(
    {
      error: message,
      remaining: state.remaining,
      retryAfterMs: state.retryAfterMs,
    },
    { status: 429 }
  )
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const mode = `${body?.mode || 'signin'}`.trim().toLowerCase()
    const email = normalizeEmail(body?.email)
    const password = `${body?.password || ''}`
    const ipAddress = getClientIpFromHeaders(request.headers)

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    const state = getUserAuthRateLimitState(mode, ipAddress, email)
    if (!state.allowed) {
      return rateLimitError(state, 'Too many attempts. Please wait before trying again.')
    }

    recordUserAuthAttempt(mode, ipAddress, email)
    const supabase = createSupabaseServerClient()

    if (mode === 'signin') {
      if (!password) {
        return NextResponse.json({ error: 'Password is required.' }, { status: 400 })
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error || !data.session) {
        return NextResponse.json(
          { error: error?.message || 'Invalid email or password.' },
          { status: 401 }
        )
      }

      clearUserAuthAttempts(mode, ipAddress, email)

      return NextResponse.json({
        ok: true,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          expires_in: data.session.expires_in,
          token_type: data.session.token_type,
          user: data.session.user,
        },
      })
    }

    if (mode === 'signup' || mode === 'signup-resend') {
      const prisma = getPrismaClient()
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      })

      if (existingUser && mode === 'signup') {
        return NextResponse.json(
          { error: 'Email is already registered. Please log in to the already registered account.' },
          { status: 400 }
        )
      }

      if (mode === 'signup') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
          },
        })

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
      } else {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email,
        })

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
      }

      return NextResponse.json({ ok: true })
    }

    if (mode === 'reset' || mode === 'reset-resend') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${request.nextUrl.origin}/update-password`,
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unsupported login action.' }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not complete the login request.' },
      { status: 500 }
    )
  }
}
