import api from './client'
import type { Branch, BranchRequest } from '../types'

const BASE = '/branches'

export const getBranches = async (): Promise<Branch[]> => {
  const res = await api.get(BASE)
  return res.data.data
}

export const getBranchById = async (id: number): Promise<Branch> => {
  const res = await api.get(`${BASE}/${id}`)
  return res.data.data
}

export const createBranch = async (payload: BranchRequest): Promise<Branch> => {
  const res = await api.post(BASE, payload)
  return res.data.data
}

export const updateBranch = async (id: number, payload: BranchRequest): Promise<Branch> => {
  const res = await api.put(`${BASE}/${id}`, payload)
  return res.data.data
}

export const deleteBranch = async (id: number): Promise<void> => {
  await api.delete(`${BASE}/${id}`)
}
