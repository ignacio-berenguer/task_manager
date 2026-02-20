"""
Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Any, Literal


# =============================================================================
# Search Schemas
# =============================================================================

class SearchFilter(BaseModel):
    """Single filter condition for search."""
    field: str
    operator: Literal[
        "eq", "ne", "gt", "gte", "lt", "lte",
        "like", "ilike", "in", "not_in",
        "is_null", "is_not_null"
    ]
    value: Any = None


class SearchRequest(BaseModel):
    """Search request with filters, ordering, and pagination."""
    filters: list[SearchFilter] = []
    order_by: str | None = None
    order_dir: Literal["asc", "desc"] = "asc"
    limit: int = Field(default=100, le=1000)
    offset: int = Field(default=0, ge=0)


class PaginatedResponse(BaseModel):
    """Paginated response wrapper."""
    total: int
    data: list[dict]
    limit: int
    offset: int


class PortfolioSearchRequest(BaseModel):
    """Request to search across tables by portfolio_ids."""
    portfolio_ids: list[str]
    tables: list[str] | None = None


# =============================================================================
# Iniciativa Schemas
# =============================================================================

class IniciativaBase(BaseModel):
    portfolio_id: str
    nombre: str | None = None
    unidad: str | None = None
    origen: str | None = None
    digital_framework_level_1: str | None = None
    prioridad_descriptiva: str | None = None
    cluster: str | None = None
    estado_de_la_iniciativa: str | None = None
    fecha_de_ultimo_estado: str | None = None
    estado_aprobacion: str | None = None
    estado_ejecucion: str | None = None
    tipo: str | None = None


class IniciativaCreate(IniciativaBase):
    pass


class IniciativaUpdate(BaseModel):
    nombre: str | None = None
    unidad: str | None = None
    origen: str | None = None
    digital_framework_level_1: str | None = None
    prioridad_descriptiva: str | None = None
    cluster: str | None = None
    estado_de_la_iniciativa: str | None = None
    fecha_de_ultimo_estado: str | None = None
    estado_aprobacion: str | None = None
    estado_ejecucion: str | None = None
    tipo: str | None = None


class Iniciativa(IniciativaBase):
    id: int
    fecha_creacion: datetime | None = None
    fecha_actualizacion: datetime | None = None

    class Config:
        from_attributes = True


# =============================================================================
# DatosDescriptivo Schemas
# =============================================================================

class DatosDescriptivoBase(BaseModel):
    portfolio_id: str
    nombre: str | None = None
    unidad: str | None = None
    origen: str | None = None
    digital_framework_level_1: str | None = None
    cluster: str | None = None


class DatosDescriptivoCreate(DatosDescriptivoBase):
    pass


class DatosDescriptivoUpdate(BaseModel):
    nombre: str | None = None
    unidad: str | None = None
    origen: str | None = None


class DatosDescriptivo(DatosDescriptivoBase):
    id: int
    fecha_creacion: datetime | None = None

    class Config:
        from_attributes = True


# =============================================================================
# Hecho Schemas
# =============================================================================

class HechoBase(BaseModel):
    portfolio_id: str
    nombre: str | None = None
    partida_presupuestaria: str | None = None
    importe: float | None = None
    estado: str | None = None
    fecha: str | None = None


class HechoCreate(HechoBase):
    id_hecho: int


class HechoUpdate(BaseModel):
    nombre: str | None = None
    partida_presupuestaria: str | None = None
    importe: float | None = None
    estado: str | None = None
    fecha: str | None = None


class Hecho(HechoBase):
    id_hecho: int
    fecha_creacion: datetime | None = None

    class Config:
        from_attributes = True


# =============================================================================
# Etiqueta Schemas
# =============================================================================

class EtiquetaBase(BaseModel):
    portfolio_id: str
    etiqueta: str | None = None
    valor: str | None = None


class EtiquetaCreate(EtiquetaBase):
    pass


class EtiquetaUpdate(BaseModel):
    etiqueta: str | None = None
    valor: str | None = None


class Etiqueta(EtiquetaBase):
    id: int
    fecha_creacion: datetime | None = None

    class Config:
        from_attributes = True


# =============================================================================
# Ficha Schemas
# =============================================================================

class FichaBase(BaseModel):
    portfolio_id: str
    fecha: str | None = None
    campo_ficha: str | None = None
    subtitulo: str | None = None
    periodo: int | None = None
    valor: str | None = None


class FichaCreate(FichaBase):
    pass


class FichaUpdate(BaseModel):
    fecha: str | None = None
    campo_ficha: str | None = None
    valor: str | None = None


class Ficha(FichaBase):
    id: int
    fecha_creacion: datetime | None = None

    class Config:
        from_attributes = True


# =============================================================================
# InformacionEconomica Schemas
# =============================================================================

class InformacionEconomicaBase(BaseModel):
    portfolio_id: str
    nombre: str | None = None
    cini: str | None = None
    capex_opex: str | None = None


class InformacionEconomicaCreate(InformacionEconomicaBase):
    pass


class InformacionEconomicaUpdate(BaseModel):
    nombre: str | None = None
    cini: str | None = None
    capex_opex: str | None = None


class InformacionEconomica(InformacionEconomicaBase):
    id: int
    fecha_creacion: datetime | None = None

    class Config:
        from_attributes = True


# =============================================================================
# Accion Schemas
# =============================================================================

class AccionBase(BaseModel):
    portfolio_id: str
    nombre: str | None = None
    unidad: str | None = None
    estado: str | None = None


class AccionCreate(AccionBase):
    pass


class AccionUpdate(BaseModel):
    nombre: str | None = None
    unidad: str | None = None
    estado: str | None = None


class Accion(AccionBase):
    id: int
    fecha_creacion: datetime | None = None

    class Config:
        from_attributes = True


# =============================================================================
# Beneficio Schemas
# =============================================================================

class BeneficioCreate(BaseModel):
    portfolio_id: str
    grupo: str | None = None
    concepto: str | None = None
    periodo: str | None = None
    importe: float | None = None
    valor: float | None = None
    texto: str | None = None
    origen: str | None = None
    fecha_modificacion: str | None = None
    columna_tablon: str | None = None


class BeneficioUpdate(BaseModel):
    grupo: str | None = None
    concepto: str | None = None
    periodo: str | None = None
    importe: float | None = None
    valor: float | None = None
    texto: str | None = None
    origen: str | None = None
    fecha_modificacion: str | None = None
    columna_tablon: str | None = None


# =============================================================================
# Facturacion Schemas
# =============================================================================

class FacturacionCreate(BaseModel):
    portfolio_id: str
    ano: int | None = None
    mes: str | None = None
    importe: float | None = None
    concepto_factura: str | None = None


class FacturacionUpdate(BaseModel):
    ano: int | None = None
    mes: str | None = None
    importe: float | None = None
    concepto_factura: str | None = None


# =============================================================================
# Nota Schemas
# =============================================================================

class NotaCreate(BaseModel):
    portfolio_id: str
    registrado_por: str | None = None
    fecha: str | None = None
    nota: str | None = None


class NotaUpdate(BaseModel):
    registrado_por: str | None = None
    fecha: str | None = None
    nota: str | None = None


# =============================================================================
# Avance Schemas
# =============================================================================

class AvanceCreate(BaseModel):
    portfolio_id: str
    fecha_introduccion: str | None = None
    anio: int | None = None
    mes: str | None = None
    fecha_inicio: str | None = None
    fecha_uat: str | None = None
    fecha_fin_prevista: str | None = None
    avance_2025: float | None = None
    comentario: str | None = None


class AvanceUpdate(BaseModel):
    fecha_introduccion: str | None = None
    anio: int | None = None
    mes: str | None = None
    fecha_inicio: str | None = None
    fecha_uat: str | None = None
    fecha_fin_prevista: str | None = None
    avance_2025: float | None = None
    comentario: str | None = None


# =============================================================================
# Descripcion Schemas
# =============================================================================

class DescripcionCreate(BaseModel):
    portfolio_id: str
    tipo_descripcion: str | None = None
    descripcion: str | None = None
    fecha_modificacion: str | None = None
    origen_registro: str | None = None
    comentarios: str | None = None


class DescripcionUpdate(BaseModel):
    tipo_descripcion: str | None = None
    descripcion: str | None = None
    fecha_modificacion: str | None = None
    origen_registro: str | None = None
    comentarios: str | None = None


# =============================================================================
# EstadoEspecial Schemas
# =============================================================================

class EstadoEspecialCreate(BaseModel):
    portfolio_id: str
    estado_especial: str | None = None
    fecha_modificacion: str | None = None
    comentarios: str | None = None


class EstadoEspecialUpdate(BaseModel):
    estado_especial: str | None = None
    fecha_modificacion: str | None = None
    comentarios: str | None = None


# =============================================================================
# InvestmentMemo Schemas
# =============================================================================

class InvestmentMemoCreate(BaseModel):
    portfolio_id: str
    descripcion: str | None = None
    fecha_investment_memo_aprobado: str | None = None
    new_capex_dev: float | None = None
    new_capex_maint: float | None = None
    new_opex_ict: float | None = None
    referente_negocio: str | None = None
    link_im: str | None = None
    fecha_inicio_proyecto: str | None = None
    fecha_final_proyecto: str | None = None
    estado_proyecto: str | None = None
    investment_2024: float | None = None
    investment_2025: float | None = None
    investment_2026: float | None = None
    investment_2027: float | None = None
    investment_2028: float | None = None
    investment_2029: float | None = None
    investment_2030: float | None = None


class InvestmentMemoUpdate(BaseModel):
    descripcion: str | None = None
    fecha_investment_memo_aprobado: str | None = None
    new_capex_dev: float | None = None
    new_capex_maint: float | None = None
    new_opex_ict: float | None = None
    referente_negocio: str | None = None
    link_im: str | None = None
    fecha_inicio_proyecto: str | None = None
    fecha_final_proyecto: str | None = None
    estado_proyecto: str | None = None
    investment_2024: float | None = None
    investment_2025: float | None = None
    investment_2026: float | None = None
    investment_2027: float | None = None
    investment_2028: float | None = None
    investment_2029: float | None = None
    investment_2030: float | None = None


# =============================================================================
# ImpactoAATT Schemas
# =============================================================================

class ImpactoAATTCreate(BaseModel):
    portfolio_id: str
    tiene_impacto_en_aatt: str | None = None
    afecta_a_ut_red_mt_bt: str | None = None
    afecta_om_cc: str | None = None
    afecta_pm: str | None = None
    afecta_hseq: str | None = None
    afecta_inspecciones: str | None = None
    afecta_at: str | None = None
    comentarios: str | None = None
    unidad: str | None = None
    referente_bi: str | None = None
    it_partner: str | None = None
    referente_b_unit: str | None = None
    porcentaje_avance_ict: float | None = None


class ImpactoAATTUpdate(BaseModel):
    tiene_impacto_en_aatt: str | None = None
    afecta_a_ut_red_mt_bt: str | None = None
    afecta_om_cc: str | None = None
    afecta_pm: str | None = None
    afecta_hseq: str | None = None
    afecta_inspecciones: str | None = None
    afecta_at: str | None = None
    comentarios: str | None = None
    unidad: str | None = None
    referente_bi: str | None = None
    it_partner: str | None = None
    referente_b_unit: str | None = None
    porcentaje_avance_ict: float | None = None


# =============================================================================
# DatosEjecucion Schemas
# =============================================================================

class DatosEjecucionCreate(BaseModel):
    portfolio_id: str
    fecha_inicio: str | None = None
    fecha_uat: str | None = None
    fecha_fin: str | None = None
    porcentaje_avance: float | None = None
    en_retraso: str | None = None
    porcentaje_facturacion: float | None = None
    comentarios: str | None = None


class DatosEjecucionUpdate(BaseModel):
    fecha_inicio: str | None = None
    fecha_uat: str | None = None
    fecha_fin: str | None = None
    porcentaje_avance: float | None = None
    en_retraso: str | None = None
    porcentaje_facturacion: float | None = None
    comentarios: str | None = None


# =============================================================================
# GrupoIniciativa Schemas
# =============================================================================

class GrupoIniciativaCreate(BaseModel):
    portfolio_id_grupo: str | None = None
    portfolio_id_componente: str | None = None
    nombre_grupo: str | None = None
    tipo_agrupacion_grupo: str | None = None
    tipo_agrupacion_componente: str | None = None


class GrupoIniciativaUpdate(BaseModel):
    portfolio_id_grupo: str | None = None
    portfolio_id_componente: str | None = None
    nombre_grupo: str | None = None
    tipo_agrupacion_grupo: str | None = None
    tipo_agrupacion_componente: str | None = None


# =============================================================================
# Report Schemas
# =============================================================================

class HechosReportRequest(BaseModel):
    """Request for the Hechos report."""
    fecha_inicio: str
    fecha_fin: str
    digital_framework_level_1: list[str] = []
    unidad: list[str] = []
    cluster: list[str] = []
    tipo: list[str] = []
    estado: list[str] = []
    order_by: str | None = "fecha"
    order_dir: Literal["asc", "desc"] = "desc"
    limit: int = Field(default=50, le=1000)
    offset: int = Field(default=0, ge=0)


class LTPReportRequest(BaseModel):
    """Request for the LTPs report."""
    responsable: list[str] = []
    estado: list[str] = []
    order_by: str | None = "siguiente_accion"
    order_dir: Literal["asc", "desc"] = "asc"
    limit: int = Field(default=50, le=1000)
    offset: int = Field(default=0, ge=0)


class AccionesReportRequest(BaseModel):
    """Request for the Acciones report."""
    siguiente_accion_inicio: str | None = None
    siguiente_accion_fin: str | None = None
    estado_de_la_iniciativa: list[str] = []
    order_by: str | None = "siguiente_accion"
    order_dir: Literal["asc", "desc"] = "asc"
    limit: int = Field(default=50, le=1000)
    offset: int = Field(default=0, ge=0)


class EtiquetasReportRequest(BaseModel):
    """Request for the Etiquetas report."""
    portfolio_id: str | None = None
    nombre: str | None = None
    etiqueta: list[str] = []
    order_by: str | None = "portfolio_id"
    order_dir: Literal["asc", "desc"] = "asc"
    limit: int = Field(default=50, le=1000)
    offset: int = Field(default=0, ge=0)


class JustificacionesReportRequest(BaseModel):
    """Request for the Justificaciones report."""
    portfolio_id: str | None = None
    tipo_justificacion: list[str] = []
    order_by: str | None = "portfolio_id"
    order_dir: Literal["asc", "desc"] = "asc"
    limit: int = Field(default=50, le=1000)
    offset: int = Field(default=0, ge=0)


class DependenciasReportRequest(BaseModel):
    """Request for the Dependencias report."""
    portfolio_id: str | None = None
    descripcion_dependencia: str | None = None
    order_by: str | None = "portfolio_id"
    order_dir: Literal["asc", "desc"] = "asc"
    limit: int = Field(default=50, le=1000)
    offset: int = Field(default=0, ge=0)


class DescripcionesReportRequest(BaseModel):
    """Request for the Descripciones report."""
    portfolio_id: str | None = None
    tipo_descripcion: list[str] = []
    order_by: str | None = "portfolio_id"
    order_dir: Literal["asc", "desc"] = "asc"
    limit: int = Field(default=50, le=1000)
    offset: int = Field(default=0, ge=0)


class NotasReportRequest(BaseModel):
    """Request for the Notas report."""
    portfolio_id: str | None = None
    registrado_por: list[str] = []
    fecha_inicio: str | None = None
    fecha_fin: str | None = None
    order_by: str | None = "fecha"
    order_dir: Literal["asc", "desc"] = "desc"
    limit: int = Field(default=50, le=1000)
    offset: int = Field(default=0, ge=0)


class TransaccionesReportRequest(BaseModel):
    """Request for the Transacciones report."""
    clave1: str | None = None
    estado_cambio: list[str] = []
    fecha_registro_cambio_inicio: str | None = None
    fecha_registro_cambio_fin: str | None = None
    fecha_ejecucion_cambio_inicio: str | None = None
    fecha_ejecucion_cambio_fin: str | None = None
    id_filter: int | None = None
    order_by: str | None = "id"
    order_dir: Literal["asc", "desc"] = "asc"
    limit: int = Field(default=50, le=1000)
    offset: int = Field(default=0, ge=0)


# =============================================================================
# TransaccionJson Schemas
# =============================================================================

class TransaccionJsonCreate(BaseModel):
    """Create a new JSON transaction diff."""
    entidad: str
    tipo_operacion: Literal["INSERT", "UPDATE", "DELETE"]
    clave_primaria: str  # JSON string: {"portfolio_id": "P001"}
    clave_primaria_excel: str | None = None  # JSON string: Excel-specific PK (auto-populated by backend)
    cambios: str | None = None  # JSON string: changed fields
    usuario: str | None = None
    mensaje_commit: str | None = None
    estado_excel: Literal["PENDIENTE", "NO_APLICA"] = "PENDIENTE"
    valores_previos_excel: str | None = None
    portfolio_id: str | None = None


class TransaccionesJsonReportRequest(BaseModel):
    """Request for the Transacciones JSON report."""
    entidad: list[str] = []
    tipo_operacion: list[str] = []
    estado_db: list[str] = []
    estado_excel: list[str] = []
    usuario: str | None = None
    fecha_creacion_inicio: str | None = None
    fecha_creacion_fin: str | None = None
    order_by: str | None = "fecha_creacion"
    order_dir: Literal["asc", "desc"] = "desc"
    limit: int = Field(default=50, le=1000)
    offset: int = Field(default=0, ge=0)


# =============================================================================
# Parametros Schemas
# =============================================================================

class ParametroCreate(BaseModel):
    """Create a new parametro."""
    nombre_parametro: str
    valor: str
    color: str | None = None
    orden: int | None = None


class ParametroUpdate(BaseModel):
    """Update an existing parametro."""
    nombre_parametro: str | None = None
    valor: str | None = None
    color: str | None = None
    orden: int | None = None


# =============================================================================
# Etiquetas Destacadas Schemas
# =============================================================================

class EtiquetaDestacadaCreate(BaseModel):
    """Create a new etiqueta destacada."""
    etiqueta: str
    color: str | None = "blue"
    orden: int | None = None


class EtiquetaDestacadaUpdate(BaseModel):
    """Update an existing etiqueta destacada."""
    etiqueta: str | None = None
    color: str | None = None
    orden: int | None = None


# =============================================================================
# Documento Schemas
# =============================================================================

class DocumentoCreate(BaseModel):
    """Create a new documento."""
    nombre_fichero: str
    portfolio_id: str
    tipo_documento: str
    enlace_documento: str | None = None
    estado_proceso_documento: str = "Pendiente"
    resumen_documento: str | None = None
    ruta_documento: str | None = None


class DocumentoUpdate(BaseModel):
    """Update an existing documento."""
    portfolio_id: str | None = None
    tipo_documento: str | None = None
    enlace_documento: str | None = None
    estado_proceso_documento: str | None = None
    resumen_documento: str | None = None
    ruta_documento: str | None = None


class DocumentosReportRequest(BaseModel):
    """Request for the Documentos report."""
    portfolio_id: str | None = None
    nombre: str | None = None
    tipo_documento: list[str] = []
    estado_proceso_documento: list[str] = []
    order_by: str | None = "portfolio_id"
    order_dir: Literal["asc", "desc"] = "asc"
    limit: int = Field(default=50, le=1000)
    offset: int = Field(default=0, ge=0)


# =============================================================================
# SQL Query Schemas
# =============================================================================

class SQLExecuteRequest(BaseModel):
    """Request to execute a read-only SQL query."""
    sql: str = Field(..., description="SQL SELECT query to execute")
    max_rows: int = Field(default=500, ge=1, le=1000, description="Max rows to return")


class SQLExecuteResponse(BaseModel):
    """Response from SQL query execution."""
    sql: str = Field(..., description="The exact SQL that was executed")
    columns: list[str] = Field(..., description="Column names in result set")
    data: list[dict] = Field(..., description="Result rows")
    total_rows: int = Field(..., description="Number of rows returned")
    truncated: bool = Field(..., description="Whether results were truncated by row limit")
    execution_time_ms: int = Field(..., description="Query execution time in milliseconds")


# =============================================================================
# Stats Schemas
# =============================================================================

class StatsOverview(BaseModel):
    """Overview stats for landing page and dashboard."""
    total_iniciativas: int
    presupuesto_total: float
    total_tablas: int
    iniciativas_aprobadas: int
    en_ejecucion: int


# =============================================================================
# Generic Schemas
# =============================================================================

class GenericCreate(BaseModel):
    """Generic create schema - accepts any fields."""
    class Config:
        extra = "allow"


class GenericUpdate(BaseModel):
    """Generic update schema - accepts any fields."""
    class Config:
        extra = "allow"
