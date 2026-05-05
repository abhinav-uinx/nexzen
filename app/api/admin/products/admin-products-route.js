import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { requireAdminRequest } from '@/lib/admin/request'
import { notifyProductBackInStock } from '@/lib/commerce/stock-alerts'
import { prisma } from '@/lib/database/nexus-db'
import { isSafeRelativeAssetPath, isValidHttpsUrl, normalizeDecimal, normalizeInteger, normalizeMultilineText, normalizeText, parseCsvValues } from '@/lib/security/validation'
import { validateImageFile } from '@/lib/security/upload'

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function saveUploadedImage(image, slug) {
  const validated = validateImageFile(image)

  if (!validated) {
    return null
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadsDir, { recursive: true })

  const fileName = `${slug}-${randomUUID()}${validated.extension}`
  const filePath = path.join(uploadsDir, fileName)
  const arrayBuffer = await image.arrayBuffer()

  await writeFile(filePath, Buffer.from(arrayBuffer))
  return `/uploads/${fileName}`
}

async function buildMetadata(formData, slug) {
  // 1. Process manually entered URLs
  const manualGallery = parseCsvValues(formData.get('galleryUrls'), 10).filter(
    (value) => isValidHttpsUrl(value) || isSafeRelativeAssetPath(value)
  )
  
  // 2. Process uploaded gallery files
  const uploadedGallery = []
  const galleryFiles = formData.getAll('gallery').slice(0, 10)
  for (const file of galleryFiles) {
    const url = await saveUploadedImage(file, `${slug}-gallery`)
    if (url) uploadedGallery.push(url)
  }

  const gallery = [...manualGallery, ...uploadedGallery]
  
  const flavours = parseCsvValues(formData.get('variants') || formData.get('flavours'), 12)
  const sizes = parseCsvValues(formData.get('configs') || formData.get('sizes'), 12).map(s => {
    const label = s.trim()
    return label ? { label } : null
  }).filter(Boolean)
  
  const details = []
  const benefit = normalizeMultilineText(formData.get('featureContent') || formData.get('benefitContent'), 1200)
  const usage = normalizeMultilineText(formData.get('technicalContent') || formData.get('usageContent'), 1200)
  
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
  const name = normalizeText(formData.get('name'), 160)
  const sku = normalizeText(formData.get('sku'), 64).toUpperCase()
  const categoryId = normalizeText(formData.get('categoryId'), 64)
  const description = normalizeMultilineText(formData.get('description'), 4000)
  const status = normalizeText(formData.get('status') || 'ACTIVE', 16).toUpperCase()
  const barcode = normalizeText(formData.get('barcode'), 64)
  const requiresShipping = formData.get('requiresShipping') === 'on'
  const trackInventory = formData.get('trackInventory') === 'on'
  const stockQuantity = normalizeInteger(formData.get('stockQuantity'), { min: 0, max: 100000, fallback: 0 })
  const slug = slugify(name)

  return {
    valid: Boolean(name && sku && categoryId && description),
    name,
    sku,
    slug,
    categoryId,
    description,
    stockQuantity,
    dependencyTokens: parseCsvValues(formData.get('dependencies'), 20),
    data: {
      sku,
      name,
      slug,
      description,
      shortDescription: normalizeMultilineText(formData.get('shortDescription'), 500) || null,
      price: normalizeDecimal(formData.get('price'), { min: 0, max: 10000000, fallback: 0 }),
      compareAtPrice: formData.get('compareAtPrice') ? normalizeDecimal(formData.get('compareAtPrice'), { min: 0, max: 10000000, fallback: 0 }) : null,
      costPrice: formData.get('costPrice') ? normalizeDecimal(formData.get('costPrice'), { min: 0, max: 10000000, fallback: 0 }) : null,
      imageUrl: imageUrl || fallbackImageUrl || null,
      barcode: barcode || null,
      brandId: normalizeText(formData.get('brandId'), 64) || null,
      brand: normalizeText(formData.get('brandName') || formData.get('brand'), 120) || null,
      stockQuantity,
      lowStockThreshold: normalizeInteger(formData.get('lowStockThreshold'), { min: 0, max: 100000, fallback: 5 }),
      inStock: stockQuantity > 0,
      status: ['ACTIVE', 'DRAFT', 'ARCHIVED'].includes(status) ? status : 'ACTIVE',
      weightGrams: normalizeInteger(formData.get('weightGrams'), { min: -1, max: 1000000, fallback: -1 }) >= 0
        ? normalizeInteger(formData.get('weightGrams'), { min: 0, max: 1000000, fallback: 0 })
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
    const auth = await requireAdminRequest(request, { csrf: true })
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
    const auth = await requireAdminRequest(request, { csrf: true })
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

    const restocked =
      (existingProduct.stockQuantity <= 0 || !existingProduct.inStock) &&
      (payload.stockQuantity > 0 || payload.data.inStock)

    if (restocked) {
      notifyProductBackInStock(product.id).catch((error) => {
        console.error('Failed to process stock alerts', error)
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
    const auth = await requireAdminRequest(request, { csrf: true })
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

