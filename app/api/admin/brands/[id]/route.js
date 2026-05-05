import { prisma } from '@/lib/database/nexus-db'
import { requireAdminRequest } from '@/lib/admin/request'
import { isSafeRelativeAssetPath, isValidHttpsUrl, normalizeMultilineText, normalizeText } from '@/lib/security/validation'

export async function PATCH(request, { params }) {
  try {
    const auth = await requireAdminRequest(request, { csrf: true })
    if (auth.error) {
      return auth.error
    }

    const { id } = await params
    const { name, description, logoUrl } = await request.json()
    const normalizedName = normalizeText(name, 120)
    const normalizedLogoUrl = normalizeText(logoUrl, 500)

    if (normalizedLogoUrl && !isValidHttpsUrl(normalizedLogoUrl) && !isSafeRelativeAssetPath(normalizedLogoUrl)) {
      return Response.json({ error: 'Logo URL must be https or a local asset path.' }, { status: 400 })
    }

    const updateData = {}
    if (normalizedName) {
      updateData.name = normalizedName
      updateData.slug = normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }
    if (description !== undefined) updateData.description = normalizeMultilineText(description, 1000) || null
    if (logoUrl !== undefined) updateData.logoUrl = normalizedLogoUrl || null

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
    const auth = await requireAdminRequest(request, { csrf: true })
    if (auth.error) {
      return auth.error
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
