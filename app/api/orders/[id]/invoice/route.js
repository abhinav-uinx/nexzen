import { getPrismaClient } from '@/lib/database/nexus-db'
import { getAppUserForRequest } from '@/lib/auth/user-session'
import { buildInvoicePdf } from '@/lib/commerce/invoice'

export async function GET(request, { params }) {
  try {
    const { appUser } = await getAppUserForRequest(request)
    if (!appUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const prisma = getPrismaClient()
    const order = await prisma.order.findFirst({
      where: {
        id,
        userId: appUser.id,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 })
    }

    const pdf = buildInvoicePdf(order)
    return new Response(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${order.id.slice(-8)}.pdf"`,
      },
    })
  } catch {
    return Response.json({ error: 'Could not generate invoice.' }, { status: 500 })
  }
}
