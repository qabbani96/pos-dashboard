import api from './client'
import type { Invoice, InvoiceRequest, Page } from '../types'

const BASE = '/invoices'

export const getInvoices = async (params?: {
  branchId?: number
  status?:   string
  search?:   string
  page?:     number
  size?:     number
}): Promise<Page<Invoice>> => {
  const res = await api.get(BASE, { params })
  return res.data.data
}

export const getInvoiceById = async (id: number): Promise<Invoice> => {
  const res = await api.get(`${BASE}/${id}`)
  return res.data.data
}

export const createInvoice = async (payload: InvoiceRequest): Promise<Invoice> => {
  const res = await api.post(BASE, payload)
  return res.data.data
}

export const updateInvoice = async (id: number, payload: InvoiceRequest): Promise<Invoice> => {
  const res = await api.put(`${BASE}/${id}`, payload)
  return res.data.data
}

export const deleteInvoice = async (id: number): Promise<void> => {
  await api.delete(`${BASE}/${id}`)
}

export interface BranchLine {
  branchId:     number
  branchName:   string
  totalAmount:  number
  invoiceCount: number
}

export interface MoneySummary {
  totalAmount:  number
  invoiceCount: number
  breakdown:    BranchLine[]
}

export const getMoneySummary = async (params: {
  branchId?: number
  status?:   string
}): Promise<MoneySummary> => {
  const res = await api.get(`${BASE}/money`, { params })
  return res.data.data
}
