/**
 * Color theme definitions for Portfolio Digital.
 *
 * Each theme defines CSS custom-property overrides for light and dark modes.
 * The "default" theme uses empty overrides (base CSS variables apply).
 * High-contrast themes additionally tint accent/secondary/muted surfaces.
 */

export const THEMES = [
  {
    id: 'default',
    name: 'Clásico',
    description: 'Tema azul por defecto',
    isHighContrast: false,
    // No overrides — uses base CSS variables from index.css
    colors: { light: {}, dark: {} },
  },
  {
    id: 'slate',
    name: 'Pizarra',
    description: 'Gris azulado, profesional',
    isHighContrast: false,
    colors: {
      light: {
        '--color-primary': 'hsl(215 20% 40%)',
        '--color-primary-foreground': 'hsl(0 0% 100%)',
        '--color-ring': 'hsl(215 20% 40%)',
        '--color-chart-0': 'hsl(215 20% 40%)',
      },
      dark: {
        '--color-primary': 'hsl(215 25% 60%)',
        '--color-primary-foreground': 'hsl(225 20% 7%)',
        '--color-ring': 'hsl(215 25% 60%)',
        '--color-chart-0': 'hsl(215 25% 60%)',
      },
    },
  },
  {
    id: 'emerald',
    name: 'Esmeralda',
    description: 'Alto contraste — verde intenso',
    isHighContrast: true,
    colors: {
      light: {
        '--color-primary': 'hsl(160 84% 36%)',
        '--color-primary-foreground': 'hsl(0 0% 100%)',
        '--color-ring': 'hsl(160 84% 36%)',
        '--color-chart-0': 'hsl(160 84% 36%)',
        '--color-accent': 'hsl(160 40% 92%)',
        '--color-accent-foreground': 'hsl(160 84% 20%)',
        '--color-secondary': 'hsl(160 20% 94%)',
        '--color-secondary-foreground': 'hsl(160 50% 18%)',
      },
      dark: {
        '--color-primary': 'hsl(160 84% 45%)',
        '--color-primary-foreground': 'hsl(225 20% 7%)',
        '--color-ring': 'hsl(160 84% 45%)',
        '--color-chart-0': 'hsl(160 84% 45%)',
        '--color-accent': 'hsl(160 30% 15%)',
        '--color-accent-foreground': 'hsl(160 84% 70%)',
        '--color-secondary': 'hsl(160 15% 14%)',
        '--color-secondary-foreground': 'hsl(160 50% 75%)',
      },
    },
  },
  {
    id: 'amber',
    name: 'Ámbar',
    description: 'Alto contraste — naranja cálido',
    isHighContrast: true,
    colors: {
      light: {
        '--color-primary': 'hsl(38 92% 45%)',
        '--color-primary-foreground': 'hsl(0 0% 100%)',
        '--color-ring': 'hsl(38 92% 45%)',
        '--color-chart-0': 'hsl(38 92% 45%)',
        '--color-accent': 'hsl(38 50% 92%)',
        '--color-accent-foreground': 'hsl(38 92% 22%)',
        '--color-secondary': 'hsl(38 25% 94%)',
        '--color-secondary-foreground': 'hsl(38 60% 20%)',
      },
      dark: {
        '--color-primary': 'hsl(38 92% 55%)',
        '--color-primary-foreground': 'hsl(225 20% 7%)',
        '--color-ring': 'hsl(38 92% 55%)',
        '--color-chart-0': 'hsl(38 92% 55%)',
        '--color-accent': 'hsl(38 35% 15%)',
        '--color-accent-foreground': 'hsl(38 92% 75%)',
        '--color-secondary': 'hsl(38 20% 14%)',
        '--color-secondary-foreground': 'hsl(38 60% 75%)',
      },
    },
  },
  {
    id: 'rose',
    name: 'Rosa',
    description: 'Alto contraste — rosa intenso',
    isHighContrast: true,
    colors: {
      light: {
        '--color-primary': 'hsl(350 85% 50%)',
        '--color-primary-foreground': 'hsl(0 0% 100%)',
        '--color-ring': 'hsl(350 85% 50%)',
        '--color-chart-0': 'hsl(350 85% 50%)',
        '--color-accent': 'hsl(350 45% 93%)',
        '--color-accent-foreground': 'hsl(350 85% 28%)',
        '--color-secondary': 'hsl(350 22% 95%)',
        '--color-secondary-foreground': 'hsl(350 55% 22%)',
      },
      dark: {
        '--color-primary': 'hsl(350 89% 60%)',
        '--color-primary-foreground': 'hsl(225 20% 7%)',
        '--color-ring': 'hsl(350 89% 60%)',
        '--color-chart-0': 'hsl(350 89% 60%)',
        '--color-accent': 'hsl(350 30% 15%)',
        '--color-accent-foreground': 'hsl(350 89% 75%)',
        '--color-secondary': 'hsl(350 18% 14%)',
        '--color-secondary-foreground': 'hsl(350 55% 75%)',
      },
    },
  },
  {
    id: 'violet',
    name: 'Violeta',
    description: 'Alto contraste — púrpura vibrante',
    isHighContrast: true,
    colors: {
      light: {
        '--color-primary': 'hsl(270 70% 50%)',
        '--color-primary-foreground': 'hsl(0 0% 100%)',
        '--color-ring': 'hsl(270 70% 50%)',
        '--color-chart-0': 'hsl(270 70% 50%)',
        '--color-accent': 'hsl(270 40% 93%)',
        '--color-accent-foreground': 'hsl(270 70% 28%)',
        '--color-secondary': 'hsl(270 20% 95%)',
        '--color-secondary-foreground': 'hsl(270 50% 22%)',
      },
      dark: {
        '--color-primary': 'hsl(270 76% 60%)',
        '--color-primary-foreground': 'hsl(225 20% 7%)',
        '--color-ring': 'hsl(270 76% 60%)',
        '--color-chart-0': 'hsl(270 76% 60%)',
        '--color-accent': 'hsl(270 30% 15%)',
        '--color-accent-foreground': 'hsl(270 76% 75%)',
        '--color-secondary': 'hsl(270 18% 14%)',
        '--color-secondary-foreground': 'hsl(270 50% 75%)',
      },
    },
  },
]

/** Valid theme IDs */
export const THEME_IDS = THEMES.map((t) => t.id)

/** Default theme ID */
export const DEFAULT_THEME_ID = 'default'
