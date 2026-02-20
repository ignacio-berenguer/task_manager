# Plan: feature_052 — UI/UX Audit & Improvement Backlog

## Nature of This Feature

This is a **documentation-only** feature. The deliverable is the audit report (requirements.md), technical specs (specs.md), and this plan. No code changes are made.

Each batch below is designed to become its own `/create_feature` when picked up for implementation.

## Suggested Implementation Roadmap

### Phase 1: Quick Wins (feature_053 candidate)
**Batch 1:** F7 + C3 + E1 + F3
- Enable `searchable` on all MultiSelect instances
- Persist FilterPanel collapsed state
- Add Collapse All / Expand All to Detail page
- Add CTA button to landing hero

### Phase 2: Navigation (feature_054 candidate)
**Batch 2:** A1 + A2 + A6 + A7
- Create Breadcrumb component
- Enhance DetailHeader back button context
- Add Recent Initiatives dropdown to Navbar
- Add URL hash anchors to Detail sections

### Phase 3: Dashboard Polish (feature_055 candidate)
**Batch 4:** B3 + B4 + B5
- Enhanced chart tooltips with percentages
- Truncated label tooltips
- Collapsible FilterBar

### Phase 4: Search Enhancements (feature_056 candidate)
**Batch 3:** C1 + C2 + C6 + C7 + C8
- Saved searches
- Filter chips bar
- Export respects column config
- Persistent row selection
- Portfolio ID paste validation

### Phase 5: Detail Page Tables (feature_057 candidate)
**Batch 5:** E2 + E3 + E4
- Section search in sidebar
- Sortable SimpleTable columns
- Per-section export

### Phase 6: UI Components (feature_058 candidate)
**Batch 7:** F1 + F2 + F4 + F6
- Datepicker component
- Dialog size variants
- Changelog improvements
- EmptyState component

### Phase 7: Report Enhancements (feature_059 candidate)
**Batch 6:** D1 + D2 + D3 + D4
- Aggregation footer row
- Date range presets
- Context-aware empty states
- Saved report templates

### Phase 8: Dashboard Advanced (feature_060 candidate)
**Batch 8:** B1 + B2 + B7
- KPI trend indicators (needs API)
- Chart PNG export
- Dynamic stats (needs API)

### Phase 9: Detail Advanced (feature_061 candidate)
**Batch 9:** E6 + E7 + E8
- Section edit history modal
- Related initiatives widget (needs API)
- Activity timeline (needs API)

### Phase 10: Mobile & Accessibility (feature_062 candidate)
**Batch 10:** A8 + A9 + G1 + G2 + G3 + G5 + C4 + C5 + F5
- Can be split into sub-features if needed
- Cross-report navigation, mobile views, accessibility fixes

## Closing This Feature

Since this is an audit feature:
1. No code changes needed
2. No version bump needed (no functional change)
3. No changelog entry needed
4. Move to implemented via `/close_feature feature_052`
