import crypto from 'node:crypto'
import { getPrismaClient } from '@/lib/database/nexus-db'
import { sendAdminNewOrderEmail, sendOrderPendingEmail } from '@/lib/mail/mailer'

function getSignatureBuffer(value) {
  const normalized = `${value || ''}`.trim()
  return /^[a-f0-9]+$/i.test(normalized) ? Buffer.from(normalized, 'hex') : Buffer.from(normalized)
}

export function verifyRazorpayPaymentSignature({ orderId, paymentId, signature, secret }) {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(`${orderId}|${paymentId}`)
  const generatedSignature = hmac.digest('hex')
  const generatedBuffer = Buffer.from(generatedSignature, 'hex')
  const providedBuffer = getSignatureBuffer(signature)

  return (
    generatedBuffer.length === providedBuffer.length &&
    crypto.timingSafeEqual(generatedBuffer, providedBuffer)
  )
}

export function verifyRazorpayWebhookSignature({ payload, signature, secret }) {
  const generated = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  const generatedBuffer = Buffer.from(generated, 'hex')
  const providedBuffer = getSignatureBuffer(signature)

  return (
    generatedBuffer.length === providedBuffer.length &&
    crypto.timingSafeEqual(generatedBuffer, providedBuffer)
  )
}

export async function finalizePaidOrder({ appOrderId = null, razorpayOrderId = null, razorpayPaymentId = null }) {
  const prisma = getPrismaClient()

  const order = await prisma.order.findFirst({
    where: {
      OR: [
        ...(appOrderId ? [{ id: appOrderId }] : []),
        ...(razorpayOrderId ? [{ razorpayOrderId }] : []),
      ],
    },
    include: {
      items: true,
      user: {
        include: {
          cart: true,
        },
      },
    },
  })

  if (!order) {
    return null
  }

  if (`${order.paymentStatus}`.toUpperCase() === 'PAID') {
    return order
  }

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: 'PAID',
      status: ['accepted', 'processing', 'shipped', 'delivered'].includes(`${order.status || ''}`.toLowerCase())
        ? order.status
        : 'accepted',
      razorpayOrderId: razorpayOrderId || order.razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId || order.razorpayPaymentId,
      lastTrackingUpdate: order.lastTrackingUpdate || 'Payment verified and order accepted for dispatch.',
    },
    include: {
      items: true,
      user: {
        include: {
          cart: true,
        },
      },
    },
  })

  if (updatedOrder.user?.cart?.id) {
    await prisma.cartItem.deleteMany({
      where: { cartId: updatedOrder.user.cart.id },
    }).catch(() => null)
  }

  if (updatedOrder.customerEmail) {
    sendOrderPendingEmail(updatedOrder.customerEmail, updatedOrder.id, Number(updatedOrder.total)).catch(() => null)
  }
  sendAdminNewOrderEmail(updatedOrder.id, updatedOrder.customerEmail, Number(updatedOrder.total)).catch(() => null)

  return updatedOrder
}
