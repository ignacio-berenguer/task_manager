# Implementation Plan for feature_070

## Phase 1: Detail Page — Sticky Header Overlapping Fixes (R1)

### Step 1.1: Increase SidebarNav sticky offset
**File:** `frontend/src/components/shared/SidebarNav.jsx`
- Change `sticky top-36` → `sticky top-44` (line 89)
- Update IntersectionObserver `rootMargin` from `-80px 0px -40% 0px` → `-140px 0px -40% 0px` (line 63)

### Step 1.2: Increase SectionAccordion scroll margin
**File:** `frontend/src/features/detail/components/SectionAccordion.jsx`
- Change `scroll-mt-36` → `scroll-mt-44` (line 47)

### Step 1.3: Verify MobileDetailNav consistency
**File:** `frontend/src/features/detail/components/MobileDetailNav.jsx`
- MobileDetailNav uses `scrollIntoView({ behavior: 'smooth', block: 'start' })` which relies on `scroll-mt-*` from SectionAccordion. The change in Step 1.2 covers this. Verify no additional offsets needed.

### Verification
- Navigate to a Detail page with many sections
- Scroll down and confirm the sidebar search input remains visible below the sticky header
- Click a section link in the sidebar and confirm the section heading is fully visible below the sticky header
- Test on mobile (FAB navigation) and confirm sections scroll correctly

---

## Phase 2: Dashboard — Horizontal Bar Chart Axis Labels (R2)

### Step 2.1: Increase default yAxisWidth in BarChartCard
**File:** `frontend/src/features/dashboard/components/BarChartCard.jsx`
- Change default `yAxisWidth` prop from `100` to `160` (line 137)
- Adjust left margin from `20` to `10` in the `margin` prop (line 235)

### Step 2.2: Remove explicit yAxisWidth overrides
**File:** `frontend/src/features/dashboard/DashboardPage.jsx`
- Remove `yAxisWidth={160}` from the 2 Priorizacion chart instances (lines 348, 359) — now the default

### Verification
- Open the Dashboard page
- Confirm all 10 horizontal bar charts show full or reasonably truncated axis labels
- Verify labels like "Digital Governance", "Business Improvement", "Technology" are readable
- Check that charts still render properly without overflow

---

## Phase 3: Chatbot Agent — System Prompt Updates (R3 + R4)

### Step 3.1: Add default importe field rule
**File:** `backend/app/agent/system_prompt.py`
- After the existing "REGLA DE IMPORTES POR DEFECTO" block (line 54), add a new rule:
  - Clarify that `importe_YYYY` is the default field for generic financial queries
  - Other importe types (budget, sm200, aprobado, facturacion) only when explicitly requested

### Step 3.2: Add "fuera de budget" query handling rule
**File:** `backend/app/agent/system_prompt.py`
- After the "Canceladas" rule (line 230), add a new section:
  - Instruct the agent to use the `cluster` field from `datos_relevantes` (NOT `cluster_2025_antes_de_19062025` from datos_descriptivos, which is deprecated)
  - Filter by `ilike` with `%extrabudget%` or `%fuera de budget%`
  - Use `buscar_iniciativas` with a filter on the `cluster` field
  - Explicitly warn the agent to never use the deprecated `cluster_2025_antes_de_19062025` field

### Verification
- Restart the backend server
- In the chat, ask "¿Cuál es el importe de las iniciativas de la unidad X?" → should use `importe_2026`
- Ask "¿Cuáles son las iniciativas fuera de budget?" → should filter by cluster_2025 field
- Confirm existing chatbot behavior is preserved for other queries

---

## Phase 4: QuickSearch — Partial Portfolio ID UX (R5)

### Step 4.1: Improve result display and placeholder
**File:** `frontend/src/components/layout/GlobalSearch.jsx`
- Widen portfolio_id column from `w-20` to `w-28` (line 201) for better ID readability
- Update placeholder text to: "Buscar por Portfolio ID (parcial) o Nombre..." (line 175)
- Add visual distinction for ID-matched results vs name-matched results by tagging results from the `byId` search with a small "ID" indicator

### Verification
- Open GlobalSearch (Ctrl+Shift+F)
- Type a partial portfolio ID like "SPA_25" → confirm matching initiatives appear
- Type a partial name → confirm name-matched results appear
- Verify deduplication still works (results from both searches don't duplicate)
- Check keyboard navigation still works

---

## Phase 5: Documentation Updates

### Step 5.1: Update version and changelog
**File:** `frontend/src/lib/version.js` — Increment `APP_VERSION.minor` to 70
**File:** `frontend/src/lib/changelog.js` — Add changelog entry for feature_070

### Step 5.2: Update architecture docs
- `specs/architecture/architecture_frontend.md` — Note SidebarNav offset change, BarChartCard default yAxisWidth, GlobalSearch improvements
- `specs/architecture/architecture_backend.md` — Note system prompt changes for importe default and fuera de budget rule

### Step 5.3: Update README.md
- Any relevant changes

---

## Implementation Order

1. Phase 1 (Detail page) — Independent, frontend-only
2. Phase 2 (Dashboard charts) — Independent, frontend-only
3. Phase 3 (System prompt) — Independent, backend-only
4. Phase 4 (QuickSearch) — Independent, frontend-only
5. Phase 5 (Documentation) — After all code changes verified

Phases 1-4 are fully independent and can be implemented in any order.
