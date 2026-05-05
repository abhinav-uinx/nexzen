import { prisma } from '@/lib/database/nexus-db'
import { requireAdminRequest } from '@/lib/admin/request'
import { isSafeRelativeAssetPath, isValidHttpsUrl, normalizeMultilineText, normalizeText } from '@/lib/security/validation'

export async function GET(request) {
  try {
    const auth = await requireAdminRequest(request)
    if (auth.error) {
      return auth.error
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')

    const brands = await prisma.brand.findMany({
      where: query ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
        ]
      } : {},
      orderBy: { name: 'asc' }
    })

    return Response.json(brands)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdminRequest(request, { csrf: true })
    if (auth.error) {
      return auth.error
    }

    const { name, description, logoUrl } = await request.json()
    const normalizedName = normalizeText(name, 120)
    const normalizedLogoUrl = normalizeText(logoUrl, 500)

    if (!normalizedName) {
      return Response.json({ error: 'Brand name is required' }, { status: 400 })
    }

    if (normalizedLogoUrl && !isValidHttpsUrl(normalizedLogoUrl) && !isSafeRelativeAssetPath(normalizedLogoUrl)) {
      return Response.json({ error: 'Logo URL must be https or a local asset path.' }, { status: 400 })
    }

    const slug = normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const brand = await prisma.brand.create({
      data: {
        name: normalizedName,
        slug,
        description: normalizeMultilineText(description, 1000) || null,
        logoUrl: normalizedLogoUrl || null
      }
    })

    return Response.json(brand)
  } catch (error) {
    console.error('Brand Creation Error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
