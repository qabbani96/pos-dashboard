import api from './client'
import type { AppUser, CreateUserRequest, UpdateUserRequest } from '../types'

const BASE = '/users'

export const getUsers = async (): Promise<AppUser[]> => {
  const res = await api.get(BASE)
  return res.data.data
}

export const getUserById = async (id: number): Promise<AppUser> => {
  const res = await api.get(`${BASE}/${id}`)
  return res.data.data
}

export const createUser = async (payload: CreateUserRequest): Promise<AppUser> => {
  const res = await api.post(BASE, payload)
  return res.data.data
}

export const updateUser = async (id: number, payload: UpdateUserRequest): Promise<AppUser> => {
  const res = await api.put(`${BASE}/${id}`, payload)
  return res.data.data
}

export const activateUser = async (id: number): Promise<AppUser> => {
  const res = await api.patch(`${BASE}/${id}/activate`)
  return res.data.data
}

export const deactivateUser = async (id: number): Promise<AppUser> => {
  const res = await api.patch(`${BASE}/${id}/deactivate`)
  return res.data.data
}

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`${BASE}/${id}`)
}
