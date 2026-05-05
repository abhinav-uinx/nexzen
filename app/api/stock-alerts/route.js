import { NextResponse } from 'next/server'
import { getAppUserForRequest } from '@/lib/auth/user-session'
import {
  getStockAlertStatus,
  subscribeToStockAlert,
  unsubscribeFromStockAlert,
} from '@/lib/commerce/stock-alerts'
import { normalizeText } from '@/lib/security/validation'

export async function GET(request) {
  try {
    const { appUser } = await getAppUserForRequest(request)
    if (!appUser?.id) {
      return NextResponse.json({ ok: true, subscribed: false })
    }

    const { searchParams } = new URL(request.url)
    const productId = normalizeText(searchParams.get('productId'), 64)
    if (!productId) {
      return NextResponse.json({ ok: false, error: 'Product id is required.' }, { status: 400 })
    }

    const status = await getStockAlertStatus({
      userId: appUser.id,
      productId,
    })

    return NextResponse.json({ ok: true, ...status })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Could not load alert state.' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const { appUser } = await getAppUserForRequest(request)
    if (!appUser?.id) {
      return NextResponse.json({ ok: false, error: 'Sign in to save a stock alert.' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const productId = normalizeText(body?.productId, 64)
    if (!productId) {
      return NextResponse.json({ ok: false, error: 'Product id is required.' }, { status: 400 })
    }

    await subscribeToStockAlert({
      userId: appUser.id,
      productId,
      email: appUser.email,
    })

    return NextResponse.json({ ok: true, subscribed: true })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Could not save this stock alert.' },
      { status: 400 }
    )
  }
}

export async function DELETE(request) {
  try {
    const { appUser } = await getAppUserForRequest(request)
    if (!appUser?.id) {
      return NextResponse.json({ ok: false, error: 'Sign in to manage stock alerts.' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const productId = normalizeText(body?.productId, 64)
    if (!productId) {
      return NextResponse.json({ ok: false, error: 'Product id is required.' }, { status: 400 })
    }

    await unsubscribeFromStockAlert({
      userId: appUser.id,
      productId,
    })

    return NextResponse.json({ ok: true, subscribed: false })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Could not update this stock alert.' },
      { status: 500 }
    )
  }
}
