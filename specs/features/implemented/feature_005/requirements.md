# Requirements Prompt for feature_005

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

I have created a '/home/nacho/dev/portfolio_migration/specs/features/feature_005/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_005/plan.md' in order to to that.

## Feature Brief

Complete calculation and generate output excel_file

## User Story

As a user, I want to be able to generate an output_file of datos_relevantes database table to a selected excel_file.

## Key Requirements

### Requirement 1: "Consider estado_especial" in the calculation of estado_iniciativa

Implement the estado_especial(portfolio_id:str) --> str | None function. This function should get the estado_especial from table estado_especial or return none if no record exists.
You need to modify estado_iniciativa function, so that if estado_especial(portfolio_id) returns a value, the estado_iniciativa is equal to that value.

### Requirement 2: "Fix errors in migration of IMs"

The migration of IMs data is logging some errors of this type:

2026-01-29 23:18:06 - portfolio_migration - ERROR - Row 25: Failed to migrate - Error binding parameter 8: type 'NaTType' is not supported
2026-01-29 23:18:06 - portfolio_migration - ERROR - Row 25 data: {'nombre': NaT, 'portfolio_id': NaT, 'descripcion': NaT, 'fecha_investment_memo_aprobado': NaT, 'new_capex_dev': NaT, 'new_capex_maint': NaT, 'new_opex_ict': NaT, 'referente_negocio': NaT, 'link_im': NaT, 'fecha_inicio_proyecto': NaT, 'fecha_final_proyecto': NaT, 'estado_proyecto': NaT, 'investment_2024': NaT, 'investment_2025': NaT, 'investment_2026': NaT, 'investment_2027': NaT, 'investment_2028': NaT, 'investment_2029': NaT, 'investment_2030': NaT, 'benefits_2024': NaT, 'benefits_2024:\_margin_increase': NaT, 'benefits_2024:\nopex_reduction_business': NaT, 'benefits_2024:\nopex_reduction_ict': NaT, 'other_benefits_2024_capex_reduction_business': NaT, 'benefits_2025': NaT, 'benefits_2025:\_margin_increase': NaT, 'benefits_2025:\nopex_reduction_business': NaT, 'benefits_2025:\nopex_reduction_ict': NaT, 'other_benefits_2025_capex_reduction_business': NaT, 'benefits_2026': NaT, 'benefits_2026:\_margin_increase': NaT, 'benefits_2026:\nopex_reduction_business': NaT, 'benefits_2026:\nopex_reduction_ict': NaT, 'other_benefits_2026_capex_reduction_business': NaT, 'total_benefits_2027': NaT, 'benefits_2027:\_margin_increase': NaT, 'benefits_2027:\nopex_reduction_business': NaT, 'benefits_2027:\nopex_reduction_ict': NaT, 'other_benefits_2027_capex_reduction_business': NaT, 'total_benefits_2028': NaT, 'benefits_2028:\_margin_increase': NaT, 'benefits_2028:\nopex_reduction_business': NaT, 'benefits_2028:\nopex_reduction_ict': NaT, 'other_benefits_2028_capex_reduction_business': NaT, 'total_benefits_2029': NaT, 'benefits_2029:\_margin_increase': NaT, 'benefits_2029:\nopex_reduction_business': NaT, 'benefits_2029:\nopex_reduction_ict': NaT, 'other_benefits_2029_capex_reduction_business': NaT, 'total_benefits_2030': NaT, 'benefits_2030:\_margin_increase': NaT, 'benefits_2030:\nopex_reduction_business': NaT, 'benefits_2030:\nopex_reduction_ict': NaT, 'other_benefits_2030_capex_reduction_business': NaT}

I think that the problem is that you are not getting correctly that the Excel table ends at worksheet row 28. See what you can do to automatically detect end of table.

### Requirement 3: "Export datos_relevantes to output_excel"

I want to output the result of the datos_relevantes table once it is calculated to an excel folder, file-worksheet-table.

Please modify the .env file so I can configure the location of the excel folder, file, worksheet and table. For testing purposes, please consider folder = excel_output, file = PortfolioDigital_DatosRelevantes.xlsm, worksheet = "Datos Relevantes", table = "DatosRelevantes".

I want also to be able to configure a mapping (in the code) between the datos_relevantes database table and the excel table column names.

Before inserting the rows or datos_relevantes in the defined excel table you should delete all the rows in the table.

Please make sure not to remove the excel table definition, so that the formats are kept.

Then you can insert all the rows in the datos_relevantes database table in the excel table, using the columns in the excel table that match the mapping. Then you can save the excel file.

Please log operations to the log file.

### General requirements

- Update the README.md document after all the changes are done.

## Constraints

- Do not real the excel_source file to conserve tokens usage, you do not need it for this requirement.

- Do not modify existing calculation or database model, other than the estado_iniciativa and estado_especial

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
