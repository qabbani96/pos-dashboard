import axios from 'axios'
import toast from 'react-hot-toast'

const client = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT on every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global error handling
client.interceptors.response.use(
  (res) => res,
  (error) => {
    const status  = error.response?.status
    const message = error.response?.data?.message ?? 'An unexpected error occurred'

    if (status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    if (status !== 404) toast.error(message)
    return Promise.reject(error)
  }
)

export default client
