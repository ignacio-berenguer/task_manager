import apiClient from './client'
import { createLogger } from '@/lib/logger'

const logger = createLogger('Admin')

/**
 * Export the entire database as a JSON file download.
 */
export async function exportDatabase() {
  logger.info('Starting database export')

  const response = await apiClient.get('/admin/export')

  const json = JSON.stringify(response.data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })

  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  const filename = `task_manager_export_${timestamp}.json`

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  logger.info(`Database exported as ${filename}`)
}
