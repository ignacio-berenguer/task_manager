# Plan: feature_036 — Landing Page Redesign & Changelog

## Phase 1: Create Version & Changelog Data Files

### Step 1.1: Create `frontend/src/lib/version.js`
- Define `APP_VERSION` object with `major: 0`, `minor: 36`
- Export `VERSION_STRING` as formatted `"0.036"`

### Step 1.2: Create `frontend/src/lib/changelog.js`
- Create array with 36 entries (feature_036 down to feature_001)
- Each entry: `{ version, feature, title, summary }`
- Summaries derived from each feature's specs/requirements documents

**Changelog entries to populate:**

| # | Version | Title | Summary |
|---|---------|-------|---------|
| 36 | 0.036 | Landing Page Redesign & Changelog | Redesigned landing page with simplified hero section and changelog showing all implemented features with version tracking. |
| 35 | 0.035 | Detail Page Visual Polish & Badges | Added data existence indicators to sidebar navigation with count badges for 1:N sections and dots for 1:1 sections. |
| 34 | 0.034 | Optimize Excel Write-Back Bulk Reads | Replaced cell-by-cell COM calls with single bulk-read per sheet cached in memory, reducing COM interop overhead. |
| 33 | 0.033 | Excel Primary Key Columns & Full Transaction Display | Added clave_primaria_excel field and composite keys for 1:N entities, displaying execution dates and Excel PKs in transaction details. |
| 32 | 0.032 | Excel Write-Back Schema Mapping & Entity Configuration | Configured Excel sheet mapping for all 12 entities with field mappings, primary key definitions, and header row detection. |
| 31 | 0.031 | Search & Detail UX Improvements | Added row selection checkboxes, bulk copy of portfolio IDs, paste normalization, and sticky sidebar navigation for detail pages. |
| 30 | 0.030 | Excel Write-Back Error Handling & Recovery | Implemented comprehensive error handling for Excel operations including cell validation, row locking, and transaction rollback. |
| 29 | 0.029 | Transacciones JSON Excel Write-Back | Integrated xlwings COM automation to sync database changes back to source Excel workbooks with row matching and reconciliation. |
| 28 | 0.028 | Search Page Column Configuration & Persistence | Implemented drag-and-drop column configurator with visible/available column separation and localStorage persistence. |
| 27 | 0.027 | Cierre Economico Support: Calculated Estado Fields | Added estado workflow fields for approval/execution tracking with multi-step validation and workflow-based field visibility. |
| 26 | 0.026 | Dashboard Filter Improvements & Persistence | Enhanced dashboard filters with 9 configurable dimensions, localStorage persistence, and real-time chart updates. |
| 25 | 0.025 | Informe Reports: JSON Transacciones Report | Added JSON transaction report with operation/entity filtering, error highlighting, and detailed audit review. |
| 24 | 0.024 | Data Linkage: Related Entities Cross-References | Established foreign key relationships across all 25 tables with consistent portfolio_id foreign key and relational integrity. |
| 23 | 0.023 | CRUD Operations on Related Entities | Implemented modal-based create/edit/delete workflows for entities via the transacciones_json system with change tracking. |
| 22 | 0.022 | Detail Page: Portfolio Full Context View | Created comprehensive detail page displaying all related entity sections in collapsible accordions with relationships. |
| 21 | 0.021 | Search Page: Flexible Filtering & Data Grid | Built search interface with 9 filters, 60+ configurable columns, drag-and-drop reordering, sorting, pagination, and export. |
| 20 | 0.020 | JSON Processor: Database Change Application | Created backend service to parse JSON transactions and apply database changes atomically with rollback on error. |
| 19 | 0.019 | Transacciones JSON: Change Tracking & Audit Trail | Implemented transaction audit system capturing JSON diffs of all changes with operation type and full lifecycle tracking. |
| 18 | 0.018 | Informe Reports: Acciones, Etiquetas, Transacciones | Added 3 additional report pages with consistent filter-and-grid pattern, localStorage persistence, and export. |
| 17 | 0.017 | Informe Reports: Hechos & LTPs with Custom Layouts | Created specialized Hechos report with date-range filtering and LTP report with responsable/estado filtering. |
| 16 | 0.016 | Informe Reports: Framework, Cluster, Unidad, Priorizacion | Implemented 4 configurable report pages with dynamic filter panels, column selection, and server-side pagination. |
| 15 | 0.015 | Dashboard Sidebar Navigation & Detail Links | Added sticky sidebar navigation for dashboard sections and integrated portfolio_id links throughout the application. |
| 14 | 0.014 | Dashboard: KPIs, Charts & Drill-Down Navigation | Built interactive dashboard with 4 KPI cards, chart pairs across 5 dimensions, filters, and drill-down to Search page. |
| 13 | 0.013 | Frontend Skeleton: Layout, Routing & Authentication | Created React SPA foundation with route-based code splitting, Clerk authentication, responsive layout, and theming. |
| 12 | 0.012 | Calculated Fields: Advanced LookupCache & Service Layer | Optimized calculated field computation with batch-based LookupCache, reducing SQL queries from thousands to dozens. |
| 11 | 0.011 | FastAPI REST API Implementation | Built complete REST API with 25 CRUD endpoints, paginated responses, flexible search, and Pydantic validation. |
| 10 | 0.010 | Advanced Data Quality Validation | Implemented comprehensive validation framework checking data integrity, type mismatches, and constraint violations. |
| 9 | 0.009 | Application Modularization & Decoupling | Refactored backend and frontend into feature-based modules with clear separation of concerns. |
| 8 | 0.008 | Bulk Table Migrations: Database Extensions | Automated bulk migration of support tables from Excel source with validation and error handling. |
| 7 | 0.007 | Logging & Monitoring Infrastructure | Implemented centralized logging system with module-specific loggers, file rotation, and configurable levels. |
| 6 | 0.006 | Code Refactoring: Core Modules to Packages | Reorganized monolithic scripts into proper Python package structure with module separation. |
| 5 | 0.005 | Excel Data Export: datos_relevantes to Excel | Implemented bulk export of computed datos_relevantes table back to Excel with status columns and audit trail. |
| 4 | 0.004 | Configuration Management & Environment Setup | Established environment-based configuration system using .env files with module-specific settings. |
| 3 | 0.003 | Excel Workbook Migration: Reading & Normalization | Implemented Excel-to-SQLite migration engine for 5 workbooks with data validation and formula error handling. |
| 2 | 0.002 | Calculated Fields: datos_relevantes Denormalization | Created computed table consolidating 60+ calculated fields from multiple source tables using cached lookups. |
| 1 | 0.001 | Core System Architecture & Database Schema | Established foundational architecture with SQLite database, 25 normalized tables, and complete system design. |

## Phase 2: Modify Landing Page

### Step 2.1: Modify `HeroSection.jsx`
- Remove the CTA buttons div (lines 34-44)
- Remove unused imports: `Link`, `ArrowRight`, `Play`, `Button`
- Keep: Badge, headline, subtext, stats, background decoration

### Step 2.2: Create `ChangelogSection.jsx`
- New file at `frontend/src/features/landing/components/ChangelogSection.jsx`
- Import `CHANGELOG` from `@/lib/changelog`
- Import `VERSION_STRING` from `@/lib/version`
- Section header: "Change Log" with current version
- Render each entry as a card with version badge, title, and summary
- Responsive layout, consistent with existing landing page styling
- Spanish language

### Step 2.3: Modify `LandingPage.jsx`
- Remove imports for: ProblemSection, FeaturesSection, ProcessSection, AnalyticsSection, SecuritySection, PricingSection, AboutSection
- Add import for ChangelogSection
- Render: `<HeroSection />` then `<ChangelogSection />`

## Phase 3: Documentation Updates

### Step 3.1: Update `specs/architecture/architecture_frontend.md`
- Add new section "Changelog & Versioning" documenting:
  - Version file location and format
  - Changelog data file location and structure
  - Mandatory release process (update version + add changelog entry)

### Step 3.2: Update `README.md`
- Update landing page description to reflect new structure

## Phase 4: Verification

### Step 4.1: Build Check
- Run `npm run build` in `frontend/` to verify no build errors
- Verify no import/export issues from removed sections

## Implementation Order

1. Phase 1 (data files) — no dependencies
2. Phase 2 (UI changes) — depends on Phase 1
3. Phase 3 (docs) — can run in parallel with Phase 2
4. Phase 4 (verification) — depends on all previous phases
