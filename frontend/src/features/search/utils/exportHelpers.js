import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import { getColumnDef, formatCellValue, COLUMN_TYPES } from './columnDefinitions'

/**
 * Generate filename with timestamp
 */
export function generateFilename(extension) {
  const now = new Date()
  const timestamp = now.toISOString().replace(/[:-]/g, '').slice(0, 15)
  return `iniciativas_export_${timestamp}.${extension}`
}

/**
 * Prepare data for export (apply column selection and formatting)
 */
function prepareExportData(data, columns, formatted = true) {
  return data.map((row) => {
    const exportRow = {}
    columns.forEach((colId) => {
      const colDef = getColumnDef(colId)
      const value = row[colId]
      exportRow[colDef.label] = formatted ? formatCellValue(value, colDef.type) : value
    })
    return exportRow
  })
}

/**
 * Export data to TSV (Tab-Separated Values)
 */
export function exportToTSV(data, columns) {
  console.log('[exportToTSV] Starting TSV export')
  const preparedData = prepareExportData(data, columns)
  const headers = columns.map((colId) => getColumnDef(colId).label)
  console.log('[exportToTSV] Headers:', headers)

  const lines = [
    headers.join('\t'),
    ...preparedData.map((row) => headers.map((h) => row[h] ?? '').join('\t')),
  ]

  const content = lines.join('\n')
  console.log('[exportToTSV] Content length:', content.length)
  const blob = new Blob([content], { type: 'text/tab-separated-values;charset=utf-8' })
  const filename = generateFilename('tsv')
  console.log('[exportToTSV] Saving file:', filename)
  saveAs(blob, filename)
  console.log('[exportToTSV] saveAs called')
}

/**
 * Export data to CSV
 */
export function exportToCSV(data, columns) {
  const preparedData = prepareExportData(data, columns)
  const headers = columns.map((colId) => getColumnDef(colId).label)

  // Escape values that contain commas, quotes, or newlines
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const lines = [
    headers.map(escapeCSV).join(','),
    ...preparedData.map((row) => headers.map((h) => escapeCSV(row[h])).join(',')),
  ]

  const content = lines.join('\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  saveAs(blob, generateFilename('csv'))
}

/**
 * Export data to JSON
 */
export function exportToJSON(data, columns) {
  const preparedData = prepareExportData(data, columns, false) // Keep original values
  const content = JSON.stringify(preparedData, null, 2)
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
  saveAs(blob, generateFilename('json'))
}

/**
 * Export data to Excel (XLSX)
 */
export function exportToExcel(data, columns) {
  const preparedData = prepareExportData(data, columns, false) // Keep raw values for Excel
  const headers = columns.map((colId) => getColumnDef(colId).label)

  // Create worksheet data with headers
  const wsData = [
    headers,
    ...preparedData.map((row) => headers.map((h) => row[h] ?? '')),
  ]

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Set column widths
  const colWidths = headers.map((h) => ({ wch: Math.max(h.length, 12) }))
  ws['!cols'] = colWidths

  // Style header row (bold)
  const range = XLSX.utils.decode_range(ws['!ref'])
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
    if (!ws[cellAddress]) continue
    ws[cellAddress].s = { font: { bold: true } }
  }

  // Format currency columns
  columns.forEach((colId, index) => {
    const colDef = getColumnDef(colId)
    if (colDef.type === COLUMN_TYPES.CURRENCY) {
      for (let row = 1; row <= range.e.r; row++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: index })
        if (ws[cellAddress] && typeof ws[cellAddress].v === 'number') {
          ws[cellAddress].t = 'n'
          ws[cellAddress].z = '#,##0'
        }
      }
    }
  })

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Iniciativas')

  // Generate and save file
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, generateFilename('xlsx'))
}

/**
 * Export to specified format
 */
export function exportData(format, data, columns) {
  console.log('[exportData] Starting export:', { format, dataLength: data?.length, columnsLength: columns?.length })

  if (!data || data.length === 0) {
    console.warn('[exportData] No data to export')
    return
  }

  if (!columns || columns.length === 0) {
    console.warn('[exportData] No columns selected for export')
    return
  }

  try {
    switch (format) {
      case 'tsv':
        return exportToTSV(data, columns)
      case 'csv':
        return exportToCSV(data, columns)
      case 'json':
        return exportToJSON(data, columns)
      case 'xlsx':
      case 'excel':
        return exportToExcel(data, columns)
      default:
        throw new Error(`Unknown export format: ${format}`)
    }
  } catch (error) {
    console.error('[exportData] Export failed:', error)
    throw error
  }
}
