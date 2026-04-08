import client from './client'
import type { ApiResponse, CashierReport, DailySalesReport, DashboardSummary, TopItemReport } from '../types'

const BASE = '/reports'

export const getDashboard = async () =>
  (await client.get<ApiResponse<DashboardSummary>>(`${BASE}/dashboard`)).data.data

export const getDailySales = async (from: string, to: string) =>
  (await client.get<ApiResponse<DailySalesReport[]>>(`${BASE}/sales/daily`, { params: { from, to } })).data.data

export const getTopItems = async (from: string, to: string, limit = 10) =>
  (await client.get<ApiResponse<TopItemReport[]>>(`${BASE}/items/top`, { params: { from, to, limit } })).data.data

export const getCashierReport = async (from: string, to: string) =>
  (await client.get<ApiResponse<CashierReport[]>>(`${BASE}/cashiers`, { params: { from, to } })).data.data
