import { NextResponse } from 'next/server'
import { getRazorpay, getRazorpayConfig } from '@/lib/commerce/razorpay'

export async function POST(request) {
  try {
    const body = await request.json()
    const { amount, currency = 'INR', receipt } = body

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 })
    }

    const razorpay = getRazorpay()
    const currentKey = getRazorpayConfig().key_id

    // Razorpay expect amount in paise (multiply by 100)
    const amountInPaise = Math.round(Number(amount) * 100)
    const currencyCode = currency || 'INR'

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
      receipt: `receipt_${receipt || Date.now()}`,
    }

    const order = await razorpay.orders.create(options)
    
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
