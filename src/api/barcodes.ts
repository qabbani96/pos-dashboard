import client from './client'
import type { ApiResponse, Item } from '../types'

const BASE = '/barcodes'

export const generateBarcode = async (itemId: number) =>
  (await client.post<ApiResponse<Item>>(`${BASE}/item/${itemId}/generate`)).data.data

export const getBarcodeImageUrl = (itemId: number) =>
  `/api/v1/barcodes/item/${itemId}/image`

export const getBarcodePdfUrl = (itemId: number) =>
  `/api/v1/barcodes/item/${itemId}/pdf`
