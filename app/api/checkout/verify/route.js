import crypto from 'node:crypto'
import { prisma } from '@/lib/database/nexus-db'
import { sendOrderPendingEmail, sendAdminNewOrderEmail } from '@/lib/mail/mailer'

export async function POST(request) {
  try {
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

    // Verify signature
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id)
    const generatedSignature = hmac.digest('hex')

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // Update Order Status in Database
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
        status: 'accepted', // Auto-accept paid orders
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      },
      include: {
        items: true,
        user: { include: { cart: true } }
      }
    })

    // Clear the user's cart in the database now that payment is confirmed
    if (updatedOrder.user?.cart?.id) {
      await prisma.cartItem.deleteMany({
        where: { cartId: updatedOrder.user.cart.id }
      }).catch(err => console.error('Failed to clear DB cart items:', err))
    }

    // Now send the emails because payment is CONFIRMED
    sendOrderPendingEmail(updatedOrder.customerEmail, updatedOrder.id, Number(updatedOrder.total)).catch(console.error)
    sendAdminNewOrderEmail(updatedOrder.id, updatedOrder.customerEmail, Number(updatedOrder.total)).catch(console.error)

    return Response.json({ success: true })
  } catch (error) {
    console.error('Verification Error:', error)
    return Response.json({ error: 'Payment verification failed' }, { status: 500 })
  }
}
