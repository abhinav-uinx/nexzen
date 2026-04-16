import { prisma } from '@/lib/database/nexus-db'
import { cookies } from 'next/headers'
import { getAdminCookieName, getAdminSession } from '@/lib/admin/auth'

export async function GET(request) {
  try {
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
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(getAdminCookieName())?.value
    const session = await getAdminSession(sessionToken)

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, logoUrl } = await request.json()

    if (!name) {
      return Response.json({ error: 'Brand name is required' }, { status: 400 })
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const brand = await prisma.brand.create({
      data: {
        name,
        slug,
        description,
        logoUrl
      }
    })

    return Response.json(brand)
  } catch (error) {
    console.error('Brand Creation Error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
