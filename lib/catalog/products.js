import { prisma } from '@/lib/database/nexus-db'

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
    details: presentation.details || [
      { title: 'Technical Specifications', content: product.shortDescription || 'Core hardware specs and pinouts' },
      { title: 'Usage & Setup Guide', content: 'Connect to power via USB-C or VIN and initialize via the IDE.' },
      { title: 'Feature Highlights', content: 'Engineered for high-performance embedded workloads.' }
    ]
  }
}

export async function getAllProducts() {
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
}

export async function getPaginatedProducts({ 
  page = 1, 
  limit = 12, 
  category = null, 
  query = null, 
  sort = 'newest' ,
  minPrice = null,
  maxPrice = null,
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

  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      reviews: { select: { rating: true } },
      dependencies: {
        include: {
          dependencyProduct: {
            select: {
              sku: true,
              slug: true,
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
    
    // Add admin-specific fields if requested
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
}

export async function getProductCount({ 
  category = null, 
  query = null,
  minPrice = null,
  maxPrice = null,
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

  return prisma.product.count({ where })
}

export async function getProductByIdOrSlug(idOrSlug) {
  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { id: idOrSlug },
        { slug: idOrSlug }
      ]
    },
    include: {
      category: true,
      reviews: { select: { rating: true } }
    },
  })

  return product ? mapProduct(product) : null
}

export async function getAllCategories() {
  return prisma.category.findMany({
    orderBy: {
      name: 'asc',
    },
  })
}

