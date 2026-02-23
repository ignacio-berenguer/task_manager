# specs.md — feature_013: Mobile Responsive Fixes

## Overview

The Task Manager frontend has several rendering issues on mobile screens (< 768px). While the app has good foundational responsive design (Navbar, Footer, Sheet, Landing page), the **Search page** and **Detail page** have significant usability problems on small screens. This spec catalogs every issue found and defines the technical fix for each.

## Scope

- **Primary focus**: Search page (`SearchPage.jsx`) and Detail page (`DetailPage.jsx`)
- **Secondary focus**: Dialog component, ColumnConfigurator, Chat page, NotFoundPage
- **No backend changes required** — this is purely a frontend feature

## Issue Catalog

### 1. Search Page — Sticky Header Overlap with "Nueva Tarea" Button

**File**: `frontend/src/features/search/SearchPage.jsx` (line 454)

**Problem**: The sticky header shows `h1` and the "Nueva Tarea" button side-by-side. On phones (< 375px), the button text may be cut off or overflow. The header text "Busqueda de Tareas" + the button compete for space.

**Fix**: On mobile, show only the icon for "Nueva Tarea" (hide the text). Use responsive classes:
- Button text: `hidden sm:inline` on "Nueva Tarea" label
- Keep the `Plus` icon always visible

### 2. Search Page — Table Action Buttons Too Small for Touch

**File**: `frontend/src/features/search/SearchPage.jsx` (lines 793-841)

**Problem**: The expand button (line 795), quick-view button (line 804), add-accion button (line 822), and change-date button (line 832) all use `p-1` with `h-4 w-4` icons, resulting in ~24px touch targets. This is well below the recommended 44px minimum (WCAG 2.1 AA).

**Fix**: Increase padding from `p-1` to `p-1.5` on these inline row buttons. This brings the total touch area closer to 32-36px — a practical improvement without distorting table layout on desktop.

### 3. Search Page — Column Filter Icons Too Small

**File**: `frontend/src/features/search/SearchPage.jsx` (line 543)

**Problem**: Filter icons in table headers use `h-3.5 w-3.5` (14px). Very hard to tap on mobile.

**Fix**: Increase to `h-4 w-4` (16px) and add a wrapper with `p-1` to enlarge the tap target. This won't break layout but will improve tappability.

### 4. Search Page — Expanded Row Content Padding on Mobile

**File**: `frontend/src/features/search/SearchPage.jsx` (line 845)

**Problem**: Expanded row uses `px-6 py-4` — on a 320px screen that's 48px total horizontal padding (15% of screen). The acciones list inside uses `w-24 shrink-0` for dates which is inflexible.

**Fix**: Use responsive padding `px-3 py-3 sm:px-6 sm:py-4`. Change the date column from `w-24` to `w-20 sm:w-24`.

### 5. Search Page — Drawer Grid Not Responsive

**File**: `frontend/src/features/search/SearchPage.jsx` (line 658)

**Problem**: The quick-view Sheet drawer uses `grid grid-cols-2 gap-3` for the metadata grid. On phones (< 375px) these two columns are cramped.

**Fix**: Change to `grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3`.

### 6. Search Page — Drawer Padding Too Large on Mobile

**File**: `frontend/src/features/search/SearchPage.jsx` (line 657)

**Problem**: Drawer content uses `px-6 pb-6` — on mobile Sheet (which is full screen), that's generous but the SheetHeader already uses `px-6 pt-6`. The Sheet content area should use responsive padding.

**Fix**: Change to `px-4 pb-4 sm:px-6 sm:pb-6`.

### 7. Search Page — Mobile Filter Accordion Sticky Position Conflict

**File**: `frontend/src/features/search/SearchPage.jsx` (line 481)

**Problem**: The mobile filter accordion has `sticky top-16 z-10` which conflicts with the main sticky header at `sticky top-16 z-30`. Both stick at the same `top-16`, meaning when both are visible, the filter accordion sits right under the header but can overlap results.

**Fix**: Change the mobile filter accordion sticky from `top-16` to `top-[7.25rem]` (header height 4rem + header padding ~3.25rem) to sit below the sticky header. Also increase z-index to `z-20` so it layers correctly between header (z-30) and content.

### 8. Detail Page — Acciones Table Action Buttons Too Small

**File**: `frontend/src/features/detail/DetailPage.jsx` (lines 236-240)

**Problem**: Edit and Delete buttons use `h-7 w-7 p-0` with `h-3.5 w-3.5` icons. At 28px, these are too small for comfortable mobile tapping.

**Fix**: Increase to `h-8 w-8 p-0` with `h-4 w-4` icons. This brings the target to 32px — a practical improvement.

### 9. Detail Page — Acciones Table Fixed Column Widths

**File**: `frontend/src/features/detail/DetailPage.jsx` (lines 223-226)

**Problem**: Table headers use fixed widths: `w-[100px]`, `w-[120px]`, `w-[80px]`. On a 320px screen, these fixed widths leave very little space for the "Accion" column (the most important text content).

**Fix**: On mobile, convert the acciones table to a card/list layout instead of a table. Use a responsive approach: show the table on `sm:` screens and up, and show a stacked card list on small screens.

### 10. Detail Page — Accordion Trigger Padding

**File**: `frontend/src/features/detail/DetailPage.jsx` (lines 255, 258, 268, 271)

**Problem**: Accordion triggers and content use `px-6` — 48px total horizontal padding on 320px screen (15%).

**Fix**: Use responsive padding: `px-4 sm:px-6`.

### 11. Detail Page — Header Action Buttons Layout on Mobile

**File**: `frontend/src/features/detail/DetailPage.jsx` (lines 175-204)

**Problem**: The header has `flex items-start justify-between gap-4` with the title on the left and "Editar" button on the right. On very small screens, the title may be squeezed. Also the CalendarClock button in the badge row uses `p-1` (small tap target).

**Fix**: Make the "Editar" button icon-only on mobile (`hidden sm:inline` on text). Increase CalendarClock button padding to `p-1.5`.

### 12. Dialog Component — No Mobile Width Constraint

**File**: `frontend/src/components/ui/dialog.jsx` (line 58)

**Problem**: `DialogContent` uses `max-w-lg` (512px) for `size="md"`. On a 375px phone, the dialog fills the full width but lacks a viewport-relative constraint and has hard `p-6` padding.

**Fix**: Add `max-w-[calc(100vw-2rem)]` as an additional class so the dialog never overflows on any screen. Also use responsive padding `p-4 sm:p-6`.

### 13. Dialog Component — Close Button Too Small

**File**: `frontend/src/components/ui/dialog.jsx` (line 68)

**Problem**: The close button `X` icon is `h-4 w-4` (16px) with no padding, making it very hard to tap on mobile.

**Fix**: Add padding `p-1` to the close button to increase the tap target area.

### 14. ColumnConfigurator Dialog — Too Wide on Mobile

**File**: `frontend/src/components/shared/ColumnConfigurator.jsx` (line 132)

**Problem**: Uses `size="lg"` which maps to `max-w-3xl` (768px). On mobile this should be constrained.

**Fix**: The dialog fix from Issue #12 (adding `max-w-[calc(100vw-2rem)]`) will automatically fix this since it applies to all dialogs.

### 15. Chat Page — Send/Stop Button Too Small

**File**: `frontend/src/features/chat/components/ChatInput.jsx` (lines 109, 113)

**Problem**: Send and stop buttons use `h-8 w-8` (32px) — below the 44px WCAG minimum.

**Fix**: Increase to `h-9 w-9` (36px). This is a practical improvement while maintaining the compact aesthetic.

### 16. Chat Page — Header Padding Not Responsive

**File**: `frontend/src/features/chat/ChatPage.jsx` (line 17)

**Problem**: Header uses `px-6 py-3` which is generous on mobile.

**Fix**: Change to `px-4 py-3 sm:px-6`.

### 17. NotFoundPage — Text Too Large on Mobile

**File**: `frontend/src/components/shared/NotFoundPage.jsx` (lines 10-12)

**Problem**: Uses `text-6xl` (60px) and `text-xl` (20px) without responsive variants.

**Fix**: Use `text-4xl sm:text-6xl` for the heading and `text-lg sm:text-xl` for the description. Also use responsive padding `py-12 sm:py-16`.

## Components NOT Changed (Already Well-Designed)

The following were reviewed and found to have good mobile responsive design:

- **Navbar** (`Navbar.jsx`): Proper hamburger menu, responsive breakpoints, good tap targets
- **Footer** (`Footer.jsx`): Responsive flex layout with `sm:` breakpoints
- **Sheet** (`sheet.jsx`): Full-screen on mobile, side-slide on desktop, proper close button
- **Landing Page** (`HeroSection.jsx`, `ChangelogSection.jsx`): Excellent responsive design
- **EmptyState** (`EmptyState.jsx`): Has compact variant for smaller contexts
- **MessageList** (`MessageList.jsx`): Good responsive constraints on message bubbles
- **MessageBubble** (`MessageBubble.jsx`): Proper max-width constraints

## Technical Approach

1. All fixes use **Tailwind CSS responsive utilities** (`sm:`, `md:`, `lg:`) — no custom media queries
2. Mobile-first approach: set the mobile value as default, add `sm:` for larger screens
3. No structural changes to component hierarchy — only class adjustments
4. Exception: Detail page acciones section gets a responsive card-vs-table layout (Issue #9)
5. No changes to any `.env` files, backend code, or database schema
