import client from './client'
import type { ApiResponse, LoginRequest, LoginResponse } from '../types'

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const res = await client.post<ApiResponse<LoginResponse>>('/auth/login', data)
  return res.data.data
}
