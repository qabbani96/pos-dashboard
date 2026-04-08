import client from './client'
import type { ApiResponse, Category, CategoryRequest } from '../types'

const BASE = '/categories'

// ── Flat list (all categories, sorted by level then name) ─────────────────────
// Used for dropdowns — returns every node without children populated.
export const getCategories = async () =>
  (await client.get<ApiResponse<Category[]>>(BASE)).data.data

// ── Tree (full hierarchy, children populated recursively) ─────────────────────
// Used for the Categories page tree view.
export const getCategoriesTree = async () =>
  (await client.get<ApiResponse<Category[]>>(`${BASE}/tree`)).data.data

// ── Root categories only (level 0 — Brands) ──────────────────────────────────
export const getRootCategories = async () =>
  (await client.get<ApiResponse<Category[]>>(`${BASE}/roots`)).data.data

// ── Direct children of a given parent ────────────────────────────────────────
export const getCategoryChildren = async (parentId: number) =>
  (await client.get<ApiResponse<Category[]>>(`${BASE}/${parentId}/children`)).data.data

// ── CRUD ──────────────────────────────────────────────────────────────────────
export const createCategory = async (data: CategoryRequest) =>
  (await client.post<ApiResponse<Category>>(BASE, data)).data.data

export const updateCategory = async (id: number, data: CategoryRequest) =>
  (await client.put<ApiResponse<Category>>(`${BASE}/${id}`, data)).data.data

export const deleteCategory = async (id: number) =>
  client.delete(`${BASE}/${id}`)
