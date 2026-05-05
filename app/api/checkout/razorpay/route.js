import { NextResponse } from 'next/server'
import { getRazorpay, getRazorpayConfig } from '@/lib/commerce/razorpay'
import { getAppUserForRequest } from '@/lib/auth/user-session'
import { getPrismaClient } from '@/lib/database/nexus-db'
import { normalizeText } from '@/lib/security/validation'

export async function POST(request) {
  try {
    const { appUser } = await getAppUserForRequest(request)
    if (!appUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const orderId = normalizeText(body?.orderId, 64)
    const currency = 'INR'

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const prisma = getPrismaClient()
    const orderRecord = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: appUser.id,
      },
      select: {
        id: true,
        total: true,
        paymentStatus: true,
      },
    })

    if (!orderRecord) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (orderRecord.paymentStatus === 'PAID') {
      return NextResponse.json({ error: 'Order is already paid' }, { status: 400 })
    }

    const razorpay = getRazorpay()
    const currentKey = getRazorpayConfig().key_id

    // Razorpay expect amount in paise (multiply by 100)
    const amountInPaise = Math.round(Number(orderRecord.total) * 100)
    const currencyCode = currency

    // VALIDATION: Razorpay Live mode requires a minimum of Rs 1.00 (100 paise)
    if (amountInPaise < 100) {
      return NextResponse.json({ 
        error: 'Minimum payment amount is Rs. 1.00. Please add more items or adjust your coupon.',
        code: 'MIN_AMOUNT_ERROR'
      }, { status: 400 })
    }

    const options = {
      amount: amountInPaise,
      currency: currencyCode,
      receipt: `receipt_${orderRecord.id}`,
      notes: {
        appOrderId: orderRecord.id,
        appUserId: appUser.id,
      },
    }

    const order = await razorpay.orders.create(options)

    await prisma.order.update({
      where: { id: orderRecord.id },
      data: {
        razorpayOrderId: order.id,
      },
    })
    
    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: currentKey
    })
  } catch (error) {
    console.error('Razorpay Order Error:', error)
    
    // Check if it's a configuration error
    const isConfigError = error.message.includes('missing in environment')
    const statusCode = isConfigError ? 501 : 500 // 501 Not Implemented or 503 Service Unavailable might be better, but 500 is default
    
    return NextResponse.json({ 
      error: error.message || 'Failed to create payment order',
      code: isConfigError ? 'CONFIG_ERROR' : (error.code || 'RAZORPAY_ERROR'),
      key_id: getRazorpayConfig().key_id || 'NOT_SET'
    }, { status: statusCode })
  }
}
