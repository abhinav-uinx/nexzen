import { prisma } from '@/lib/database/nexus-db'

function isDatabaseConnectivityError(error) {
  return (
    error &&
    typeof error === 'object' &&
    typeof error.message === 'string' &&
    (
      error.message.includes("Can't reach database server") ||
      error.message.includes('Timed out fetching a new connection') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ECONNRESET')
    )
  )
}

async function withCatalogFallback(task, fallbackValue, label) {
  try {
    return await task()
  } catch (error) {
    if (isDatabaseConnectivityError(error)) {
      console.error(`[CATALOG_FALLBACK:${label}]`, error.message)
      return fallbackValue
    }

    throw error
  }
}

// Deleted hardcoded productPresentation object.

function titleToSpec(name) {
  return name
    .split(' ')
    .slice(0, 4)
    .join(' ')
}

export function mapProduct(product) {
  const metadataPresentation =
    product.metadata &&
    typeof product.metadata === 'object' &&
    !Array.isArray(product.metadata) &&
    product.metadata.presentation &&
    typeof product.metadata.presentation === 'object'
      ? product.metadata.presentation
      : {}

  const presentation = {
    ...metadataPresentation,
  }

  let avgRating = presentation.rating || 4.8;
  let reviewCount = presentation.reviews || 100;
  
  if (product.reviews && product.reviews.length > 0) {
    reviewCount = product.reviews.length;
    avgRating = Number((product.reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewCount).toFixed(1));
  }

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    imageUrl: product.imageUrl,
    category: product.category.slug,
    categoryName: product.category.name,
    family: presentation.family || product.category.name,
    price: Number(product.price),
    originalPrice: presentation.originalPrice || (product.compareAtPrice ? Number(product.compareAtPrice) : null),
    badge: presentation.badge || 'Featured',
    badgeTone: presentation.badgeTone || 'slate',
    inStock: product.inStock,
    rating: avgRating,
    reviews: reviewCount,
    shortSpec: presentation.shortSpec || titleToSpec(product.name),
    blurb: product.description || 'Built for hardware teams shipping real projects.',
    accent: presentation.accent || 'from-[#0f172a] via-[#1d4ed8] to-[#38bdf8]',
    surface: presentation.surface || 'bg-[#eff6ff]',
    // Premium Specifications
    flavours: presentation.flavours || [],
    sizes: presentation.sizes || [],
    gallery: presentation.gallery || (product.imageUrl ? [product.imageUrl] : []),
    dependencyProducts: product.dependencies?.map((dependency) => ({
      id: dependency.dependencyProduct.id,
      slug: dependency.dependencyProduct.slug,
      name: dependency.dependencyProduct.name,
      imageUrl: dependency.dependencyProduct.imageUrl,
      price: Number(dependency.dependencyProduct.price || 0),
      quantity: dependency.quantity,
      isOptional: dependency.isOptional,
      shortDescription: dependency.dependencyProduct.shortDescription || '',
    })) || [],
    details: presentation.details || [
      { title: 'Technical Specifications', content: product.shortDescription || 'Core hardware specs and pinouts' },
      { title: 'Usage & Setup Guide', content: 'Connect to power via USB-C or VIN and initialize via the IDE.' },
      { title: 'Feature Highlights', content: 'Engineered for high-performance embedded workloads.' }
    ]
  }
}

export async function getAllProducts() {
  return withCatalogFallback(async () => {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        reviews: { select: { rating: true } }
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return products.map(mapProduct)
  }, [], 'getAllProducts')
}

export async function getPaginatedProducts({ 
  page = 1, 
  limit = 12, 
  category = null, 
  query = null, 
  sort = 'newest' ,
  minPrice = null,
  maxPrice = null,
  availability = null,
  brands = null, // Comma-separated string
  iot = false,
  lowStock = false
} = {}) {
  const skip = (page - 1) * limit
  
  const where = {
    ...(category ? { category: { slug: category } } : {}),
    ...(query ? {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
        { brand: { contains: query, mode: 'insensitive' } },
      ]
    } : {}),
    ...(minPrice || maxPrice ? {
      price: {
        ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
        ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
      }
    } : {}),
    ...(availability === 'in-stock' ? {
      inStock: true,
    } : {}),
    ...(availability === 'out-of-stock' ? {
      inStock: false,
    } : {}),
    ...(brands ? {
      brand: { in: brands.split(',') }
    } : {}),
    ...(iot ? {
      category: {
        OR: [
          { name: { contains: 'IoT', mode: 'insensitive' } },
          { name: { contains: 'Smart', mode: 'insensitive' } },
          { name: { contains: 'Sensor', mode: 'insensitive' } },
          { slug: { contains: 'iot', mode: 'insensitive' } },
        ]
      }
    } : {}),
    ...(lowStock ? {
      AND: [
        { trackInventory: true },
        { stockQuantity: { lte: prisma.product.fields.lowStockThreshold } }
      ]
    } : {})
  }

  let orderBy = { createdAt: 'desc' }
  if (sort === 'price-asc') orderBy = { price: 'asc' }
  else if (sort === 'price-desc') orderBy = { price: 'desc' }
  else if (sort === 'rating') orderBy = { reviews: { _count: 'desc' } } // Fallback for rating sort in query

  return withCatalogFallback(async () => {
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        reviews: { select: { rating: true } },
        dependencies: {
          include: {
            dependencyProduct: {
              select: {
                id: true,
                sku: true,
                slug: true,
                name: true,
                imageUrl: true,
                price: true,
                shortDescription: true,
              },
            },
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    })

    return products.map(product => {
      const mapped = mapProduct(product)
      
      return {
        ...mapped,
        sku: product.sku || '',
        barcode: product.barcode || '',
        status: product.status,
        costPrice: product.costPrice ? Number(product.costPrice) : '',
        weightGrams: product.weightGrams ?? '',
        requiresShipping: product.requiresShipping,
        trackInventory: product.trackInventory,
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
        shortDescription: product.shortDescription || '',
        description: product.description || '',
        dependencies: product.dependencies?.map(
          (dependency) => dependency.dependencyProduct.sku || dependency.dependencyProduct.slug
        ) || [],
      }
    })
  }, [], 'getPaginatedProducts')
}

export async function getProductCount({ 
  category = null, 
  query = null,
  minPrice = null,
  maxPrice = null,
  availability = null,
  brands = null,
  iot = false,
  lowStock = false
} = {}) {
  const where = {
    ...(category ? { category: { slug: category } } : {}),
    ...(query ? {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
        { brand: { contains: query, mode: 'insensitive' } },
      ]
    } : {}),
    ...(minPrice || maxPrice ? {
      price: {
        ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
        ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
      }
    } : {}),
    ...(availability === 'in-stock' ? {
      inStock: true,
    } : {}),
    ...(availability === 'out-of-stock' ? {
      inStock: false,
    } : {}),
    ...(brands ? {
      brand: { in: brands.split(',') }
    } : {}),
    ...(iot ? {
      category: {
        OR: [
          { name: { contains: 'IoT', mode: 'insensitive' } },
          { name: { contains: 'Smart', mode: 'insensitive' } },
          { name: { contains: 'Sensor', mode: 'insensitive' } },
          { slug: { contains: 'iot', mode: 'insensitive' } },
        ]
      }
    } : {}),
    ...(lowStock ? {
      AND: [
        { trackInventory: true },
        { stockQuantity: { lte: prisma.product.fields.lowStockThreshold } }
      ]
    } : {})
  }

  return withCatalogFallback(() => prisma.product.count({ where }), 0, 'getProductCount')
}

export async function getProductByIdOrSlug(idOrSlug) {
  return withCatalogFallback(async () => {
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug }
        ]
      },
      include: {
        category: true,
        reviews: { select: { rating: true } },
        dependencies: {
          include: {
            dependencyProduct: {
              select: {
                id: true,
                slug: true,
                name: true,
                imageUrl: true,
                price: true,
                shortDescription: true,
              },
            },
          },
        },
      },
    })

    return product ? mapProduct(product) : null
  }, null, 'getProductByIdOrSlug')
}

export async function getRelatedProductsByCategory(categorySlug, excludeProductId, limit = 4) {
  if (!categorySlug) {
    return []
  }

  return withCatalogFallback(async () => {
    const products = await prisma.product.findMany({
      where: {
        category: { slug: categorySlug },
        id: excludeProductId ? { not: excludeProductId } : undefined,
        status: 'ACTIVE',
      },
      include: {
        category: true,
        reviews: { select: { rating: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    return products.map(mapProduct)
  }, [], 'getRelatedProductsByCategory')
}

export async function getAllCategories() {
  return withCatalogFallback(() => prisma.category.findMany({
    orderBy: {
      name: 'asc',
    },
  }), [], 'getAllCategories')
}

export async function getSearchSuggestions(query, limit = 8) {
  const normalizedQuery = `${query || ''}`.trim().toLowerCase()
  if (!normalizedQuery) {
    return []
  }

  return withCatalogFallback(async () => {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: normalizedQuery, mode: 'insensitive' } },
          { slug: { contains: normalizedQuery, mode: 'insensitive' } },
          { brand: { contains: normalizedQuery, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        brand: true,
        category: {
          select: {
            name: true,
          },
        },
      },
      take: Math.max(limit * 3, 12),
      orderBy: {
        name: 'asc',
      },
    })

    return products
      .map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        brand: product.brand || '',
        categoryName: product.category?.name || '',
      }))
      .sort((a, b) => {
        const aName = a.name.toLowerCase()
        const bName = b.name.toLowerCase()
        const aStarts = aName.startsWith(normalizedQuery) ? 0 : 1
        const bStarts = bName.startsWith(normalizedQuery) ? 0 : 1
        if (aStarts !== bStarts) return aStarts - bStarts

        const aWord = aName.split(/\s+/).some((word) => word.startsWith(normalizedQuery)) ? 0 : 1
        const bWord = bName.split(/\s+/).some((word) => word.startsWith(normalizedQuery)) ? 0 : 1
        if (aWord !== bWord) return aWord - bWord

        return aName.localeCompare(bName)
      })
      .slice(0, limit)
  }, [], 'getSearchSuggestions')
}

