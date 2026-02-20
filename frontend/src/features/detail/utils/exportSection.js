import { formatValue } from '../components/SimpleTable'

/**
 * Escape a CSV field value (handles semicolons, quotes, newlines)
 */
function escapeCSV(value) {
  const str = String(value)
  if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Export section data as a CSV file download.
 *
 * @param {Array<Object>} data - Array of row objects
 * @param {Array<{key: string, label: string, type?: string}>} columns - Column definitions
 * @param {string} filename - Download filename (e.g., "Hechos_SPA_25_001.csv")
 */
export function exportSectionCSV(data, columns, filename) {
  if (!data || data.length === 0) return

  const separator = ';'

  // Header row
  const header = columns.map((col) => escapeCSV(col.label)).join(separator)

  // Data rows
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const raw = row[col.key]
        const formatted = formatValue(raw, col.type)
        return escapeCSV(formatted)
      })
      .join(separator)
  )

  // Build CSV with UTF-8 BOM for Excel compatibility
  const bom = '\uFEFF'
  const csv = bom + [header, ...rows].join('\n')

  // Trigger download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
