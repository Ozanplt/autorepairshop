import axios from 'axios'

let _accessToken: string | null = null

export function setAccessToken(token: string | null) {
  _accessToken = token
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
})

apiClient.interceptors.request.use(
  (config) => {
    if (_accessToken) {
      config.headers.Authorization = `Bearer ${_accessToken}`
    }
    
    config.headers['X-Request-Id'] = crypto.randomUUID()
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login'
    }
    
    const errorResponse = error.response?.data || {
      errorCode: 'ERR_INTERNAL',
      message: 'An unexpected error occurred'
    }
    
    return Promise.reject(errorResponse)
  }
)

export default apiClient
