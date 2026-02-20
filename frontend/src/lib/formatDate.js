export function formatDate(value) {
  if (!value) return '-'
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    const [datePart] = value.split('T')
    const [year, month, day] = datePart.split('-')
    return `${day}/${month}/${year}`
  }
  return value
}
