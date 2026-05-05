import { NextResponse } from 'next/server'
import { finalizePaidOrder, verifyRazorpayWebhookSignature } from '@/lib/commerce/payments'

export async function POST(request) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      return NextResponse.json({ error: 'Webhook secret is not configured.' }, { status: 500 })
    }

    const payload = await request.text()
    const signature = request.headers.get('x-razorpay-signature') || ''

    if (!verifyRazorpayWebhookSignature({ payload, signature, secret })) {
      return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 })
    }

    const event = JSON.parse(payload)
    const eventType = `${event?.event || ''}`.toLowerCase()

    if (!['payment.captured', 'order.paid'].includes(eventType)) {
      return NextResponse.json({ ok: true, ignored: true })
    }

    const paymentEntity = event?.payload?.payment?.entity || null
    const orderEntity = event?.payload?.order?.entity || null
    const appOrderId =
      paymentEntity?.notes?.appOrderId ||
      orderEntity?.notes?.appOrderId ||
      null
    const razorpayOrderId =
      paymentEntity?.order_id ||
      orderEntity?.id ||
      null
    const razorpayPaymentId = paymentEntity?.id || null

    await finalizePaidOrder({
      appOrderId,
      razorpayOrderId,
      razorpayPaymentId,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook processing failed:', error)
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 })
  }
}
