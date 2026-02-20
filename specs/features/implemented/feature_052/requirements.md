# Requirements Prompt for feature_052

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_052/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_052/plan.md' in order to do that.

## Feature Brief

UI/UX audit of the Portfolio Digital frontend application, identifying concrete improvement opportunities across navigation, aesthetics, search capabilities, screen organization, and missing features.

## Audit Findings

### A. Navigation & Routing

| #   | Area        | Issue                                              | Proposed Improvement                                               |
| --- | ----------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| A1  | All pages   | No breadcrumb navigation — users lose path context | Add breadcrumb component to protected pages                        |
| A2  | Detail page | No "Back to Search" button — requires browser back | Add contextual back button in DetailHeader                         |
| A6  | Navbar      | No "Recent Initiatives" quick access               | Add dropdown with last 5-10 viewed portfolio_ids from localStorage |
| A7  | Detail page | No section URL anchors                             | Update URL hash on scroll/click so sections are linkable           |
| A8  | Reports     | No cross-report navigation                         | Add "View in [Other Report]" links per row                         |
| A9  | Navbar      | GlobalSearch only available on desktop             | Add to mobile menu                                                 |

### B. Dashboard

| #   | Area      | Issue                                                 | Proposed Improvement                                      |
| --- | --------- | ----------------------------------------------------- | --------------------------------------------------------- |
| B1  | KPI cards | No trend indicators (↑/↓ vs previous period)          | Add delta arrows/percentages                              |
| B2  | Charts    | No export capability for presentations                | Add "Export as PNG" button per chart                      |
| B3  | Charts    | Tooltips only show name+value, no percentage of total | Add "15% of total" to tooltip                             |
| B4  | Charts    | Long labels truncate without indication               | Improve label wrapping or add tooltip on truncated labels |
| B5  | FilterBar | Always expanded, takes space after filtering          | Add collapse/expand toggle                                |
| B7  | KPIs      | Stats are hardcoded presentation numbers              | Fetch from API for dynamic values                         |

### C. Search Page

| #   | Area               | Issue                                                         | Proposed Improvement                                                        |
| --- | ------------------ | ------------------------------------------------------------- | --------------------------------------------------------------------------- |
| C1  | Filters            | No saved searches — users recreate same filters daily         | Add "Save Search" + "Load Search" with named configurations to localSotrage |
| C2  | Filters            | Applied filters not visible as removable chips above grid     | Add filter chips bar                                                        |
| C3  | Filters            | FilterPanel collapsed state not persisted                     | Save collapsed/expanded to localStorage                                     |
| C4  | DataGrid           | No column-level filtering (e.g., filter within Estado column) | Add funnel icon in column headers with dropdown filter                      |
| C5  | DataGrid           | No row grouping (all flat)                                    | Add "Group by" toggle (Estado / Unidad / Cluster)                           |
| C6  | Export             | Doesn't respect user's column order/selection                 | Fix export to match column configuration                                    |
| C7  | Pagination         | Changing pages clears row selection                           | Persist selection across pagination                                         |
| C8  | Portfolio ID input | No validation on paste                                        | Warn on invalid portfolio_id format                                         |

### D. Reports

| #   | Area         | Issue                                      | Proposed Improvement                              |
| --- | ------------ | ------------------------------------------ | ------------------------------------------------- |
| D1  | All reports  | No aggregation footer row (sum/avg/count)  | Add configurable footer aggregations              |
| D2  | Date filters | No presets (Last 7 Days, This Month, etc.) | Add date range presets dropdown                   |
| D3  | Empty state  | Generic "No results" message               | Show specific suggestions based on active filters |
| D4  | Reports      | No saved report templates                  | Add "Save as Template" → named configuration      |

### E. Detail Page

| #   | Area           | Issue                                            | Proposed Improvement                                           |
| --- | -------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| E1  | Page structure | 21 accordion sections create a "scroll marathon" | Add "Collapse All / Expand All" button                         |
| E2  | Sidebar        | No section search in DetailNav                   | Add text filter for section names in sidebar                   |
| E3  | 1:N sections   | SimpleTable has no column sorting                | Add sortable column headers                                    |
| E4  | Sections       | No per-section data export                       | Add "Export Section" button (CSV/JSON)                         |
| E6  | All sections   | No section edit history                          | Add "History" button → show transacciones_json for that entity |
| E7  | Detail         | No "Related Initiatives" widget                  | Show initiatives with same tags or cluster                     |
| E8  | Detail         | No unified activity timeline                     | Combine hechos + notas + transacciones chronologically         |

### F. UI Components & Aesthetics

| #   | Area           | Issue                                        | Proposed Improvement                                |
| --- | -------------- | -------------------------------------------- | --------------------------------------------------- |
| F1  | Date fields    | No datepicker — plain text inputs            | Add calendar popup component                        |
| F2  | Dialog         | No size variants — all same width            | Add sm/md/lg/xl/full variants                       |
| F3  | Landing page   | No CTA button in hero section                | Add "Go to Dashboard" (auth) / "Sign In" (non-auth) |
| F4  | Landing page   | Changelog has 50+ entries with no pagination | Add collapsible version ranges or search            |
| F5  | Loading states | Generic spinner for all lazy routes          | Create page-specific loading skeletons              |
| F6  | Empty states   | Plain text, no icons or helpful messages     | Create EmptyState component with icon + action      |
| F7  | Multi-select   | Search is case-sensitive                     | Fix to case-insensitive                             |

### G. Mobile & Accessibility

| #   | Area            | Issue                                              | Proposed Improvement                       |
| --- | --------------- | -------------------------------------------------- | ------------------------------------------ |
| G1  | Search DataGrid | Not mobile-friendly (tiny text, horizontal scroll) | Create card-based mobile view              |
| G2  | Detail page     | Sidebar hidden on mobile, no fallback              | Add floating section menu button           |
| G3  | Charts          | Colors not colorblind-safe, no patterns            | Add pattern overlays or colorblind palette |
| G5  | Components      | Visual focus indicators too subtle on some buttons | Enhance focus ring visibility              |

## User Story

As a user of the Portfolio Digital application, I want the interface to be more intuitive, consistent, and efficient so that I can navigate, search, and analyze portfolio data with less friction.

## Key Requirements

This is an analysis/audit feature. The output is a prioritized list of improvements to be implemented as individual features or batches.

### Requirement 1: Categorize improvements by effort and impact

Each improvement should be classified as:

- **Quick Win** (< 1 day, high impact): A1, C3, E1, F3, F7
- **Medium** (1-3 days, moderate impact): A2, A6, A7, B3, B4, B5, C1, C2, C6, C7, C8, D2, D3, E2, E3, E4, F1, F2, F4, F6, G2, G5
- **Large** (3+ days, significant feature): A8, A9, B1, B2, B7, C4, C5, D1, D4, E6, E7, E8, G1, G3

### Requirement 2: Create a backlog

Improvements should be logged as potential future features that can be picked up individually.

### General Requirements

- The architecture should follow the file specs/architecture/architecture_backend.md and specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_backend.md, specs/architecture/architecture_frontend.md) after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.
- This is an audit document — no code changes should be made as part of this feature itself.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
