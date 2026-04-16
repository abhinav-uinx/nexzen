const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');
  try {
    // There isn't a direct listModels in the SDK easily accessible without an authenticated client
    // But we can try to use a model that definitely exists
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('Testing gemini-1.5-flash...');
    const result = await model.generateContent('hi');
    console.log('Response:', result.response.text());
  } catch (error) {
    console.error('Error:', error.message);
    if (error.message.includes('404')) {
      console.log('Trying gemini-pro instead...');
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent('hi');
        console.log('Response:', result.response.text());
      } catch (err) {
        console.error('Pro Error:', err.message);
      }
    }
  }
}

listModels();
