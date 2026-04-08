import client from './client'
import type { ApiResponse, Page, StockAdjustRequest, StockMovement, StockRecord, StockSummary } from '../types'

const BASE = '/stock'

export const getStock = async (params: { lowStockOnly?: boolean; page?: number; size?: number } = {}) =>
  (await client.get<ApiResponse<Page<StockRecord>>>(BASE, { params })).data.data

export const getStockSummary = async () =>
  (await client.get<ApiResponse<StockSummary>>(`${BASE}/summary`)).data.data

export const getStockByItem = async (itemId: number) =>
  (await client.get<ApiResponse<StockRecord>>(`${BASE}/item/${itemId}`)).data.data

export const adjustStock = async (itemId: number, data: StockAdjustRequest) =>
  (await client.post<ApiResponse<StockRecord>>(`${BASE}/item/${itemId}/adjust`, data)).data.data

export const updateMinQuantity = async (itemId: number, minQuantity: number) =>
  (await client.patch<ApiResponse<StockRecord>>(
    `${BASE}/item/${itemId}/min-quantity`, null, { params: { minQuantity } }
  )).data.data

export const getMovements = async (itemId: number, page = 0) =>
  (await client.get<ApiResponse<Page<StockMovement>>>(
    `${BASE}/item/${itemId}/movements`, { params: { page, size: 20 } }
  )).data.data
