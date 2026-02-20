# Requirements Prompt for feature_031

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_031/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_031/plan.md' in order to do that.

## Feature Brief

I want to have some improvements on the Search page such as: (1) Be able to select with check box a number of the initiatives returned; (2) Be able to copy the portfolio_id of the selected initiatives as comma separated text to the clipboard; (3) In the criteria text box for portfolio_id I want to be able to paste a long text of initiatives and you should convert to the comma separated list of portfolio_ids for searching; (4) Since the initiative Details page has many many sections, I want it to have a sticky side navbar menu in the left side of the page (similar to the one in the dashboard, use the same style) with a link to all the sections.

## User Story

As a portfolio manager, I want to select multiple initiatives from search results and quickly copy their portfolio IDs, paste bulk portfolio IDs into the search criteria, and navigate the Detail page efficiently via a sidebar menu, so that I can work more productively with large sets of initiatives.

## Key Requirements

### Requirement 1: Row Selection with Checkboxes

Add a checkbox column to the Search page data grid that allows users to select one or more initiative rows. A "select all" checkbox in the header should toggle selection for all visible rows. Selection state should be visually clear (highlighted rows).

### Requirement 2: Copy Selected Portfolio IDs to Clipboard

Provide a button (visible when at least one row is selected) that copies the portfolio_id values of all selected initiatives as a comma-separated string to the clipboard. Show a brief toast/feedback confirming the copy action.

### Requirement 3: Paste Bulk Portfolio IDs in Search Criteria

The portfolio_id search criteria text box should accept pasted text containing portfolio IDs in various formats (comma-separated, space-separated, newline-separated, or mixed). On paste or input, automatically normalize the text into a clean comma-separated list of portfolio_ids for searching.

### Requirement 4: Detail Page Sticky Sidebar Navigation

Add a sticky sidebar navigation menu to the Detail page (left side), following the same style as the Dashboard sidebar. The sidebar should list all 19 accordion sections with anchor links that scroll to each section. Highlight the currently visible section as the user scrolls. Each section in the sidebar should show a badge indicating whether it has data: a dot indicator for single-record sections that have data, or a numeric count for multi-record sections that have records.

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
