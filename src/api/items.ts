import client from './client'
import type { ApiResponse, Item, ItemRequest, Page } from '../types'

const BASE = '/items'

export interface ItemsParams {
  search?: string; categoryId?: number; activeOnly?: boolean; page?: number; size?: number
}

export const getItems = async (params: ItemsParams = {}) =>
  (await client.get<ApiResponse<Page<Item>>>(BASE, {
    params: { activeOnly: true, page: 0, size: 20, ...params },
  })).data.data

export const getItemById = async (id: number) =>
  (await client.get<ApiResponse<Item>>(`${BASE}/${id}`)).data.data

export const createItem = async (data: ItemRequest) =>
  (await client.post<ApiResponse<Item>>(BASE, data)).data.data

export const updateItem = async (id: number, data: ItemRequest) =>
  (await client.put<ApiResponse<Item>>(`${BASE}/${id}`, data)).data.data

export const deactivateItem = async (id: number) =>
  client.patch(`${BASE}/${id}/deactivate`)

export const activateItem = async (id: number) =>
  client.patch(`${BASE}/${id}/activate`)
