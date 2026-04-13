const Razorpay = require('razorpay');
require('dotenv').config();

async function testRazorpay() {
  console.log('Testing Razorpay Live Key...');
  console.log('Key ID:', process.env.RAZORPAY_KEY_ID);
  
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  try {
    const order = await razorpay.orders.create({
      amount: 100, // 1 INR
      currency: 'INR',
      receipt: 'test_receipt_' + Date.now()
    });
    console.log('SUCCESS: Order created!', order.id);
  } catch (error) {
    console.error('FAILURE: Razorpay Error');
    console.error('Status Code:', error.statusCode);
    console.error('Description:', error.error ? error.error.description : error.message);
    console.error('Full Error:', JSON.stringify(error, null, 2));
  }
}

testRazorpay();
