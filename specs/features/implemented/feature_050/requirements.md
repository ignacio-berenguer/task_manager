# Requirements Prompt for feature_050

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_050/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_050/plan.md' in order to do that.

## Feature Brief

Improvements to UI. (1) Provide different color themes to be selected by the user from a menu (near dark/light mode toggle). Some of the color themes should be "high contrast", in which the section titles, accordion, buttons, etc. are shown in vivid colors. The current theme should be one of them. (2) The following sections of Detail page should be collapsed by default: Beneficios, Etiquetas, WBEs, Transacciones, Transacciones JSON. (3) Some of the words in the frontend are still in English... review the UI and change from English to Spanish, and review the Spanish so that it is properly accented.

## User Story

As a user, I want to personalize the visual appearance of the application by choosing from multiple color themes (including high-contrast options), have certain Detail page sections collapsed by default to reduce clutter, and see the entire UI consistently in properly accented Spanish.

## Key Requirements

### Requirement 1: Color Theme Selector

- Provide a theme selector menu near the existing dark/light mode toggle
- Define multiple color themes, including:
  - The current default theme (preserved as-is)
  - At least 2-3 "high contrast" themes where section titles, accordion headers, buttons, and interactive elements use vivid/saturated colors
- Theme selection should be persisted in localStorage so it survives page reloads
- Themes should work correctly in both light and dark modes
- The theme system should use CSS custom properties (variables) for easy switching

### Requirement 2: Default Collapsed Sections in Detail Page

- The following accordion sections in the Detail page should be **collapsed by default** when the page loads:
  - Beneficios
  - Etiquetas
  - WBEs
  - Transacciones
  - Transacciones JSON
- All other sections remain expanded by default (current behavior)
- Users can still expand/collapse any section manually

### Requirement 3: Spanish Language Review

- Audit all frontend UI text (buttons, labels, headers, tooltips, placeholders, empty states, error messages) for English words that should be in Spanish
- Replace any remaining English text with proper Spanish translations
- Review all existing Spanish text to ensure proper use of accents (tildes) and special characters (e.g., "Descripcion" → "Descripcion", "Informacion" → "Informacion", "busqueda" → "busqueda", etc.)
- Ensure consistency across all pages: Landing, Dashboard, Search, Reports, Detail

### General Requirements

- The architecture should follow the file specs/architecture/architecture_backend.md and specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_backend.md, specs/architecture/architecture_frontend.md) after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.
- Database column names and API field names remain unchanged (Spanish without accents) — only UI display text is affected.
- The current visual theme must be preserved as one of the selectable options (no breaking change to existing look).

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
