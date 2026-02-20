import { useState, useRef, useEffect } from 'react'
import { Palette, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { THEMES } from '@/lib/themes'
import { useColorTheme } from './ColorThemeProvider'

/** Primary color swatch for a theme (extracts HSL from light colors) */
function ThemeSwatch({ theme }) {
  const color = theme.colors.light?.['--color-primary'] || 'hsl(220 80% 50%)'
  return (
    <span
      className="inline-block h-3.5 w-3.5 rounded-full border border-border/50 shrink-0"
      style={{ backgroundColor: color }}
    />
  )
}

export function ColorThemeSelector() {
  const { colorTheme, setColorTheme } = useColorTheme()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center justify-center rounded-md p-2',
          'text-muted-foreground hover:text-foreground',
          'hover:bg-accent focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-ring focus-visible:ring-offset-2'
        )}
        aria-label="Seleccionar tema de color"
      >
        <Palette className="h-5 w-5" />
        <span className="sr-only">Seleccionar tema de color</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-md border bg-popover p-1 shadow-md">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => {
                setColorTheme(theme.id)
                setIsOpen(false)
              }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm',
                'hover:bg-accent hover:text-accent-foreground',
                colorTheme === theme.id && 'bg-accent'
              )}
            >
              <ThemeSwatch theme={theme} />
              <div className="flex flex-col items-start min-w-0">
                <span className="font-medium truncate">
                  {theme.name}
                </span>
                {theme.isHighContrast && (
                  <span className="text-[10px] leading-tight text-muted-foreground">
                    Alto contraste
                  </span>
                )}
              </div>
              {colorTheme === theme.id && (
                <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
