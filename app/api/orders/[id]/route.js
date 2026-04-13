import { handleGetOrderById } from '../orders-route'

export async function GET(request, { params }) {
  return handleGetOrderById(request, { params })
}
