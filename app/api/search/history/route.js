import { NextResponse } from 'next/server'
import { getAppUserForRequest } from '@/lib/auth/user-session'
import { getRecentUserSearches, saveUserSearch } from '@/lib/search/history'
import { normalizeInteger, normalizeText } from '@/lib/security/validation'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = normalizeInteger(searchParams.get('limit'), { min: 1, max: 12, fallback: 6 })
    const { appUser } = await getAppUserForRequest(request)

    if (!appUser?.id) {
      return NextResponse.json({ ok: true, searches: [] })
    }

    const searches = await getRecentUserSearches({ userId: appUser.id, limit })
    return NextResponse.json({ ok: true, searches })
  } catch {
    return NextResponse.json({ ok: false, searches: [] }, { status: 200 })
  }
}

export async function POST(request) {
  try {
    const { appUser } = await getAppUserForRequest(request)

    if (!appUser?.id) {
      return NextResponse.json({ ok: true, saved: false }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const query = normalizeText(body?.query, 120)

    if (!query || query.length < 2) {
      return NextResponse.json({ ok: true, saved: false })
    }

    await saveUserSearch({
      userId: appUser.id,
      authUserId: appUser.authUserId || null,
      query,
    })

    return NextResponse.json({ ok: true, saved: true })
  } catch {
    return NextResponse.json({ ok: false, saved: false }, { status: 200 })
  }
}
