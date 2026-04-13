import Razorpay from 'razorpay'

export function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID
  const key_secret = process.env.RAZORPAY_KEY_SECRET

  if (!key_id || !key_secret) {
    throw new Error('Razorpay credentials missing in environment')
  }

  return new Razorpay({
    key_id,
    key_secret,
  })
}

export function getRazorpayConfig() {
  return {
    key_id: process.env.RAZORPAY_KEY_ID
  }
}
