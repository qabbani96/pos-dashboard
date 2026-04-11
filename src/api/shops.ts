import client from './client'
import type { Shop, ShopRequest, ShopStock, ShopStockAdjustRequest, ApiResponse, Page } from '../types'

// ── Shops ─────────────────────────────────────────────────────────────────────

export function getShops(activeOnly?: boolean): Promise<Shop[]> {
  const params: Record<string, string> = {}
  if (activeOnly !== undefined) params['activeOnly'] = String(activeOnly)
  return client
    .get<ApiResponse<Shop[]>>('/shops', { params })
    .then(r => r.data.data)
}

export function createShop(data: ShopRequest): Promise<Shop> {
  return client
    .post<ApiResponse<Shop>>('/shops', data)
    .then(r => r.data.data)
}

export function updateShop(id: number, data: ShopRequest): Promise<Shop> {
  return client
    .put<ApiResponse<Shop>>(`/shops/${id}`, data)
    .then(r => r.data.data)
}

export function activateShop(id: number): Promise<Shop> {
  return client
    .patch<ApiResponse<Shop>>(`/shops/${id}/activate`)
    .then(r => r.data.data)
}

export function deactivateShop(id: number): Promise<Shop> {
  return client
    .patch<ApiResponse<Shop>>(`/shops/${id}/deactivate`)
    .then(r => r.data.data)
}

export function deleteShop(id: number): Promise<void> {
  return client
    .delete<ApiResponse<void>>(`/shops/${id}`)
    .then(() => undefined)
}

// ── Shop Stock ────────────────────────────────────────────────────────────────

export function getShopStock(
  shopId: number,
  params?: { search?: string; lowStockOnly?: boolean; page?: number; size?: number }
): Promise<Page<ShopStock>> {
  return client
    .get<ApiResponse<Page<ShopStock>>>(`/shops/${shopId}/stock`, { params })
    .then(r => r.data.data)
}

export function adjustShopStock(
  shopId: number,
  itemId: number,
  data: ShopStockAdjustRequest
): Promise<ShopStock> {
  return client
    .patch<ApiResponse<ShopStock>>(`/shops/${shopId}/stock/${itemId}/adjust`, data)
    .then(r => r.data.data)
}
