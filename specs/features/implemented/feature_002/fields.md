nombre TEXT: it will be calculated as a lookup of the field of the same name in datos_descriptivos.
unidad TEXT: it will be calculated as a lookup of the field of the same name in datos_descriptivos.
origen TEXT: it will be calculated as a lookup of the field of the same name in datos_descriptivos.
digital_framework_level_1 TEXT: it will be calculate as a lookup of the field of the same name in datos_descriptivos.
prioridad_descriptiva TEXT: it will be calculated as a lookup of the field of the same name in datos_descriptivos.
cluster_2025 TEXT: it will be calculate as a lookup of the field of the same name in datos_descriptivos.
estado_de_la_iniciativa TEXT: it will be calculated from a python function estado_iniciativa(portflio_id) that we will define later.
fecha_de_ultimo_estado TEXT: it will be calculated from a python function fecha_de_ultimo_estado(portflio_id) that we will define later.
estado_de_la_iniciativa_2026 TEXT: it will be the same as estado_de_la_iniciativa
estado_aprobacion TEXT: it will be calculated from a python function estado_aprobacion_iniciativa(portflio_id) that we will define later.
estado_ejecucion TEXT: it will be calculated from a python function estado_ejecucion_iniciativa(portflio_id) that we will define later.
priorizacion TEXT: it will be calculated as a lookup of the field of the same name in datos_descriptivos.
en_presupuesto_del_ano TEXT: it will be calculated from a python function en_presupuesto_del_ano(portflio_id) that we will define later.
tipo TEXT: it will be calculated as a lookup of the field of the same name in datos_descriptivos.
budget_2024 REAL: it will be calculated from a python function importe(portflio_id:str, ano:int, tipo_importe:str) that we will define later, calling the function as importe(portfolio_id, 2024, "Budget")
importe_sm200_24 REAL: calling the function as importe(portfolio_id, 2024, "SM200")
importe_aprobado_2024 REAL: calling the function as importe(portfolio_id, 2024, "Aprobado")
importe_citetic_24 REAL: calling the function as importe(portfolio_id, 2024, "Citetic")
importe_facturacion_2024 REAL: calling the function as importe(portfolio_id, 2024, "Facturado")
importe_2024 REAL: calling the function as importe(portfolio_id, 2024, "Importe")
budget_2025 REAL: calling the function as importe(portfolio_id, 2025, "Budget")
importe_sm200_2025 REAL: calling the function as importe(portfolio_id, 2025, "SM200")
importe_aprobado_2025 REAL: calling the function as importe(portfolio_id, 2025, "Aprobado")
importe_facturacion_2025 REAL: calling the function as importe(portfolio_id, 2025, "Facturado")
importe_2025 REAL: calling the function as importe(portfolio_id, 2025, "Importe")
importe_2025_cc_re REAL: calling the function as importe(portfolio_id, 2025, "Cash Cost RE")
calidad_valoracion TEXT: it will be calculated from a python function calidad_valoracion(portflio_id:str, ano:int) that we will define later
budget_2026 REAL: calling the function as importe(portfolio_id, 2026, "Budget")
importe_sm200_2026 REAL: calling the function as importe(portfolio_id, 2026, "SM200")
importe_aprobado_2026 REAL: calling the function as importe(portfolio_id, 2026, "Aprobado")
importe_facturacion_2026 REAL: calling the function as importe(portfolio_id, 2026, "Facturado")
importe_2026 REAL: calling the function as importe(portfolio_id, 2026, "Importe")
budget_2027 REAL: calling the function as importe(portfolio_id, 2027, "Budget")
importe_sm200_2027 REAL: calling the function as importe(portfolio_id, 2027, "SM200")
importe_aprobado_2027 REAL: calling the function as importe(portfolio_id, 2027, "Aprobado")
importe_facturacion_2027 REAL: calling the function as importe(portfolio_id, 2027, "Facturado")
importe_2027 REAL: calling the function as importe(portfolio_id, 2027, "Importe")
importe_2028 REAL: calling the function as importe(portfolio_id, 2028, "Importe")
estado_agrupado TEXT: it will be calculated from a python function estado_agrupado(portflio_id:str) that we will define later
siguiente_accion TEXT: it will be calculated from a python function siguiente_accion(portflio_id:str, ano:int) that we will define later
referente_negocio TEXT: it will be a lookup of the field with the same name in the table datos_descriptivos
estado_dashboard TEXT: it will be calculated from a python function estado_dashboard(portflio_id:str) that we will define later
referente_bi TEXT: it will be a lookup of the field with the same name in the table datos_descriptivos
jira_id TEXT: it will be a lookup of the field with the same name in the table datos_descriptivos
it_partner TEXT: it will be a lookup of the field with the same name in the table datos_descriptivos
referente_ict TEXT: it will be a lookup of the field with the same name in the table datos_descriptivos
capex_opex TEXT: it will be a lookup of the field with the same name in the table informacion_economica
cini TEXT: it will be a lookup of the field with the same name in the table informacion_economica
fecha_prevista_pes TEXT, ISO 8601: it will be a lookup of the field with the same name in the table informacion_economica
tipo_agrupacion TEXT: it will be a lookup of the field with the same name in the table datos_descriptivos
nuevo_importe_2025 REAL: it will be 0
estado_requisito_legal TEXT: it will be calculated from a python function estado_requisito_legal(portflio_id) that we will define later
cluster_de_antes_de_1906 TEXT: it will be ""
fecha_sm100 TEXT, ISO8601: calculated calling the function fecha_iniciativa(portfolio_id:str,"SM100 Final"), we will define the function later
fecha_aprobada_con_cct TEXT, ISO 8601: calculated calling the function fecha_iniciativa(portfolio_id:str,"Aprobada con CCT"), we will define the function later
fecha_en_ejecucion TEXT, ISO 8601: calculated calling the function fecha_iniciativa(portfolio_id:str,"En ejecución"), we will define the function later
diferencia_apr_eje_exc_ept REAL,
esta_en_los_206_me_de_2026 TEXT: calculated calling the function esta_en_los_206_me_de_2026(portfolio_id:str), we will define the function later
fecha_limite TEXT, ISO 8601: calculated calling the function fecha_limite(portfolio_id:str), we will define the function later
fecha_limite_comentarios TEXT: calculated calling the function fecha_limite_comentarios(portfolio_id:str), we will define the function later
