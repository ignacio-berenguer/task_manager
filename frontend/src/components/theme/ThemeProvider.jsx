import { ThemeProvider as NextThemesProvider } from 'next-themes'

/**
 * Theme provider wrapper for dark/light mode support
 */
export function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      storageKey="portfolio-theme"
    >
      {children}
    </NextThemesProvider>
  )
}
