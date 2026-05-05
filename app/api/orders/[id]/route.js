import { handleGetOrderById, handleUpdateOrder } from '../orders-route'

export async function GET(request, { params }) {
  return handleGetOrderById(request, { params })
}

export async function PATCH(request, { params }) {
  return handleUpdateOrder(request, { params })
}
