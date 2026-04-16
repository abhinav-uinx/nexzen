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

