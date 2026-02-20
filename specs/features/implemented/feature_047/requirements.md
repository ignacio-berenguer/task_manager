# Requirements Prompt for feature_047

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_047/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_047/plan.md' in order to do that.

## Feature Brief

Documentos table processing improvement with multiple sub-features:

1. **Migration — Documentos from Excel**: In the migration process, empty the documentos table and then load it from the Excel file `PortfolioDigital_Documentos.xlsx`.
2. **Migration — documentos_items table**: In the migration process, generate a new database table `documentos_items` in which `resumen_json` is expanded into columns: `portfolio_id`, `nombre_fichero`, `tipo_documento`, `tipo_registro`, `texto`.
3. **Export — documentos_items**: In the export process, export the `documentos_items` table to `PortfolioDigital_Documentos_Items_Calculation.xlsx`.
4. **Migration — documentos_items from Excel**: In the migration process, `documentos_items` should be emptied and imported from the `PortfolioDigital_Documentos_Items.xlsx` Excel file.
5. **CLI — Add scan_documents to complete_process**: Add the `scan_documents` step to the full pipeline command (renamed to `complete_process`).
6. **CLI — Rename main.py to manage.py**: Change the invocation of the management program from `main.py` to `manage.py`.
7. **CLI — Rename command**: Change the command name from `full_calculation_datos_relevantes` to `complete_process`.
8. **Documentation**: Update all documentation including `README.md` and `instructions.md`.
9. **Frontend — Informe Documentos side drawer**: Add the side-drawer initiative detail to the Informe Documentos report page.
10. **Frontend — Detail page Documentos section**: In the Detail page, in the Documentos table, move the "Ruta Documento" field and any other field in the documentos table not currently shown to expandable initiative details (row expansion).
11. **Frontend — Estado Proceso tag**: In the Documentos table and Informe Documentos, `estado_proceso` should be displayed as a colored tag/badge.

## User Story

As a portfolio manager, I want the documentos processing pipeline to be streamlined — loading documents from Excel, expanding summaries into a queryable items table, and having better frontend visibility of document data — so that I can efficiently manage and review document information across initiatives.

## Key Requirements

### Requirement 1: Documentos Migration from Excel

- Empty the `documentos` table during migration
- Load `documentos` data from `PortfolioDigital_Documentos.xlsx`
- This replaces the previous behavior where `documentos` was in `PRESERVED_TABLES`

### Requirement 2: documentos_items Table Generation

- Create a new `documentos_items` database table
- Expand the `resumen_json` field from `documentos` into individual rows
- Columns: `portfolio_id`, `nombre_fichero`, `tipo_documento`, `tipo_registro`, `texto`
- This is generated as part of the calculation/migration process

### Requirement 3: Export documentos_items

- Export the `documentos_items` table to `PortfolioDigital_Documentos_Items_Calculation.xlsx`
- Follow the existing export pattern used for `datos_relevantes`

### Requirement 4: Import documentos_items from Excel

- Empty `documentos_items` during migration
- Import from `PortfolioDigital_Documentos_Items.xlsx`
- This allows manual corrections to be re-imported

### Requirement 5: Add scan_documents to complete_process

- Include the `scan_documents` step in the full pipeline command
- Should run at the appropriate point in the pipeline sequence

### Requirement 6: Rename main.py to manage.py

- Rename `management/main.py` to `management/manage.py`
- Update all references, documentation, and scripts accordingly

### Requirement 7: Rename full_calculation_datos_relevantes to complete_process

- Change the CLI command name from `full_calculation_datos_relevantes` to `complete_process`
- Update all references, documentation, and scripts accordingly

### Requirement 8: Documentation Updates

- Update `README.md` with all CLI changes
- Update any `instructions.md` files
- Update architecture docs

### Requirement 9: Informe Documentos Side Drawer

- Add the initiative side-drawer component to the Informe Documentos report page
- Follow the same pattern used in other report pages that have side drawers

### Requirement 10: Detail Page Documentos Expansion

- In the Detail page Documentos section, move "Ruta Documento" and any other currently hidden fields to expandable row details
- Users can click to expand a row and see the full document information

### Requirement 11: Estado Proceso as Tag

- Display `estado_proceso` as a colored tag/badge in both:
  - The Documentos table in the Detail page
  - The Informe Documentos report page
- Use appropriate colors for different estados (e.g., Pendiente, Procesado, Error)

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
