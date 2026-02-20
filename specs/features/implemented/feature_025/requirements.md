# Requirements Prompt for feature_025

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_025/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_025/plan.md' in order to do that.

## Feature Brief

Enhancements to frontend user interface: apply darker background to key UI elements such as the navbar, dashboard vertical navbar (sidebar), page headers, and filter criteria panels to improve visual hierarchy and section separation.

## User Story

As a user, I want the navbar, dashboard sidebar, page headers, and filter panels to have a visually distinct darker background, so that these structural elements stand out clearly from the page content and I can quickly identify navigation, headings, and filter areas.

## Key Requirements

### Requirement 1: Darker Navbar Background

Apply a darker background color to the top navigation bar to make it visually distinct from the page content area. Must work correctly in both light and dark themes.

### Requirement 2: Darker Dashboard Sidebar Navigation

Apply a darker background to the sticky vertical sidebar navigation (`DashboardNav`) on the dashboard page to improve its visual separation from the chart/content area.

### Requirement 3: Darker Page Headers

Apply a darker background to the page header sections (title + subtitle area) across all pages (Dashboard, Search, Reports, Detail) to create a clear visual boundary between the header and the page content.

### Requirement 4: Darker Filter Criteria Panels

Apply a darker background to the filter panels (Dashboard `FilterBar`, Search `FilterPanel`, Report `ReportFilterPanel`) to visually distinguish the filter area from the results/content below.

### Requirement 5: also consider dark/light mode

The changes should be visually pleasant both in dark and light mode

### General Requirements

- The architecture should follow the file specs/architecture_backend.md and specs/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture_backend.md, specs/architecture_frontend.md) after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.
- Changes must work correctly in both light and dark modes.
- Use existing Tailwind CSS theme variables (e.g., `bg-muted`, `bg-muted/50`) rather than hardcoded colors.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
