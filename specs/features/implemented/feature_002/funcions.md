# Calculation function implementation

In this file I give you the description on how to implement the needed functions. The functions should be the python equivalent to replace the following Excel functions, considering that the Hechos table in excel has the following columns: "PORTFOLIO ID", "Nombre", "Partida presupuestaria", " Importe", "Estado", "Fecha", " Importe RI", " Importe RE", "Notas", "Racional", "Calidad Estimación", "Referente BI", "ID",

## Python function: estado_iniciativa(portfolio_id:str) --> str

This function should replace the following excel calculation:

=LAMBDA(portfolioID; LET( estadoEspecial; XLOOKUP(portfolioID;EstadoEspecial[Portfolio ID];EstadoEspecial[Estado Especial];"No encontrado"); IF( estadoEspecial <> "No encontrado"; estadoEspecial; "No tiene estado especial" ) ) )

## Python function: fecha_estado(portfolio_id:str, estado:str) --> str

This function should replace the following excel calculation:

=LAMBDA(portfolioID;estado;IFERROR(MAX(CHOOSECOLS(SORT(FILTER(Hechos[#Data]; (Hechos[PORTFOLIO ID] = portfolioID) \* (Hechos[Estado] = estado); "No encontrado"); 6); 6)); ""))

## Python function: fecha_de_ultimo_estado(portfolio_id:str) --> datetime

This function should replace the following excel calculation:

=LAMBDA(portfolioID;IFERROR(LET(ultID; UltimoID(portfolioID; ""); TAKE(CHOOSECOLS(FILTER(Hechos[#Data]; ((Hechos[PORTFOLIO ID] = portfolioID) \* (Hechos[ID] = ultID))); 6); 1)); "Estado erróneo"))

## Python function: estado_aprobacion_iniciativa(portfolio_id:str) --> str

This function should replace the following excel calculation:

=LAMBDA(portfolioID;IFERROR(LET(ultID; UltimoID(portfolioID; ""); TAKE(CHOOSECOLS(FILTER(Hechos[#Data]; ((Hechos[PORTFOLIO ID] = portfolioID) _ (Hechos[ID] = ultID) _ ((Hechos[Estado] <> "En ejecución") + (Hechos[Estado] <> "Finalizado") + (Hechos[Estado] <> "Pendiente PES") + (Hechos[Estado] <> "PES Completado")))); 5); 1)); "Estado erróneo"))

## Python function: estado_ejecucion_iniciativa(portfolio_id: str) --> str

This function should replace the following excel calculation:

=LAMBDA(portfolioID;IFERROR(LET(ultID; UltimoID(portfolioID; ""); TAKE(CHOOSECOLS(FILTER(Hechos[#Data]; ((Hechos[PORTFOLIO ID] = portfolioID) _ (Hechos[ID] = ultID) _ ((Hechos[Estado] = "En ejecución") + (Hechos[Estado] = "Finalizado") + (Hechos[Estado] = "Pendiente PES") + (Hechos[Estado] = "PES Completado")))); 5); 1)); "No iniciada"))

## Python function: en_presupuesto_del_ano(portfolio_id:str) --> boolean

This function should replace the following excel calculation:

=LAMBDA(portfolioID;partidaPresupuestaria;LET(lookupArr; CHOOSECOLS(FILTER(Hechos[#Data]; Hechos[Partida presupuestaria] = partidaPresupuestaria; "No encontrado"); 1); IF(XLOOKUP(portfolioID; lookupArr; lookupArr; "No") <> "No"; "Sí"; "No")))

## Python function: importe(portfolio_id:str, ano:int, tipo_importe:str) --> decimal

This function should replace the following excel calculation, the calculation will depend on the value of tipo_importe, in the following way

when tipo_importe = "Aprobado"

=LAMBDA(portfolioID;partidaPresupuestaria;LET(estadoAprobación; EstadoAprobaciónIniciativa(portfolioID); importeEnAprobación; ImporteIniciativaEnAprobación(portfolioID; partidaPresupuestaria); importeSM200; ImporteSM200Iniciativa(portfolioID; partidaPresupuestaria); IF(OR(estadoAprobación = "Aprobada"; estadoAprobación = "Aprobada con CCT"); IF(importeEnAprobación <> 0; importeEnAprobación; importeSM200); 0)))

when tipo_importe = "Importe"

=LAMBDA(portfolioID;partidaPresupuestaria;tipoAgrupacion;IFERROR(CHOOSECOLS(TAKE(CHOOSECOLS(SORT(FILTER(Hechos[#Data]; ((Hechos[PORTFOLIO ID] = portfolioID) _ (Hechos[Partida presupuestaria] = partidaPresupuestaria) _ (Hechos[Importe] <> 0) \* ((Hechos[Estado] = "SM200 Final") + (Hechos[Estado] = "Importe Planificado") + (Hechos[Estado] = "Aprobada") + (Hechos[Estado] = "Aprobada con CCT") + (Hechos[Estado] = "Revisión Regulación") + (Hechos[Estado] = "En ejecución") + (Hechos[Estado] = "SM200 En Revisión"))); ); 13; -1); 1; 2; 3; 4; 5); 1); 4); 0))

when tipo_importe = "En Aprobación"

=LAMBDA(portfolioID;partidaPresupuestaria;IFERROR(CHOOSECOLS(TAKE(CHOOSECOLS(SORT(FILTER(Hechos[#Data]; ((Hechos[PORTFOLIO ID] = portfolioID) _ (Hechos[Partida presupuestaria] = partidaPresupuestaria) _ (Hechos[Importe] <> 0) \* ((Hechos[Estado] = "Aprobada") + (Hechos[Estado] = "Aprobada con CCT"))); ); 13; -1); 1; 2; 3; 4; 5); 1); 4); 0))

when tipo_importe = "Importe RE"

=LAMBDA(portfolioID;partidaPresupuestaria;IFERROR(CHOOSECOLS(TAKE(CHOOSECOLS(SORT(FILTER(Hechos[#Data]; ((Hechos[PORTFOLIO ID] = portfolioID) _ (Hechos[Partida presupuestaria] = partidaPresupuestaria) _ (Hechos[Importe] <> 0) \* ((Hechos[Estado] = "SM200 Final") + (Hechos[Estado] = "Aprobada") + (Hechos[Estado] = "Aprobada con CCT") + (Hechos[Estado] = "Revisión Regulación") + (Hechos[Estado] = "En ejecución") + (Hechos[Estado] = "SM200 En Revisión"))); ); 13; -1); 1; 2; 3; 4; 5; 6; 7; 8); 1); 8); 0))

when tipo_importe = "Importe Planificado Fijo"

=LAMBDA(portfolioID;partidaPresupuestaria;IFERROR(CHOOSECOLS(TAKE(CHOOSECOLS(SORT(FILTER(Hechos[#Data]; ((Hechos[PORTFOLIO ID] = portfolioID) _ (Hechos[Partida presupuestaria] = partidaPresupuestaria) _ (Hechos[Importe] <> 0) \* (Hechos[Estado] = "Importe Planificado")); ); 6); 1; 2; 3; 4; 5); -1); 4); 0))

when tipo_importe = "Planificado"

=LAMBDA(portfolioID;partidaPresupuestaria; LET( ipfi;ImportePlanificadoFijoIniciativa(portfolioID;partidaPresupuestaria); ism;ImporteSM200Iniciativa(portfolioID;partidaPresupuestaria); ii;ImporteIniciativa(portfolioID;partidaPresupuestaria;""); IF(ipfi<>0;ipfi;IF(ism<>0;ism;IF(ii<>0;ii;0))) ) )

when tipo_importe = "SM200"

=LAMBDA(portfolioID;partidaPresupuestaria;IFERROR(CHOOSECOLS(TAKE(CHOOSECOLS(SORT(FILTER(Hechos[#Data]; ((Hechos[PORTFOLIO ID] = portfolioID) _ (Hechos[Partida presupuestaria] = partidaPresupuestaria) _ (Hechos[Importe] <> 0) \* ((Hechos[Estado] = "SM200 Final") + (Hechos[Estado] = "SM200 En Revisión"))); ); 13; -1); 1; 2; 3; 4; 5); 1); 4); 0))

## Python function: ultimo_id() --> int

This function should replace the following excel calculation:

=LAMBDA(portfolioID;partidaPresupuestaria;IF(OR(ISBLANK(partidaPresupuestaria); partidaPresupuestaria = ""; partidaPresupuestaria = 0); CHOOSECOLS(TAKE(SORT(FILTER(Hechos[#Data]; ((Hechos[PORTFOLIO ID] = portfolioID) _ (Hechos[Estado] <> "Importe Planificado"))); 13; -1); 1); 13); CHOOSECOLS(TAKE(SORT(FILTER(Hechos[#Data]; ((Hechos[PORTFOLIO ID] = portfolioID) _ (Hechos[Partida presupuestaria] = partidaPresupuestaria) \* (Hechos[Estado] <> "Importe Planificado"))); 13; -1); 1); 13)))

## Python function: calidad_valoracion(portfolio_id:str, ano:int)

This function should replace the following excel calculation:

=LAMBDA(portfolioID;partidaPresupuestaria;IFERROR(CHOOSECOLS(TAKE(CHOOSECOLS(SORT(FILTER(Hechos[#Data]; ((Hechos[PORTFOLIO ID] = portfolioID) _ (Hechos[Partida presupuestaria] = partidaPresupuestaria) _ (Hechos[Importe] <> 0)); ); 6); 1; 2; 3; 4; 5; 11); -1); 6); "NO CALIFICADA"))

## Python function: estado_agrupado(portfolio_id:str)

To be implemented later

## Python function: siguiente_accion(portfolio_id:str, ano:int)

To be implemented later

## Python function: estado_dashboard(portfolio_id:str)

To be implemented later

## Python function: estado_requisito_legal(portfolio_id)

To be implemented later

## Python function: fecha_iniciativa(portfolio_id:str,"SM100 Final")

To be implemented later

## Python function: esta_en_los_206_me_de_2026(portfolio_id:str)

To be implemented later

## Python function: fecha_limite(portfolio_id:str)

To be implemented later

## Python function: fecha_limite_comentarios(portfolio_id:str)

To be implemented later
