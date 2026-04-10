import api from './client'
import type { Customer, Invoice, ApiResponse, Page } from '../types'

/** Look up a customer by phone number. Returns null if not found. */
export async function findCustomerByPhone(phone: string): Promise<Customer | null> {
  const { data } = await api.get<ApiResponse<Customer | null>>(
    `/customers/phone/${encodeURIComponent(phone)}`
  )
  return data.data
}

/** Paginated customer list with optional LIKE search on name or phone. */
export async function getCustomers(params: {
  search?: string
  page?:   number
  size?:   number
}): Promise<Page<Customer>> {
  const { data } = await api.get<ApiResponse<Page<Customer>>>('/customers', {
    params: {
      search: params.search || undefined,
      page:   params.page  ?? 0,
      size:   params.size  ?? 20,
    },
  })
  return data.data
}

/** All invoices for a specific customer, newest first. */
export async function getCustomerInvoices(
  customerId: number,
  params: { page?: number; size?: number } = {}
): Promise<Page<Invoice>> {
  const { data } = await api.get<ApiResponse<Page<Invoice>>>(
    `/customers/${customerId}/invoices`,
    { params: { page: params.page ?? 0, size: params.size ?? 50 } }
  )
  return data.data
}
