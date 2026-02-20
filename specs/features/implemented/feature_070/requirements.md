# Requirements Prompt for feature_070

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_070/specs.md' and './specs/features/feature_070/plan.md' in order to do that.

## Feature Brief

Improve user interface and the chat agent system prompt. (1) As the Detail sticky header is taller, there are 2 fixes: 1) when scrolling the lateral navbar search is hidden. 2) Navigating to the section headers using the lateral navbar works but the section name is hidden behind the sticky header. (2) The horizontal bar charts in the dashboard are ok but in many occasions they do not show the text of the vertical axes values, please fix. (3) Review the system prompt of the chatbot agent to instruct that, unless otherwise specified by the user, it should only use Importe_YYYY field for preparing answers. (4) Review the system prompt to instruct the chatbot agent that, when asked about "iniciativas fuera de budget" he should check for cluster_2025 containing "extrabudget" or "fuera de budget". (5) In the quicksearch, allow to search for part of the portfolio ID as well.

## User Story

As a user, I want the Detail page, Dashboard charts, chatbot agent, and quicksearch to work more reliably and intuitively so that I can navigate initiative details without layout issues, always read chart axis labels, get accurate financial answers from the chatbot, and find initiatives by partial portfolio ID.

## Key Requirements

### Requirement 1: Detail Page — Sticky Header Overlapping Fixes

The Detail page has a sticky header that has grown taller. Two issues need fixing:

1. **Lateral navbar search hidden on scroll**: When the user scrolls down the page, the search input in the lateral (side) navbar becomes hidden behind or clipped by the sticky header. The lateral navbar search should remain visible and accessible at all times.
2. **Section headers hidden behind sticky header**: When navigating to a section via the lateral navbar links, the target section heading scrolls up but is hidden behind the sticky header. The scroll offset must account for the sticky header height so that the section heading is fully visible below it.

### Requirement 2: Dashboard — Horizontal Bar Chart Axis Labels

The horizontal bar charts in the dashboard frequently fail to display the text labels on the vertical (category) axis. This makes charts hard to read. Fix the chart configuration so that vertical axis labels are always fully visible, even when label text is long. Consider increasing left margin, truncating with ellipsis, or auto-sizing.

### Requirement 3: Chatbot Agent — Default to Importe_YYYY Fields

Update the chatbot agent's system prompt to instruct it that, unless the user explicitly specifies otherwise, it should use the `Importe_YYYY` field (e.g., `Importe_2025`, `Importe_2026`) when preparing financial answers. This ensures consistent and expected monetary values in responses.

### Requirement 4: Chatbot Agent — "Fuera de Budget" Query Handling

Update the chatbot agent's system prompt to instruct it that when a user asks about "iniciativas fuera de budget" (or similar phrasing), the agent should filter by the `cluster` field (in `datos_relevantes`) containing either `"extrabudget"` or `"fuera de budget"` (case-insensitive).

**Note on deprecated field:** The field `cluster_2025_antes_de_19062025` in `datos_descriptivos` is deprecated and must NOT be used for answering user questions or in any calculation. It is only retained in the migration pipeline for historical record. The chatbot should always use the `cluster` field from `datos_relevantes` instead.

### Requirement 5: QuickSearch — Partial Portfolio ID Search

Enhance the quicksearch feature so that users can search by a partial portfolio ID (e.g., typing `SPA_25` should match `SPA_25_01`, `SPA_25_02`, etc.). Currently quicksearch may require an exact or near-exact match on portfolio_id; it should support substring/partial matching.

### General Requirements

- The architecture should follow the file specs/architecture/architecture_backend.md and specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_backend.md, specs/architecture/architecture_frontend.md) after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
