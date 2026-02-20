import { useEffect } from 'react'

const APP_NAME = 'Portfolio Digital'

/**
 * Set the document title for the current page.
 * @param {string} [title] - Page-specific title prefix. If omitted, shows just APP_NAME.
 */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} - ${APP_NAME}` : APP_NAME
  }, [title])
}
