import { createSupabaseServerClient } from '@/lib/auth/supabase-server'
import { syncAuthenticatedUser } from '@/lib/auth/user-auth'

function getBearerToken(request) {
  const authorization = request.headers.get('authorization') || ''

  if (!authorization.toLowerCase().startsWith('bearer ')) {
    return null
  }

  return authorization.slice(7).trim()
}

export async function handleUserSessionSync(request) {
  try {
    const accessToken = getBearerToken(request)

    if (!accessToken) {
      return Response.json({ error: 'Missing access token.' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken)

    if (error || !user) {
      return Response.json({ error: 'Could not verify signed-in user.' }, { status: 401 })
    }

    const rawIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const ipAddress = rawIp.split(',')[0].trim()
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const appUser = await syncAuthenticatedUser({
      user,
      accessToken,
      provider: body?.provider,
      expiresAt: body?.expiresAt ? new Date(body.expiresAt) : null,
      ipAddress,
      userAgent,
    })

    return Response.json({
      ok: true,
      user: {
        id: appUser.id,
        email: appUser.email,
        name: appUser.name,
        avatarUrl: appUser.avatarUrl,
      },
    })
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Could not sync signed-in user.',
      },
      { status: 500 }
    )
  }
}
