import { prisma } from '@/lib/database/nexus-db'

export async function handleHealthCheck() {
  const productCount = await prisma.product.count()

  return Response.json({
    ok: true,
    productCount,
  })
}

