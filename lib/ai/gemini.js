import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')

export async function generateProductData({ name, sku, categories = [] }) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not configured in .env')
  }

  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    generationConfig: { responseMimeType: "application/json" }
  })

  const categoryListStr = categories.map(c => `- ${c.name} (ID: ${c.id})`).join('\n')

  const prompt = `
    You are an AI expert in industrial electronics and hardware components for Nexzen, an electronics store.
    
    Target Product Name: "${name}"
    Current SKU: "${sku || 'Unknown'}"

    Available Store Categories:
    ${categoryListStr || 'No categories provided. Categorize as "General" or "Miscellaneous".'}

    Please research this product (or similar products) and provide the following details in a clean JSON format:
    1. shortSpec: A very brief text (max 60 chars) summarizing key specs (e.g. "Wi-Fi, BLE, Dual-Core, 240MHz").
    2. dependencies: A comma-separated list of 2-3 compatible products (SKUs or Slugs).
    3. technicalHighlights: A markdown-formatted list of main technical features and certifications.
    4. usageGuide: A markdown-formatted guide on how to initialize or wire the product.
    5. shortDescription: A one-sentence marketing summary for product cards.
    6. description: A detailed multi-paragraph description.
    7. price: A realistic retail price in INR (number).
    8. compareAtPrice: A slightly higher MSRP price in INR for show (number).
    9. costPrice: An estimated wholesale cost in INR (number).
    10. brand: The legitimate brand name (e.g., "Seeed Studio", "Espressif").
    11. categoryId: The EXACT ID from the category list above that fits best.
    12. barcode: A likely 13-digit EAN/UPC barcode (string).
    13. weightGrams: Estimated product weight in grams (number).
    14. badge: A short status badge (e.g., "NEW", "HOT", "PRO").
    15. badgeTone: One of: "slate", "amber", "emerald", "rose", "violet", "sky", "orange". Use "sky" for Pro, "rose" for Hot, "emerald" for New.
    16. variants: Comma-separated list of variants (e.g., "Standard, With Headers").
    17. configs: Comma-separated list of hardware configs (e.g., "4MB, 8MB").

    The response MUST be ONLY valid JSON.
    Ensure the content is technical, professional, and helpful to engineers and makers.
  `

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Extract JSON if it's wrapped in markdown code blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    return JSON.parse(text)
  } catch (error) {
    console.error('Gemini Generation Error:', error)
    throw new Error('Failed to generate product data: ' + error.message)
  }
}
