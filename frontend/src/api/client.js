import axios from 'axios'
import { createLogger } from '@/lib/logger'

const logger = createLogger('API')

/**
 * Resolve API base URL:
 * - Production (HTTPS): always use the known production API endpoint
 * - Development (HTTP/localhost): use env var or localhost fallback
 */
function resolveBaseURL() {
  const protocol = window.location.protocol
  const hostname = window.location.hostname
  const envVar = import.meta.env.VITE_API_BASE_URL
  console.log('[API Config] protocol:', protocol, 'hostname:', hostname, 'VITE_API_BASE_URL:', envVar)
  if (protocol === 'https:') {
    const url = 'https://taskapi.iridescentiris.tech/api/v1'
    console.log('[API Config] Production detected, using:', url)
    return url
  }
  const url = envVar || 'http://localhost:8080/api/v1'
  console.log('[API Config] Development detected, using:', url)
  return url
}

export const API_BASE_URL = resolveBaseURL()
console.log('[API Config] Final API_BASE_URL:', API_BASE_URL)

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

/**
 * Request interceptor to add auth token and log requests
 */
apiClient.interceptors.request.use(
  async (config) => {
    console.log('[API Request]', config.method?.toUpperCase(), config.baseURL, config.url)
    logger.debug(`${config.method?.toUpperCase()} ${config.url}`)

    // Get Clerk token if available
    // This will be set up when ClerkProvider is available
    if (window.Clerk?.session) {
      try {
        const token = await window.Clerk.session.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch (err) {
        logger.warning('Failed to get auth token', err)
      }
    }

    return config
  },
  (error) => {
    logger.error('Request error', error)
    return Promise.reject(error)
  }
)

/**
 * Response interceptor to log responses and handle errors
 */
apiClient.interceptors.response.use(
  (response) => {
    logger.debug(`Response ${response.status} from ${response.config.url}`)
    return response
  },
  (error) => {
    const status = error.response?.status
    const url = error.config?.url

    if (status === 401) {
      logger.warning(`Unauthorized request to ${url}`)
    } else if (status === 404) {
      logger.warning(`Not found: ${url}`)
    } else if (status >= 500) {
      logger.error(`Server error ${status} from ${url}`, error.response?.data)
    } else {
      logger.error(`Request failed: ${url}`, error.message)
    }

    return Promise.reject(error)
  }
)

export default apiClient
