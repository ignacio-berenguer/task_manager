/**
 * Convert a SharePoint direct URL to an online viewer URL.
 *
 * Inserts the file-type code (e.g. :w: for Word) and appends ?web=1
 * so the document opens in the browser app instead of downloading.
 *
 * Example:
 *   https://tenant.sharepoint.com/sites/Site/Shared%20Documents/file.docx
 *   → https://tenant.sharepoint.com/:w:/r/sites/Site/Shared%20Documents/file.docx?web=1
 */
const EXT_MAP = {
  '.docx': ':w:',
  '.doc': ':w:',
  '.xlsx': ':x:',
  '.xls': ':x:',
  '.pptx': ':p:',
  '.ppt': ':p:',
  '.pdf': ':b:',
}

export function toSharePointOnlineUrl(directUrl) {
  if (!directUrl || !directUrl.includes('.sharepoint.com/')) return directUrl

  const [base, path] = directUrl.split('.sharepoint.com/', 2)
  if (!path) return directUrl

  const cleanPath = path.split('?')[0]
  const lastDot = cleanPath.lastIndexOf('.')
  const ext = lastDot >= 0 ? cleanPath.substring(lastDot).toLowerCase() : ''
  const code = EXT_MAP[ext] || ''

  return `${base}.sharepoint.com/${code}/r/${path}?web=1`
}
