const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

async function testRawFetch() {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

  console.log('Fetching models from:', url);
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok) {
      console.log('Available Models:');
      if (data.models) {
        data.models.forEach(m => console.log(` - ${m.name}`));
      } else {
        console.log('No models found in response.');
      }
    } else {
      console.error('Error Status:', response.status);
      console.error('Error Data:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Fetch Fatal:', err.message);
  }
}

testRawFetch();
