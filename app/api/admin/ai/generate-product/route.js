import { generateProductData } from '@/lib/ai/gemini'
import { requireAdminRequest } from '@/lib/admin/request'
import { normalizeText } from '@/lib/security/validation'

export async function POST(request) {
  try {
    const auth = await requireAdminRequest(request, { csrf: true })
    if (auth.error) {
      return auth.error
    }

    const { name, sku, categories } = await request.json()

    if (!name) {
      return Response.json({ error: 'Name is required' }, { status: 400 })
    }

    // Clean name from the '!' trigger
    const cleanName = normalizeText(name.replace(/!$/, ''), 160)

    const data = await generateProductData({ 
      name: cleanName, 
      sku: normalizeText(sku, 64), 
      categories 
    })

    return Response.json({ ok: true, data })
  } catch (error) {
    console.error('AI Generation Route Error:', error)
    return Response.json(
      { error: error.message || 'Failed to generate product data' },
      { status: 500 }
    )
  }
}
