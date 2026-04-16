const dotenv = require('dotenv');
const path = require('path');

// Load .env BEFORE requiring dependencies that use env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const { generateProductData } = require('./lib/ai/gemini');

async function test() {
  console.log('Testing AI Agent with "Arduino Uno R4 Minima"...');
  console.log('Key length:', process.env.GOOGLE_GENERATIVE_AI_API_KEY?.length);
  try {
    const data = await generateProductData({ name: 'Arduino Uno R4 Minima', sku: 'ARD-UNO-R4' });
    console.log('SUCCESS!');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('FAILED:', error.message);
  }
}

test();
