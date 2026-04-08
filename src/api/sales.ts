import client from './client'
import type { ApiResponse, Page, Sale } from '../types'

const BASE = '/sales'

export interface SalesParams {
  cashierId?: number; from?: string; to?: string
  status?: 'COMPLETED' | 'REFUNDED'
  page?: number; size?: number
}

export const getSales = async (params: SalesParams = {}) =>
  (await client.get<ApiResponse<Page<Sale>>>(BASE, { params: { page: 0, size: 20, ...params } })).data.data

export const getSaleById = async (id: number) =>
  (await client.get<ApiResponse<Sale>>(`${BASE}/${id}`)).data.data
