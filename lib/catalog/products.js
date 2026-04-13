import { prisma } from '@/lib/database/nexus-db'

const productPresentation = {
  'uno-r4-creator-board': {
    family: 'Arduino',
    originalPrice: 1799,
    badge: 'Featured',
    badgeTone: 'amber',
    rating: 4.9,
    reviews: 214,
    shortSpec: 'Wi-Fi, HID support, 12-bit DAC',
    accent: 'from-[#1f4fff] via-[#295dff] to-[#38bdf8]',
    surface: 'bg-[#eef4ff]',
  },
  'pi-vision-starter-kit': {
    family: 'Raspberry Pi',
    originalPrice: 8999,
    badge: 'New',
    badgeTone: 'emerald',
    rating: 4.8,
    reviews: 96,
    shortSpec: 'Pi 5 bundle, camera, cooling, case',
    accent: 'from-[#134e4a] via-[#0f766e] to-[#22c55e]',
    surface: 'bg-[#ecfdf5]',
  },
  'esp32-mesh-node-pack': {
    family: 'IoT',
    originalPrice: 899,
    badge: 'Hot',
    badgeTone: 'rose',
    rating: 4.7,
    reviews: 318,
    shortSpec: 'Dual-core MCU, BLE, Wi-Fi, USB-C',
    accent: 'from-[#9f1239] via-[#e11d48] to-[#fb7185]',
    surface: 'bg-[#fff1f2]',
  },
  'mini-lidar-range-module': {
    family: 'Sensors',
    originalPrice: 2699,
    badge: 'Pro',
    badgeTone: 'slate',
    rating: 4.6,
    reviews: 73,
    shortSpec: '12 m range, UART, compact housing',
    accent: 'from-[#0f172a] via-[#1e293b] to-[#475569]',
    surface: 'bg-[#f8fafc]',
  },
  'robotics-launchpad-kit': {
    family: 'Education',
    originalPrice: 3999,
    badge: 'Best Seller',
    badgeTone: 'violet',
    rating: 4.9,
    reviews: 441,
    shortSpec: 'Chassis, motors, sensors, lessons',
    accent: 'from-[#4c1d95] via-[#7c3aed] to-[#c084fc]',
    surface: 'bg-[#f5f3ff]',
  },
  'precision-servo-trio': {
    family: 'Motion',
    originalPrice: 1099,
    badge: 'Bundle',
    badgeTone: 'sky',
    rating: 4.5,
    reviews: 188,
    shortSpec: 'Metal gear, 180 degree, high torque',
    accent: 'from-[#0f172a] via-[#0369a1] to-[#38bdf8]',
    surface: 'bg-[#f0f9ff]',
  },
  'esp32-development-board': {
    family: 'ESP32',
    originalPrice: 499,
    badge: 'Hot',
    badgeTone: 'rose',
    rating: 4.8,
    reviews: 286,
    shortSpec: 'Wi-Fi, BLE, dual-core MCU',
    accent: 'from-[#7f1d1d] via-[#be123c] to-[#fb7185]',
    surface: 'bg-[#fff1f2]',
  },
  'raspberry-pi-5-8gb': {
    family: 'Raspberry Pi',
    originalPrice: 9499,
    badge: 'Popular',
    badgeTone: 'emerald',
    rating: 4.9,
    reviews: 164,
    shortSpec: '8GB RAM, PCIe, fast SBC',
    accent: 'from-[#14532d] via-[#16a34a] to-[#4ade80]',
    surface: 'bg-[#f0fdf4]',
  },
  'camera-module-3-wide': {
    family: 'Vision',
    originalPrice: 3299,
    badge: 'New',
    badgeTone: 'sky',
    rating: 4.7,
    reviews: 88,
    shortSpec: '12MP autofocus, wide FoV',
    accent: 'from-[#0f172a] via-[#1d4ed8] to-[#60a5fa]',
    surface: 'bg-[#eff6ff]',
  },
  'sensor-discovery-kit': {
    family: 'Sensors',
    originalPrice: 1999,
    badge: 'Best Seller',
    badgeTone: 'violet',
    rating: 4.8,
    reviews: 205,
    shortSpec: 'Multi-sensor learning kit',
    accent: 'from-[#581c87] via-[#7e22ce] to-[#c084fc]',
    surface: 'bg-[#faf5ff]',
  },
}

function titleToSpec(name) {
  return name
    .split(' ')
    .slice(0, 4)
    .join(' ')
}

function mapProduct(product) {
  const metadataPresentation =
    product.metadata &&
    typeof product.metadata === 'object' &&
    !Array.isArray(product.metadata) &&
    product.metadata.presentation &&
    typeof product.metadata.presentation === 'object'
      ? product.metadata.presentation
      : {}

  const presentation = {
    ...(productPresentation[product.slug] || {}),
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

export async function getProductBySlug(slug) {
  const product = await prisma.product.findUnique({
    where: { slug },
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

