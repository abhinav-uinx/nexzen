import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { cookies } from 'next/headers'
import { getAllowedAdminIps } from '@/lib/admin/config'
import { getAdminCookieName, getAdminSession } from '@/lib/admin/auth'
import { getClientIpFromHeaders, isIpAllowed } from '@/lib/admin/security'
import { prisma } from '@/lib/database/nexus-db'

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseDecimal(value) {
  if (!value) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function parseInteger(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

async function requireAdminSession(request) {
  const ip = getClientIpFromHeaders(request.headers)
  const allowedIps = getAllowedAdminIps()

  if (!isIpAllowed(ip, allowedIps)) {
    return {
      error: Response.json({ error: 'Not found.' }, { status: 404 }),
      ip,
    }
  }

  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(getAdminCookieName())?.value
  const session = await getAdminSession(sessionToken)

  if (!session) {
    return {
      error: Response.json({ error: 'Unauthorized.' }, { status: 401 }),
      ip,
    }
  }

  return { session, ip }
}

async function saveUploadedImage(image, slug) {
  if (!image || typeof image !== 'object' || image.size <= 0) {
    return null
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadsDir, { recursive: true })

  const ext = path.extname(image.name) || '.png'
  const fileName = `${slug}-${randomUUID()}${ext}`
  const filePath = path.join(uploadsDir, fileName)
  const arrayBuffer = await image.arrayBuffer()

  await writeFile(filePath, Buffer.from(arrayBuffer))
  return `/uploads/${fileName}`
}

async function buildMetadata(formData, slug) {
  // 1. Process manually entered URLs
  const manualGallery = `${formData.get('galleryUrls') || ''}`.split(',').map(s => s.trim()).filter(Boolean)
  
  // 2. Process uploaded gallery files
  const uploadedGallery = []
  const galleryFiles = formData.getAll('gallery')
  for (const file of galleryFiles) {
    const url = await saveUploadedImage(file, `${slug}-gallery`)
    if (url) uploadedGallery.push(url)
  }

  const gallery = [...manualGallery, ...uploadedGallery]
  
  const flavours = `${formData.get('variants') || formData.get('flavours') || ''}`.split(',').map(s => s.trim()).filter(Boolean)
  const sizes = `${formData.get('configs') || formData.get('sizes') || ''}`.split(',').map(s => {
    const label = s.trim()
    return label ? { label } : null
  }).filter(Boolean)
  
  const details = []
  const benefit = `${formData.get('featureContent') || formData.get('benefitContent') || ''}`.trim()
  const usage = `${formData.get('technicalContent') || formData.get('usageContent') || ''}`.trim()
  
  if (benefit) details.push({ title: 'Technical Highlights', content: benefit })
  if (usage) details.push({ title: 'Usage & Setup Guide', content: usage })

  return {
    presentation: {
      family: `${formData.get('brandName') || formData.get('brand') || ''}`.trim() || undefined,
      badge: `${formData.get('badge') || ''}`.trim() || undefined,
      badgeTone: `${formData.get('badgeTone') || ''}`.trim() || undefined,
      rating: parseDecimal(`${formData.get('rating') || ''}`) || undefined,
      reviews: parseInteger(`${formData.get('reviews') || ''}`, 0) || undefined,
      shortSpec: `${formData.get('shortSpec') || ''}`.trim() || undefined,
      accent: `${formData.get('accent') || ''}`.trim() || undefined,
      surface: `${formData.get('surface') || ''}`.trim() || undefined,
      // Premium Hardware Extensions
      flavours: flavours.length > 0 ? flavours : undefined,
      sizes: sizes.length > 0 ? sizes : undefined,
      gallery: gallery.length > 0 ? gallery : undefined,
      details: details.length > 0 ? details : undefined,
    },
  }
}

async function buildProductData(formData, imageUrl, fallbackImageUrl = null) {
  const name = `${formData.get('name') || ''}`.trim()
  const sku = `${formData.get('sku') || ''}`.trim().toUpperCase()
  const categoryId = `${formData.get('categoryId') || ''}`.trim()
  const description = `${formData.get('description') || ''}`.trim()
  const status = `${formData.get('status') || 'ACTIVE'}`.trim().toUpperCase()
  const barcode = `${formData.get('barcode') || ''}`.trim()
  const requiresShipping = formData.get('requiresShipping') === 'on'
  const trackInventory = formData.get('trackInventory') === 'on'
  const stockQuantity = parseInteger(`${formData.get('stockQuantity') || ''}`, 0)
  const slug = slugify(name)

  return {
    valid: Boolean(name && sku && categoryId && description),
    name,
    sku,
    slug,
    categoryId,
    description,
    stockQuantity,
    dependencyTokens: `${formData.get('dependencies') || ''}`
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    data: {
      sku,
      name,
      slug,
      description,
      shortDescription: `${formData.get('shortDescription') || ''}`.trim() || null,
      price: parseDecimal(`${formData.get('price') || ''}`) || 0,
      compareAtPrice: parseDecimal(`${formData.get('compareAtPrice') || ''}`),
      costPrice: parseDecimal(`${formData.get('costPrice') || ''}`),
      imageUrl: imageUrl || fallbackImageUrl || null,
      barcode: barcode || null,
      brandId: `${formData.get('brandId') || ''}`.trim() || null,
      brand: `${formData.get('brandName') || formData.get('brand') || ''}`.trim() || null,
      stockQuantity,
      lowStockThreshold: parseInteger(`${formData.get('lowStockThreshold') || ''}`, 5),
      inStock: stockQuantity > 0,
      status: ['ACTIVE', 'DRAFT', 'ARCHIVED'].includes(status) ? status : 'ACTIVE',
      weightGrams: parseInteger(`${formData.get('weightGrams') || ''}`, -1) >= 0
        ? parseInteger(`${formData.get('weightGrams') || ''}`, 0)
        : null,
      requiresShipping,
      trackInventory,
      categoryId,
      metadata: await buildMetadata(formData, slug),
    },
  }
}

async function syncDependencies(productId, dependencyTokens) {
  await prisma.productDependency.deleteMany({
    where: {
      productId,
    },
  })

  if (dependencyTokens.length === 0) {
    return
  }

  const dependencies = await prisma.product.findMany({
    where: {
      OR: [
        { sku: { in: dependencyTokens } },
        { slug: { in: dependencyTokens.map(slugify) } },
      ],
      NOT: {
        id: productId,
      },
    },
    select: {
      id: true,
    },
  })

  if (dependencies.length > 0) {
    await prisma.productDependency.createMany({
      data: dependencies.map((dependency) => ({
        productId,
        dependencyProductId: dependency.id,
        quantity: 1,
      })),
      skipDuplicates: true,
    })
  }
}

async function ensureUniqueSlug(baseSlug, productId = null) {
  let slug = baseSlug
  let attempts = 0
  const maxAttempts = 5

  while (attempts < maxAttempts) {
    const existing = await prisma.product.findFirst({
      where: {
        slug,
        NOT: productId ? { id: productId } : undefined,
      },
      select: { id: true },
    })

    if (!existing) return slug

    // If collision, append 4 random chars
    const suffix = Math.random().toString(36).substring(2, 6)
    slug = `${baseSlug}-${suffix}`
    attempts++
  }

  return `${baseSlug}-${randomUUID().substring(0, 8)}`
}

export async function handleCreateAdminProduct(request) {
  try {
    const auth = await requireAdminSession(request)
    if (auth.error) {
      return auth.error
    }

    const formData = await request.formData()
    const rawData = await buildProductData(formData, null)

    if (!rawData.valid) {
      return Response.json({ error: 'Name, SKU, category, and description are required.' }, { status: 400 })
    }

    // Ensure Slug Uniqueness
    const uniqueSlug = await ensureUniqueSlug(rawData.slug)
    
    const image = formData.get('image')
    const imageUrl = await saveUploadedImage(image, uniqueSlug)
    const payload = await buildProductData(formData, imageUrl)
    
    // Override with unique slug
    payload.data.slug = uniqueSlug

    const product = await prisma.product.create({
      data: payload.data,
    })

    if (payload.stockQuantity > 0) {
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,
          type: 'IN',
          quantity: payload.stockQuantity,
          reason: 'Created from admin form',
          reference: `admin-create-${product.slug}`,
        },
      })
    }

    await syncDependencies(product.id, payload.dependencyTokens)

    return Response.json({
      ok: true,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
      },
    })
  } catch (error) {
    console.error('Create Product Error:', error)
    
    // Handle Prisma unique constraint violations (P2002)
    if (error.code === 'P2002') {
      const target = error.meta?.target || []
      if (target.includes('slug')) {
        return Response.json({ error: 'A product with a similar name/slug already exists. Please try a different name.' }, { status: 400 })
      }
      if (target.includes('sku')) {
        return Response.json({ error: 'A product with this SKU already exists.' }, { status: 400 })
      }
    }

    const message =
      error instanceof Error ? error.message : 'Something went wrong while creating the product.'

    return Response.json({ error: message }, { status: 500 })
  }
}

export async function handleUpdateAdminProduct(request) {
  try {
    const auth = await requireAdminSession(request)
    if (auth.error) {
      return auth.error
    }

    const formData = await request.formData()
    const productId = `${formData.get('id') || ''}`.trim()

    if (!productId) {
      return Response.json({ error: 'Product id is required.' }, { status: 400 })
    }

    const existingProduct = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    })

    if (!existingProduct) {
      return Response.json({ error: 'Product not found.' }, { status: 404 })
    }

    const rawData = await buildProductData(formData, null, existingProduct.imageUrl)

    if (!rawData.valid) {
      return Response.json({ error: 'Name, SKU, category, and description are required.' }, { status: 400 })
    }

    // Ensure Slug Uniqueness for update (ignoring current product)
    const uniqueSlug = await ensureUniqueSlug(rawData.slug, productId)

    const image = formData.get('image')
    const uploadedImageUrl = await saveUploadedImage(image, uniqueSlug)
    const payload = await buildProductData(formData, uploadedImageUrl, existingProduct.imageUrl)
    
    // Override with unique slug
    payload.data.slug = uniqueSlug

    const product = await prisma.product.update({
      where: {
        id: productId,
      },
      data: payload.data,
    })

    if (existingProduct.stockQuantity !== payload.stockQuantity) {
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,
          type: 'ADJUSTMENT',
          quantity: payload.stockQuantity - existingProduct.stockQuantity,
          reason: 'Updated from admin panel',
          reference: `admin-update-${product.slug}`,
        },
      })
    }

    await syncDependencies(product.id, payload.dependencyTokens)

    return Response.json({
      ok: true,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
      },
    })
  } catch (error) {
    console.error('Update Product Error:', error)

    // Handle Prisma unique constraint violations (P2002)
    if (error.code === 'P2002') {
      const target = error.meta?.target || []
      if (target.includes('slug')) {
        return Response.json({ error: 'Another product already has a similar name/slug. Please try a different name.' }, { status: 400 })
      }
      if (target.includes('sku')) {
        return Response.json({ error: 'Another product already has this SKU.' }, { status: 400 })
      }
    }

    const message =
      error instanceof Error ? error.message : 'Something went wrong while updating the product.'

    return Response.json({ error: message }, { status: 500 })
  }
}

export async function handleDeleteAdminProduct(request) {
  try {
    const auth = await requireAdminSession(request)
    if (auth.error) {
      return auth.error
    }

    const { id } = await request.json()
    const productId = `${id || ''}`.trim()

    if (!productId) {
      return Response.json({ error: 'Product id is required.' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
        name: true,
      },
    })

    if (!product) {
      return Response.json({ error: 'Product not found.' }, { status: 404 })
    }

    await prisma.productDependency.deleteMany({
      where: {
        OR: [{ productId }, { dependencyProductId: productId }],
      },
    })

    await prisma.inventoryMovement.deleteMany({
      where: {
        productId,
      },
    })

    await prisma.product.delete({
      where: {
        id: productId,
      },
    })

    return Response.json({
      ok: true,
      deletedId: product.id,
      deletedName: product.name,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Something went wrong while deleting the product.'

    return Response.json({ error: message }, { status: 500 })
  }
}

