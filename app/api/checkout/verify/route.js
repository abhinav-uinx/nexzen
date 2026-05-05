import { NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/database/nexus-db'
import { getAppUserForRequest } from '@/lib/auth/user-session'
import { normalizeText } from '@/lib/security/validation'
import { finalizePaidOrder, verifyRazorpayPaymentSignature } from '@/lib/commerce/payments'

export async function POST(request) {
  try {
    const { appUser } = await getAppUserForRequest(request)
    if (!appUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      orderId // Our database ID
    } = await request.json()

    // ... (rest of signature check remains same)

    const secret = process.env.RAZORPAY_KEY_SECRET

    if (!secret) {
      console.error('RAZORPAY_KEY_SECRET missing for verification')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    if (!verifyRazorpayPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      secret,
    })) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    const normalizedOrderId = normalizeText(orderId, 64)
    const prisma = getPrismaClient()
    const existingOrder = await prisma.order.findFirst({
      where: {
        id: normalizedOrderId,
        userId: appUser.id,
      },
      select: {
        id: true,
      },
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    await finalizePaidOrder({
      appOrderId: normalizedOrderId,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Verification Error:', error)
    return Response.json({ error: 'Payment verification failed' }, { status: 500 })
  }
}
