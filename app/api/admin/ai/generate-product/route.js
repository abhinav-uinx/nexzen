import { generateProductData } from '@/lib/ai/gemini'
import { cookies } from 'next/headers'
import { getAdminCookieName, getAdminSession } from '@/lib/admin/auth'

export async function POST(request) {
  try {
    // Basic admin check
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(getAdminCookieName())?.value
    const session = await getAdminSession(sessionToken)

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, sku, categories } = await request.json()

    if (!name) {
      return Response.json({ error: 'Name is required' }, { status: 400 })
    }

    // Clean name from the '!' trigger
    const cleanName = name.replace(/!$/, '').trim()

    const data = await generateProductData({ 
      name: cleanName, 
      sku, 
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
