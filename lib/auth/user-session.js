import { createSupabaseServerClient } from '@/lib/auth/supabase-server'
import { syncAuthenticatedUser } from '@/lib/auth/user-auth'

export function getBearerToken(request) {
  const authorization = request.headers.get('authorization') || ''

  if (!authorization.toLowerCase().startsWith('bearer ')) {
    return null
  }

  return authorization.slice(7).trim()
}

export async function getAppUserForRequest(request) {
  const accessToken = getBearerToken(request)

  if (!accessToken) {
    return { accessToken: null, appUser: null }
  }

  const supabase = createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken)

  if (error || !user) {
    return { accessToken, appUser: null }
  }

  const appUser = await syncAuthenticatedUser({
    user,
    accessToken,
    provider: user.app_metadata?.provider,
    expiresAt: null,
  })

  return { accessToken, appUser }
}
