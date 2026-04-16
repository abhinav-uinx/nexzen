const { PrismaClient } = require('./generated/client')
const prisma = new PrismaClient()

async function main() {
  console.log('--- Brand Migration Start ---')
  
  // 1. Get all products with a brand string
  const products = await prisma.product.findMany({
    where: { 
      brand: { not: null },
      brandId: null 
    },
    select: { id: true, brand: true }
  })

  console.log(`Found ${products.length} products to migrate.`)

  const uniqueBrands = [...new Set(products.map(p => p.brand.trim()))]
  console.log(`Identified ${uniqueBrands.length} unique brands.`)

  // 2. Create Brand records
  for (const brandName of uniqueBrands) {
    const slug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    
    await prisma.brand.upsert({
      where: { name: brandName },
      update: {},
      create: {
        name: brandName,
        slug: slug,
      }
    })
    console.log(`Verified Brand: ${brandName}`)
  }

  // 3. Link products to brands
  const allBrands = await prisma.brand.findMany()
  const brandMap = new Map(allBrands.map(b => [b.name, b.id]))

  for (const product of products) {
    const brandId = brandMap.get(product.brand.trim())
    if (brandId) {
      await prisma.product.update({
        where: { id: product.id },
        data: { brandId: brandId }
      })
    }
  }

  console.log('--- Brand Migration Complete ---')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
