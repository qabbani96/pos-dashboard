import client from './client'
import type {
  StockTransfer, StockTransferRequest,
  StockReturn, StockReturnRequest,
  Page, ApiResponse, TransferStatus
} from '../types'

// ── Stock Transfers ───────────────────────────────────────────────────────────

export function getTransfers(params?: {
  shopId?: number
  status?: TransferStatus
  page?: number
  size?: number
}): Promise<Page<StockTransfer>> {
  return client
    .get<ApiResponse<Page<StockTransfer>>>('/stock-transfers', { params })
    .then(r => r.data.data)
}

export function createTransfer(data: StockTransferRequest): Promise<StockTransfer> {
  return client
    .post<ApiResponse<StockTransfer>>('/stock-transfers', data)
    .then(r => r.data.data)
}

export function completeTransfer(id: number): Promise<StockTransfer> {
  return client
    .post<ApiResponse<StockTransfer>>(`/stock-transfers/${id}/complete`)
    .then(r => r.data.data)
}

export function cancelTransfer(id: number): Promise<StockTransfer> {
  return client
    .post<ApiResponse<StockTransfer>>(`/stock-transfers/${id}/cancel`)
    .then(r => r.data.data)
}

// ── Stock Returns ─────────────────────────────────────────────────────────────

export function getReturns(params?: {
  shopId?: number
  status?: TransferStatus
  page?: number
  size?: number
}): Promise<Page<StockReturn>> {
  return client
    .get<ApiResponse<Page<StockReturn>>>('/stock-returns', { params })
    .then(r => r.data.data)
}

export function createReturn(data: StockReturnRequest): Promise<StockReturn> {
  return client
    .post<ApiResponse<StockReturn>>('/stock-returns', data)
    .then(r => r.data.data)
}

export function completeReturn(id: number): Promise<StockReturn> {
  return client
    .post<ApiResponse<StockReturn>>(`/stock-returns/${id}/complete`)
    .then(r => r.data.data)
}

export function cancelReturn(id: number): Promise<StockReturn> {
  return client
    .post<ApiResponse<StockReturn>>(`/stock-returns/${id}/cancel`)
    .then(r => r.data.data)
}
