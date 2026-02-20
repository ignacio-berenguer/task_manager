"""
SQLAlchemy ORM models for all database tables.
"""
from sqlalchemy import Column, Integer, Text, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from .database import Base


class Iniciativa(Base):
    """Main portfolio initiatives table."""
    __tablename__ = "iniciativas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Text, nullable=False, unique=True)
    nombre = Column(Text)
    unidad = Column(Text)
    origen = Column(Text)
    digital_framework_level_1 = Column(Text)
    prioridad_descriptiva = Column(Text)
    cluster = Column(Text)
    estado_de_la_iniciativa = Column(Text)
    fecha_de_ultimo_estado = Column(Text)
    estado_de_la_iniciativa_2026 = Column(Text)
    estado_aprobacion = Column(Text)
    estado_ejecucion = Column(Text)
    priorizacion = Column(Text)
    en_presupuesto_del_ano = Column(Text)
    tipo = Column(Text)
    budget_2024 = Column(Float)
    importe_sm200_24 = Column(Float)
    importe_aprobado_2024 = Column(Float)
    importe_citetic_24 = Column(Float)
    importe_facturacion_2024 = Column(Float)
    importe_2024 = Column(Float)
    budget_2025 = Column(Float)
    importe_sm200_2025 = Column(Float)
    importe_aprobado_2025 = Column(Float)
    importe_facturacion_2025 = Column(Float)
    importe_2025 = Column(Float)
    importe_2025_cc_re = Column(Float)
    calidad_valoracion = Column(Text)
    budget_2026 = Column(Float)
    importe_sm200_2026 = Column(Float)
    importe_aprobado_2026 = Column(Float)
    importe_facturacion_2026 = Column(Float)
    importe_2026 = Column(Float)
    budget_2027 = Column(Float)
    importe_sm200_2027 = Column(Float)
    importe_aprobado_2027 = Column(Float)
    importe_facturacion_2027 = Column(Float)
    importe_2027 = Column(Float)
    importe_2028 = Column(Float)
    estado_agrupado = Column(Text)
    siguiente_accion = Column(Text)
    referente_negocio = Column(Text)
    estado_dashboard = Column(Text)
    referente_bi = Column(Text)
    jira_id = Column(Text)
    it_partner = Column(Text)
    referente_ict = Column(Text)
    capex_opex = Column(Text)
    cini = Column(Text)
    fecha_prevista_pes = Column(Text)
    tipo_agrupacion = Column(Text)
    nuevo_importe_2025 = Column(Float)
    estado_requisito_legal = Column(Text)
    cluster_de_antes_de_1906 = Column(Text)
    fecha_sm100 = Column(Text)
    fecha_aprobada_con_cct = Column(Text)
    fecha_en_ejecucion = Column(Text)
    diferencia_apr_eje_exc_ept = Column(Float)
    esta_en_los_206_me_de_2026 = Column(Text)
    fecha_limite = Column(Text)
    fecha_limite_comentarios = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime)


class DatosDescriptivo(Base):
    """Descriptive data for initiatives."""
    __tablename__ = "datos_descriptivos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Text, nullable=False)
    nombre = Column(Text)
    unidad = Column(Text)
    origen = Column(Text)
    digital_framework_level_1 = Column(Text)
    prioridad_descriptiva_bi = Column(Text)
    priorizacion = Column(Text)
    tipo_proyecto = Column(Text)
    referente_bi = Column(Text)
    referente_b_unit = Column(Text)
    referente_enabler_ict = Column(Text)
    it_partner = Column(Text)
    codigo_jira = Column(Text)
    cluster = Column(Text)
    tipo_agrupacion = Column(Text)
    cluster_2025_antes_de_19062025 = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime)


class GrupoIniciativa(Base):
    """Initiative groups with hierarchy."""
    __tablename__ = "grupos_iniciativas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id_grupo = Column(Text)
    portfolio_id_componente = Column(Text)
    nombre_grupo = Column(Text)
    tipo_agrupacion_grupo = Column(Text)
    tipo_agrupacion_componente = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime)


class InformacionEconomica(Base):
    """Economic information."""
    __tablename__ = "informacion_economica"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Text, nullable=False, unique=True)
    cini = Column(Text)
    capex_opex = Column(Text)
    fecha_prevista_pes = Column(Text)
    wbe = Column(Text)
    cluster = Column(Text)
    finalidad_budget = Column(Text)
    proyecto_especial = Column(Text)
    clasificacion = Column(Text)
    tlc = Column(Text)
    tipo_inversion = Column(Text)
    observaciones = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime)


class Facturacion(Base):
    """Billing records."""
    __tablename__ = "facturacion"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Text, nullable=False)
    ano = Column(Integer)
    mes = Column(Text)
    importe = Column(Float)
    concepto_factura = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime)


class DatosEjecucion(Base):
    """Execution/milestone data."""
    __tablename__ = "datos_ejecucion"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Text, nullable=False)
    fecha_inicio = Column(Text)
    fecha_uat = Column(Text)
    fecha_fin = Column(Text)
    porcentaje_avance = Column(Float)
    en_retraso = Column(Text)
    porcentaje_facturacion = Column(Float)
    comentarios = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime)


class Hecho(Base):
    """Detailed fact records."""
    __tablename__ = "hechos"

    id_hecho = Column(Integer, primary_key=True)
    portfolio_id = Column(Text, nullable=False)
    partida_presupuestaria = Column(Text)
    importe = Column(Float)
    estado = Column(Text)
    fecha = Column(Text)
    importe_ri = Column(Float)
    importe_re = Column(Float)
    notas = Column(Text)
    racional = Column(Text)
    calidad_estimacion = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime)


class Beneficio(Base):
    """Benefits."""
    __tablename__ = "beneficios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Text, nullable=False)
    grupo = Column(Text)
    concepto = Column(Text)
    periodo = Column(Text)
    importe = Column(Float)
    valor = Column(Float)
    texto = Column(Text)
    origen = Column(Text)
    fecha_modificacion = Column(Text)
    columna_tablon = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime)


class Etiqueta(Base):
    """Tag/label assignments."""
    __tablename__ = "etiquetas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Text, nullable=False)
    etiqueta = Column(Text)
    valor = Column(Text)
    fecha_modificacion = Column(Text)
    origen_registro = Column(Text)
    comentarios = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime)


class Justificacion(Base):
    """Justifications for initiatives."""
    __tablename__ = "justificaciones"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Text, nullable=False)
    tipo_justificacion = Column(Text)
    valor = Column(Text)
    fecha_modificacion = Column(Text)
    origen_registro = Column(Text)
    comentarios = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime)


class LTP(Base):
    """Pending tasks (Línea Tareas Pendientes)."""
    __tablename__ = "ltp"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Text, nullable=False)
    responsable = Column(Text)
    tarea = Column(Text)
    siguiente_accion = Column(Text)
    fecha_creacion = Column(Text)
    estado = Column(Text)
    comentarios = Column(Text)
    fecha_actualizacion = Column(DateTime)


class WBE(Base):
    """SAP WBEs."""
    __tablename__ = "wbes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Text, nullable=False)
    anio = Column(Integer)
    wbe_pyb = Column(Text)
    descripcion_pyb = Column(Text)
    wbe_can = Column(Text)
    descripcion_can = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime)


class Dependencia(Base):
    """Dependencies between initiatives."""
    __tablename__ = "dependencias"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Text, nullable=False)
    descripcion_dependencia = Column(Text)
    fecha_dependencia = Column(Text)
    comentarios = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime)


class Nota(Base):
    """Notes for initiatives."""
    __tablename__ = "notas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Text, nullable=False)
    registrado_por = Column(Text)
    fecha = Column(Text)
    nota = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime)


class Avance(Base):
    """Progress tracking for initiatives."""
    __tablename__ = "avance"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Text, nullable=False)
    fecha_introduccion = Column(Text)
    anio = Column(Integer)
    mes = Column(Text)
    fecha_inicio = Column(Text)
    fecha_uat = Column(Text)
    fecha_fin_prevista = Column(Text)
    avance_2025 = Column(Float)
    comentario = Column(Text)
    error_fecha_inicio = Column(Text)
    error_fecha_uat = Column(Text)
    error_fecha_fin_prevista = Column(Text)
    error_avance = Column(Text)
    tiene_error = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime)


class Accion(Base):
    """Actions for initiatives."""
    __tablename__ = "acciones"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Text, nullable=False)
    siguiente_accion = Column(Text)
    siguiente_accion_comentarios = Column(Text)
    comentarios = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime)


class Descripcion(Base):
    """Descriptions for initiatives."""
    __tablename__ = "descripciones"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Text, nullable=False)
    tipo_descripcion = Column(Text)
    descripcion = Column(Text)
    fecha_modificacion = Column(Text)
    origen_registro = Column(Text)
    comentarios = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime)


class EstadoEspecial(Base):
    """Special status for initiatives."""
    __tablename__ = "estado_especial"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Text, nullable=False, unique=True)
    estado_especial = Column(Text)
    fecha_modificacion = Column(Text)
    comentarios = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime)


class InvestmentMemo(Base):
    """Investment Memo tracking."""
    __tablename__ = "investment_memos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Text, nullable=False, unique=True)
    descripcion = Column(Text)
    fecha_investment_memo_aprobado = Column(Text)
    new_capex_dev = Column(Float)
    new_capex_maint = Column(Float)
    new_opex_ict = Column(Float)
    referente_negocio = Column(Text)
    link_im = Column(Text)
    fecha_inicio_proyecto = Column(Text)
    fecha_final_proyecto = Column(Text)
    estado_proyecto = Column(Text)
    investment_2024 = Column(Float)
    investment_2025 = Column(Float)
    investment_2026 = Column(Float)
    investment_2027 = Column(Float)
    investment_2028 = Column(Float)
    investment_2029 = Column(Float)
    investment_2030 = Column(Float)
    benefits_2024 = Column(Float)
    benefits_2024_margin_increase = Column(Float)
    benefits_2024_opex_reduction_business = Column(Float)
    benefits_2024_opex_reduction_ict = Column(Float)
    other_benefits_2024 = Column(Float)
    benefits_2025 = Column(Float)
    benefits_2025_margin_increase = Column(Float)
    benefits_2025_opex_reduction_business = Column(Float)
    benefits_2025_opex_reduction_ict = Column(Float)
    other_benefits_2025 = Column(Float)
    benefits_2026 = Column(Float)
    benefits_2026_margin_increase = Column(Float)
    benefits_2026_opex_reduction_business = Column(Float)
    benefits_2026_opex_reduction_ict = Column(Float)
    other_benefits_2026 = Column(Float)
    total_benefits_2027 = Column(Float)
    benefits_2027_margin_increase = Column(Float)
    benefits_2027_opex_reduction_business = Column(Float)
    benefits_2027_opex_reduction_ict = Column(Float)
    other_benefits_2027 = Column(Float)
    total_benefits_2028 = Column(Float)
    benefits_2028_margin_increase = Column(Float)
    benefits_2028_opex_reduction_business = Column(Float)
    benefits_2028_opex_reduction_ict = Column(Float)
    other_benefits_2028 = Column(Float)
    total_benefits_2029 = Column(Float)
    benefits_2029_margin_increase = Column(Float)
    benefits_2029_opex_reduction_business = Column(Float)
    benefits_2029_opex_reduction_ict = Column(Float)
    other_benefits_2029 = Column(Float)
    total_benefits_2030 = Column(Float)
    benefits_2030_margin_increase = Column(Float)
    benefits_2030_opex_reduction_business = Column(Float)
    benefits_2030_opex_reduction_ict = Column(Float)
    other_benefits_2030 = Column(Float)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime)


class ImpactoAATT(Base):
    """AATT Impact assessment."""
    __tablename__ = "impacto_aatt"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Text, nullable=False, unique=True)
    tiene_impacto_en_aatt = Column(Text)
    afecta_a_ut_red_mt_bt = Column(Text)
    afecta_om_cc = Column(Text)
    afecta_pm = Column(Text)
    afecta_hseq = Column(Text)
    afecta_inspecciones = Column(Text)
    afecta_at = Column(Text)
    comentarios = Column(Text)
    unidad = Column(Text)
    referente_bi = Column(Text)
    it_partner = Column(Text)
    referente_b_unit = Column(Text)
    porcentaje_avance_ict = Column(Float)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime)


class Transaccion(Base):
    """Audit trail for portfolio changes."""
    __tablename__ = "transacciones"

    id = Column(Integer, primary_key=True)
    clave1 = Column(Text)
    clave2 = Column(Text)
    tabla = Column(Text)
    campo_tabla = Column(Text)
    valor_nuevo = Column(Text)
    tipo_cambio = Column(Text)
    estado_cambio = Column(Text)
    fecha_registro_cambio = Column(Text)
    fecha_ejecucion_cambio = Column(Text)
    valor_antes_del_cambio = Column(Text)
    comentarios = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime)


class Ficha(Base):
    """Card/sheet data for portfolio items."""
    __tablename__ = "fichas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Text, nullable=False)
    fecha = Column(Text)
    campo_ficha = Column(Text)
    subtitulo = Column(Text)
    periodo = Column(Integer)
    valor = Column(Text)
    procesado_beneficios = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime)


class DatosRelevante(Base):
    """Computed data for reporting."""
    __tablename__ = "datos_relevantes"

    portfolio_id = Column(Text, primary_key=True)
    nombre = Column(Text)
    unidad = Column(Text)
    origen = Column(Text)
    digital_framework_level_1 = Column(Text)
    prioridad_descriptiva = Column(Text)
    cluster = Column(Text)
    priorizacion = Column(Text)
    tipo = Column(Text)
    referente_negocio = Column(Text)
    referente_bi = Column(Text)
    jira_id = Column(Text)
    it_partner = Column(Text)
    referente_ict = Column(Text)
    tipo_agrupacion = Column(Text)
    capex_opex = Column(Text)
    cini = Column(Text)
    fecha_prevista_pes = Column(Text)
    estado_de_la_iniciativa = Column(Text)
    fecha_de_ultimo_estado = Column(Text)
    estado_de_la_iniciativa_2026 = Column(Text)
    estado_aprobacion = Column(Text)
    estado_ejecucion = Column(Text)
    estado_agrupado = Column(Text)
    estado_dashboard = Column(Text)
    estado_requisito_legal = Column(Text)
    estado_sm100 = Column(Text)
    estado_sm200 = Column(Text)
    iniciativa_aprobada = Column(Text)
    iniciativa_cerrada_economicamente = Column(Text)
    activo_ejercicio_actual = Column(Text)
    budget_2024 = Column(Float)
    importe_sm200_24 = Column(Float)
    importe_aprobado_2024 = Column(Float)
    importe_citetic_24 = Column(Float)
    importe_facturacion_2024 = Column(Float)
    importe_2024 = Column(Float)
    budget_2025 = Column(Float)
    importe_sm200_2025 = Column(Float)
    importe_aprobado_2025 = Column(Float)
    importe_facturacion_2025 = Column(Float)
    importe_2025 = Column(Float)
    importe_2025_cc_re = Column(Float)
    nuevo_importe_2025 = Column(Float)
    budget_2026 = Column(Float)
    importe_sm200_2026 = Column(Float)
    importe_aprobado_2026 = Column(Float)
    importe_facturacion_2026 = Column(Float)
    importe_2026 = Column(Float)
    budget_2027 = Column(Float)
    importe_sm200_2027 = Column(Float)
    importe_aprobado_2027 = Column(Float)
    importe_facturacion_2027 = Column(Float)
    importe_2027 = Column(Float)
    importe_2028 = Column(Float)
    en_presupuesto_del_ano = Column(Text)
    calidad_valoracion = Column(Text)
    siguiente_accion = Column(Text)
    esta_en_los_206_me_de_2026 = Column(Text)
    fecha_sm100 = Column(Text)
    fecha_aprobada_con_cct = Column(Text)
    fecha_en_ejecucion = Column(Text)
    fecha_limite = Column(Text)
    fecha_limite_comentarios = Column(Text)
    diferencia_apr_eje_exc_ept = Column(Float)
    cluster_de_antes_de_1906 = Column(Text)
    fecha_calculo = Column(DateTime, default=func.now())


class TransaccionJson(Base):
    """JSON-based transaction diffs for application-level CRUD."""
    __tablename__ = "transacciones_json"

    id = Column(Integer, primary_key=True, autoincrement=True)
    entidad = Column(Text, nullable=False)
    tipo_operacion = Column(Text, nullable=False)
    clave_primaria = Column(Text, nullable=False)
    clave_primaria_excel = Column(Text)
    cambios = Column(Text)
    usuario = Column(Text)
    mensaje_commit = Column(Text)
    estado_db = Column(Text, nullable=False, default="PENDIENTE")
    estado_excel = Column(Text, nullable=False, default="PENDIENTE")
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_ejecucion_db = Column(DateTime)
    fecha_ejecucion_excel = Column(DateTime)
    error_detalle = Column(Text)
    valores_previos_excel = Column(Text)
    portfolio_id = Column(Text)


class MigracionMetadata(Base):
    """Track migration progress and statistics."""
    __tablename__ = "migracion_metadata"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tabla_destino = Column(Text, nullable=False)
    archivo_origen = Column(Text, nullable=False)
    hoja_origen = Column(Text, nullable=False)
    filas_origen = Column(Integer)
    filas_migradas = Column(Integer)
    filas_error = Column(Integer)
    fecha_inicio = Column(DateTime)
    fecha_fin = Column(DateTime)
    duracion_segundos = Column(Float)
    estado = Column(Text)
    mensaje_error = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())


class Parametro(Base):
    """Parametric values for dropdown options."""
    __tablename__ = "parametros"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre_parametro = Column(Text, nullable=False)
    valor = Column(Text, nullable=False)
    color = Column(Text, nullable=True)
    orden = Column(Integer)
    fecha_creacion = Column(DateTime, default=func.now())


class EtiquetaDestacada(Base):
    """Highlighted etiquetas (parametric table)."""
    __tablename__ = "etiquetas_destacadas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    etiqueta = Column(Text, nullable=False, unique=True)
    color = Column(Text, default="blue")
    orden = Column(Integer)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime)


class Documento(Base):
    """Documents associated with initiatives."""
    __tablename__ = "documentos"

    nombre_fichero = Column(Text, primary_key=True)
    portfolio_id = Column(Text, nullable=False)
    tipo_documento = Column(Text, nullable=False)
    enlace_documento = Column(Text)
    estado_proceso_documento = Column(Text, nullable=False, default="Pendiente")
    resumen_documento = Column(Text)
    ruta_documento = Column(Text)
    tokens_input = Column(Integer)
    tokens_output = Column(Integer)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime)


class DocumentoItem(Base):
    """Document items expanded from resumen_documento JSON."""
    __tablename__ = "documentos_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Text, nullable=False)
    nombre_fichero = Column(Text, nullable=False)
    tipo_documento = Column(Text, nullable=False)
    tipo_registro = Column(Text, nullable=False)
    texto = Column(Text)
