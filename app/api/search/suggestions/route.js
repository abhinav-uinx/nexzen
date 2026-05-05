import { NextResponse } from 'next/server'
import { getSearchSuggestions } from '@/lib/catalog/products'
import { normalizeInteger, normalizeText } from '@/lib/security/validation'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = normalizeText(searchParams.get('q'), 120)
    const limit = normalizeInteger(searchParams.get('limit'), { min: 1, max: 10, fallback: 8 })

    if (!query || query.length < 2) {
      return NextResponse.json({ ok: true, suggestions: [] })
    }

    const suggestions = await getSearchSuggestions(query, limit)
    return NextResponse.json({ ok: true, suggestions })
  } catch (error) {
    return NextResponse.json({ ok: false, suggestions: [] }, { status: 200 })
  }
}
