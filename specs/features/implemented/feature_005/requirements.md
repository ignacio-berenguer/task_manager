# Requirements Prompt for feature_005

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_005/specs.md' and './specs/features/feature_005/plan.md' in order to do that.

## Feature Brief

Improvements to the UI. (1) In the Search page, next to the number of results in the results list, show several tags with all the selected filters. The tags will have a small cancel button that can remove the filter. (2) The column filters work OK but they take too much screen space. I'd rather prefer that they are accessible as a pop-up when the user clicks a funnel icon in the column title.

## User Story

As a user, I want to see my active search filters displayed as removable tags next to the result count, so I can quickly understand which filters are applied and remove them individually without scrolling to the filter panel. I also want the column filters to be hidden behind a compact funnel icon in each column header, so the table has more vertical space for results while still providing easy access to filtering.

## Key Requirements

### Requirement 1: Active Filter Tags

- Display filter tags next to the results count in the search results area
- Each tag should show the filter field name and its current value
- Each tag should have a small "x" / cancel button to remove that specific filter
- Clicking the cancel button should remove the filter and re-trigger the search
- Tags should appear for all active filters (text search, dropdown selections, date ranges, etc.)

### Requirement 2: Column Filter Popovers

- Replace the always-visible column filter inputs with a funnel icon in each column header
- Clicking the funnel icon opens a popover/popup containing the filter input for that column
- The funnel icon should have a visual indicator (e.g., filled/colored) when a filter is active on that column
- The popover should close when clicking outside or pressing Escape
- Filter functionality should remain identical to the current implementation

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
