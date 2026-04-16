import { prisma } from '@/lib/database/nexus-db'
import { cookies } from 'next/headers'
import { getAdminCookieName, getAdminSession } from '@/lib/admin/auth'

export async function PATCH(request, { params }) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(getAdminCookieName())?.value
    const session = await getAdminSession(sessionToken)

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { name, description, logoUrl } = await request.json()

    const updateData = {}
    if (name) {
      updateData.name = name
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }
    if (description !== undefined) updateData.description = description
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl

    const brand = await prisma.brand.update({
      where: { id },
      data: updateData
    })

    return Response.json(brand)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(getAdminCookieName())?.value
    const session = await getAdminSession(sessionToken)

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if products are still using this brand
    const productCount = await prisma.product.count({
      where: { brandId: id }
    })

    if (productCount > 0) {
      return Response.json({ 
        error: `Cannot delete brand while it is still linked to ${productCount} products.` 
      }, { status: 400 })
    }

    await prisma.brand.delete({
      where: { id }
    })

    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
