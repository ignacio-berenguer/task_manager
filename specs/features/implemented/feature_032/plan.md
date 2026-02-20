# Implementation Plan — feature_032

## Excel Write-Back from transacciones_json + Detail Page Transaction Section

---

## Phase 1: Schema & Model Updates

### Step 1.1: Update database schema

**File:** `db/schema.sql`

Add `valores_previos_excel TEXT` column to `transacciones_json` table definition (after `error_detalle`).

### Step 1.2: Apply migration to existing database

Run `ALTER TABLE transacciones_json ADD COLUMN valores_previos_excel TEXT;` on the live database via a Python script or manual SQLite command.

### Step 1.3: Update SQLAlchemy model

**File:** `backend/app/models.py`

Add `valores_previos_excel = Column(Text)` to the `TransaccionJson` class, after `error_detalle`.

### Step 1.4: Update Pydantic schemas

**File:** `backend/app/schemas.py`

- Add `valores_previos_excel: str | None = None` to `TransaccionJsonCreate` (optional, not set on creation).
- Ensure the report request schema doesn't need changes (it doesn't filter by this field).

---

## Phase 2: Excel Mapping Configuration

### Step 2.1: Create excel_mapping.py

**New file:** `backend/app/services/excel_mapping.py`

Define the `EXCEL_MAPPING` dict with entries for all 14 CRUD-enabled tables. Each entry contains:
- `excel_file`: workbook filename
- `sheet_name`: exact sheet name
- `header_row`: 1-indexed row where headers are
- `pk_fields`: list of DB column names forming the primary key
- `column_mapping`: `{db_column: excel_column_header}`
- `insert_blocked`: (optional, default False) if True, INSERT operations set `estado_excel = NO_APLICA`
- `insert_pk_reconcile`: (optional) dict with `{"pk_field": "id_hecho", "strategy": "excel_max_plus_one"}` for PK reconciliation on INSERT

Complete mappings based on codebase analysis:

```python
EXCEL_MAPPING = {
    "notas": {
        "excel_file": "PortfolioDigital_Master.xlsm",
        "sheet_name": "Notas",
        "header_row": 4,
        "pk_fields": ["portfolio_id"],
        "column_mapping": {
            "portfolio_id": "Portfolio ID",
            "registrado_por": "Registrado Por",
            "fecha": "Fecha",
            "nota": "Nota",
        }
    },
    "hechos": {
        "excel_file": "PortfolioDigital_Master.xlsm",
        "sheet_name": "Hechos",
        "header_row": 3,
        "pk_fields": ["id_hecho"],
        "insert_pk_reconcile": {"pk_field": "id_hecho", "strategy": "excel_max_plus_one"},
        "column_mapping": {
            "id_hecho": "ID",
            "portfolio_id": "Portfolio ID",
            "partida_presupuestaria": "Partida Presupuestaria",
            "importe": "Importe",
            "estado": "Estado",
            "fecha": "Fecha",
            "importe_ri": "Importe RI",
            "importe_re": "Importe RE",
            "notas": "Notas",
            "racional": "Racional",
            "calidad_estimacion": "Calidad Estimación",
        }
    },
    "etiquetas": {
        "excel_file": "PortfolioDigital_Master.xlsm",
        "sheet_name": "Etiquetas",
        "header_row": 3,
        "pk_fields": ["portfolio_id"],
        "column_mapping": {
            "portfolio_id": "Portfolio ID",
            "etiqueta": "Etiqueta",
            "valor": "Valor",
            "fecha_modificacion": "Fecha Modificación",
            "origen_registro": "Origen Registro",
            "comentarios": "Comentarios",
        }
    },
    "acciones": {
        "excel_file": "PortfolioDigital_Master.xlsm",
        "sheet_name": "Acciones",
        "header_row": 3,
        "pk_fields": ["portfolio_id"],
        "column_mapping": {
            "portfolio_id": "Portfolio ID",
            "siguiente_accion": "Siguiente Acción",
            "siguiente_accion_comentarios": "Siguiente Acción Comentarios",
            "comentarios": "Comentarios",
        }
    },
    "datos_descriptivos": {
        "excel_file": "PortfolioDigital_Master.xlsm",
        "sheet_name": "Datos descriptivos",
        "header_row": 3,
        "pk_fields": ["portfolio_id"],
        "insert_blocked": True,  # Excel is master for new initiatives
        "column_mapping": {
            "portfolio_id": "Portfolio ID",
            "nombre": "Nombre",
            "unidad": "Unidad",
            "origen": "Origen",
            "digital_framework_level_1": "Digital Framework Level 1",
            "prioridad_descriptiva_bi": "Prioridad Descriptiva BI",
            "priorizacion": "Priorizacion",
            "tipo_proyecto": "Tipo Proyecto",
            "referente_bi": "Referente BI",
            "referente_b_unit": "Referente B Unit",
            "referente_enabler_ict": "Referente Enabler ICT",
            "it_partner": "IT Partner",
            "codigo_jira": "Codigo Jira",
            "cluster": "Cluster 2025",
            "tipo_agrupacion": "Tipo Agrupacion",
        }
    },
    "informacion_economica": {
        "excel_file": "PortfolioDigital_Master.xlsm",
        "sheet_name": "Información Económica",
        "header_row": 3,
        "pk_fields": ["portfolio_id"],
        "column_mapping": {
            "portfolio_id": "Portfolio ID",
            "cini": "CINI",
            "capex_opex": "CAPEX OPEX",
            "fecha_prevista_pes": "Fecha Prevista PES",
            "wbe": "WBE",
            "cluster": "Cluster",
            "finalidad_budget": "Finalidad Budget",
            "proyecto_especial": "Proyecto Especial",
            "clasificacion": "Clasificacion",
            "tlc": "TLC",
            "tipo_inversion": "Tipo Inversion",
            "observaciones": "Observaciones",
        }
    },
    "estado_especial": {
        "excel_file": "PortfolioDigital_Master.xlsm",
        "sheet_name": "Estado Especial",
        "header_row": 3,
        "pk_fields": ["portfolio_id"],
        "column_mapping": {
            "portfolio_id": "Portfolio ID",
            "estado_especial": "Estado Especial",
            "fecha_modificacion": "Fecha Modificación",
            "comentarios": "Comentarios",
        }
    },
    "impacto_aatt": {
        "excel_file": "PortfolioDigital_Master.xlsm",
        "sheet_name": "Impacto AATT",
        "header_row": 3,
        "pk_fields": ["portfolio_id"],
        "column_mapping": {
            "portfolio_id": "Portfolio ID",
            "tiene_impacto_en_aatt": "Tiene Impacto en AATT",
            "afecta_a_ut_red_mt_bt": "Afecta a UT Red MT BT",
            "afecta_om_cc": "Afecta O&M CC",
            "afecta_pm": "Afecta P&M",
            "afecta_hseq": "Afecta HSEQ",
            "afecta_inspecciones": "Afecta Inspecciones",
            "afecta_at": "Afecta AT",
            "comentarios": "Comentarios",
            "unidad": "Unidad",
            "referente_bi": "Referente BI",
            "it_partner": "IT Partner",
            "referente_b_unit": "Referente B Unit",
            "porcentaje_avance_ict": "Porcentaje Avance ICT",
        }
    },
    "justificaciones": {
        "excel_file": "PortfolioDigital_Master.xlsm",
        "sheet_name": "Justificaciones",
        "header_row": 3,
        "pk_fields": ["portfolio_id"],
        "column_mapping": {
            "portfolio_id": "Portfolio ID",
            "tipo_justificacion": "Tipo Justificacion",
            "valor": "Valor",
            "fecha_modificacion": "Fecha Modificación",
            "origen_registro": "Origen Registro",
            "comentarios": "Comentarios",
        }
    },
    "descripciones": {
        "excel_file": "PortfolioDigital_Master.xlsm",
        "sheet_name": "Descripciones",
        "header_row": 3,
        "pk_fields": ["portfolio_id"],
        "column_mapping": {
            "portfolio_id": "Portfolio ID",
            "tipo_descripcion": "Tipo Descripcion",
            "descripcion": "Descripcion",
            "fecha_modificacion": "Fecha Modificación",
            "origen_registro": "Origen Registro",
            "comentarios": "Comentarios",
        }
    },
    "ltp": {
        "excel_file": "PortfolioDigital_Master.xlsm",
        "sheet_name": "LTP",
        "header_row": 3,
        "pk_fields": ["portfolio_id"],
        "column_mapping": {
            "portfolio_id": "Portfolio ID",
            "responsable": "Responsable",
            "tarea": "Tarea",
            "siguiente_accion": "Siguiente Accion",
            "fecha_creacion": "Fecha Creacion",
            "estado": "Estado",
            "comentarios": "Comentarios",
        }
    },
    "wbes": {
        "excel_file": "PortfolioDigital_Master.xlsm",
        "sheet_name": "WBEs",
        "header_row": 3,
        "pk_fields": ["portfolio_id"],
        "column_mapping": {
            "portfolio_id": "Portfolio ID",
            "anio": "Ano Presupuesto",
            "wbe_pyb": "WBE PyB",
            "descripcion_pyb": "Descripcion",
            "wbe_can": "WBE CAN",
            "descripcion_can": "Descripcion2",
        }
    },
    "dependencias": {
        "excel_file": "PortfolioDigital_Master.xlsm",
        "sheet_name": "Dependencias",
        "header_row": 3,
        "pk_fields": ["portfolio_id"],
        "column_mapping": {
            "portfolio_id": "Portfolio ID",
            "descripcion_dependencia": "Descripcion Dependencia",
            "fecha_dependencia": "Fecha Dependencia",
            "comentarios": "Comentarios",
        }
    },
    "grupos_iniciativas": {
        "excel_file": "PortfolioDigital_Master.xlsm",
        "sheet_name": "Grupos Iniciativas",
        "header_row": 3,
        "pk_fields": ["portfolio_id_grupo", "portfolio_id_componente"],
        "column_mapping": {
            "portfolio_id_grupo": "Portfolio ID Grupo",
            "portfolio_id_componente": "Portfolio ID Componente",
            "nombre_grupo": "Nombre Grupo",
            "tipo_agrupacion_grupo": "Tipo Agrupacion Grupo",
            "tipo_agrupacion_componente": "Tipo Agrupacion Componente",
        }
    },
}
```

---

## Phase 3: Excel Writer Service (Backend)

### Step 3.1: Create excel_writer.py

**New file:** `backend/app/services/excel_writer.py`

Implement:

```python
import logging
import json
from datetime import datetime
from pathlib import Path
import xlwings as xw
from sqlalchemy.orm import Session
from app.models import TransaccionJson
from app.services.excel_mapping import EXCEL_MAPPING

logger = logging.getLogger("portfolio_backend")

# Module-level processing state
_processing_state = {
    "status": "idle",
    "total": 0,
    "processed": 0,
    "success": 0,
    "errors": 0,
    "details": [],
    "started_at": None,
    "completed_at": None,
}

def get_processing_state() -> dict:
    return dict(_processing_state)

def process_pending_excel_transactions(db: Session, excel_source_dir: str) -> dict:
    """Process all transacciones_json with estado_db=EJECUTADO and estado_excel=PENDIENTE.

    Uses xlwings to interact with Excel via COM, supporting files that are
    open by other users or in SharePoint.
    """
    ...

def _build_column_index(sheet: xw.Sheet, header_row: int, column_mapping: dict) -> dict:
    """Build {db_column: col_number} from header row using xlwings range reads."""
    ...

def _find_matching_rows(sheet: xw.Sheet, header_row: int, col_index: dict, pk_fields: list, pk_data: dict) -> list[int]:
    """Return list of row numbers matching all pk_fields."""
    ...

def _apply_excel_update(sheet: xw.Sheet, mapping: dict, col_index: dict, pk_data: dict, cambios: dict) -> dict:
    """Update: find exactly 1 row, update only changed cells, return previous values."""
    ...

def _apply_excel_insert(sheet: xw.Sheet, mapping: dict, col_index: dict, pk_data: dict, cambios: dict, db: Session, txn) -> None:
    """Insert: handle blocked entities, hechos id reconciliation, verify 0 existing rows, append new row."""
    ...

def _apply_excel_delete(sheet: xw.Sheet, mapping: dict, col_index: dict, pk_data: dict) -> dict:
    """Delete: find exactly 1 row, delete it, return previous values."""
    ...
```

**Key implementation details:**

- **xlwings App lifecycle**: Create `xw.App(visible=False)` at the start of processing, close in a `finally` block to prevent orphaned Excel processes.
- **Workbook grouping**: Group pending transactions by `excel_file` to minimize workbook open/close cycles. Open each workbook via `xw.Book(path)`, process all transactions for it, then `wb.save()`.
- **COM-based file access**: xlwings uses the Windows Excel COM API, so it gracefully handles files that are open by other users or in SharePoint (co-authoring). No need for `keep_vba` — macros are preserved natively.
- **WSL2 → Windows bridge**: xlwings can connect to a Windows Excel instance from WSL2. Excel file paths may need to be converted from WSL paths to Windows paths (`wslpath -w`).
- **Independent error handling**: Each transaction updates its own `estado_excel`. One failure doesn't stop others.
- **Processing state**: Update `_processing_state` dict as records are processed so the status endpoint can report progress.
- **INSERT blocked for datos_descriptivos**: If `entidad == "datos_descriptivos"` and `tipo_operacion == "INSERT"`, set `estado_excel = "NO_APLICA"` and skip. Excel is the master source for new initiatives.
- **hechos id_hecho reconciliation**: When inserting a hecho into Excel:
  1. Read all `id_hecho` values from the Excel "Hechos" sheet PK column.
  2. Compute `excel_max = max(id_hecho values)`.
  3. If `excel_max >= db_id_hecho`, assign `new_id = excel_max + 1`.
  4. Write the row with `new_id` to Excel.
  5. Update the `hechos` DB record: `UPDATE hechos SET id_hecho = new_id WHERE id_hecho = old_id`.
  6. Update `transacciones_json.clave_primaria` JSON to reflect the new `id_hecho`.
  7. Log at INFO: `"Reconciled hechos id_hecho: {old_id} → {new_id}"`.

### Step 3.2: Add EXCEL_SOURCE_DIR to backend config

**File:** `backend/app/config.py`

Add:
```python
EXCEL_SOURCE_DIR: str = os.getenv("EXCEL_SOURCE_DIR", "../management/excel_source")
```

**File:** `backend/.env`

Add:
```env
EXCEL_SOURCE_DIR=../management/excel_source
```

---

## Phase 4: Backend API Endpoints

### Step 4.1: Add process-excel endpoint

**File:** `backend/app/routers/transacciones_json.py`

Add BEFORE the `/{id}` route (FastAPI route ordering!):

```python
@router.post("/process-excel")
def process_excel(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Trigger async Excel write-back for pending transactions."""
    # Count pending
    count = db.query(TransaccionJson).filter(
        TransaccionJson.estado_db == "EJECUTADO",
        TransaccionJson.estado_excel == "PENDIENTE"
    ).count()

    if count == 0:
        return {"status": "no_pending", "count": 0}

    # Enqueue background task
    background_tasks.add_task(
        process_pending_excel_transactions,
        db_session_factory,  # Pass factory, not session (background needs its own)
        settings.EXCEL_SOURCE_DIR,
    )
    return {"status": "processing", "count": count}
```

**Important**: The background task must create its own DB session (not reuse the request's session). Pass the session factory or create a new session inside.

### Step 4.2: Add process-excel-status endpoint

```python
@router.get("/process-excel-status")
def get_process_excel_status():
    """Get current Excel processing status."""
    return get_processing_state()
```

### Step 4.3: Add by-portfolio endpoint

```python
@router.get("/by-portfolio/{portfolio_id}")
def get_by_portfolio(portfolio_id: str, db: Session = Depends(get_db)):
    """Get all transacciones_json for a portfolio_id."""
    from sqlalchemy import text
    results = db.query(TransaccionJson).filter(
        text("json_extract(clave_primaria, '$.portfolio_id') = :pid")
    ).params(pid=portfolio_id).order_by(
        TransaccionJson.fecha_creacion.desc()
    ).all()
    return [model_to_dict(r) for r in results]
```

### Step 4.4: Route ordering verification

Ensure all new static routes (`/process-excel`, `/process-excel-status`, `/by-portfolio/{portfolio_id}`) are defined BEFORE the existing `/{id}` dynamic route.

---

## Phase 5: Frontend — Detail Page Transaction Section

### Step 5.1: Create useTransaccionesJson hook

**New file:** `frontend/src/features/detail/hooks/useTransaccionesJson.js`

```javascript
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/api/client'

export function useTransaccionesJson(portfolioId) {
  return useQuery({
    queryKey: ['transacciones-json-portfolio', portfolioId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/transacciones-json/by-portfolio/${portfolioId}`)
      return data
    },
    enabled: !!portfolioId,
  })
}
```

### Step 5.2: Create TransaccionesJsonSection component

**New file:** `frontend/src/features/detail/components/sections/TransaccionesJsonSection.jsx`

**Features:**
- Table with columns: ID, Entidad, Tipo Op., Estado DB, Estado Excel, Fecha, Usuario, Mensaje
- Color-coded badges for tipo_operacion (INSERT=green, UPDATE=blue, DELETE=red)
- Color-coded badges for estado (PENDIENTE=yellow, EJECUTADO=green, ERROR=red, NO_APLICA=gray)
- Expandable rows showing: clave_primaria, cambios, valores_previos_excel (formatted JSON), error_detalle
- "Sincronizar Excel" button in section header
  - Disabled when no PENDIENTE records
  - Loading state during processing
  - Triggers POST /process-excel
  - Polls GET /process-excel-status every 2 seconds during processing
  - Shows toast on completion
  - Refetches data on completion

### Step 5.3: Add section to DetailPage.jsx

**File:** `frontend/src/features/detail/DetailPage.jsx`

- Import `TransaccionesJsonSection` and `useTransaccionesJson`
- Add state for the section
- Add `SectionAccordion` at the end (after the existing Transacciones section):

```jsx
<SectionAccordion
  id="transacciones-json"
  title="Transacciones JSON"
  count={transaccionesJsonData?.length ?? 0}
  defaultOpen={false}
  headerAction={
    <SyncExcelButton
      pendingCount={pendingExcelCount}
      onProcess={handleProcessExcel}
    />
  }
>
  <TransaccionesJsonSection data={transaccionesJsonData} />
</SectionAccordion>
```

### Step 5.4: Add nav entry

**File:** `frontend/src/features/detail/components/DetailNav.jsx`

Add to the SECTIONS array at the end:
```javascript
{ label: 'Trans. JSON', anchor: 'transacciones-json', key: 'transacciones_json_data', type: 'multi' }
```

### Step 5.5: Create useExcelProcessStatus hook

**New file:** `frontend/src/features/detail/hooks/useExcelProcessStatus.js`

```javascript
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/api/client'

export function useExcelProcessStatus(enabled) {
  return useQuery({
    queryKey: ['excel-process-status'],
    queryFn: async () => {
      const { data } = await apiClient.get('/transacciones-json/process-excel-status')
      return data
    },
    enabled,
    refetchInterval: enabled ? 2000 : false,
  })
}
```

---

## Phase 6: Frontend — Sync Excel UX

### Step 6.1: Implement sync flow in TransaccionesJsonSection

Inside the section component:

1. Count records where `estado_excel === 'PENDIENTE'`
2. Show "Sincronizar Excel" button (disabled if count === 0)
3. On click:
   - Call `POST /transacciones-json/process-excel`
   - Set `isProcessing = true` (enables polling hook)
   - Show `toast.info("Sincronizando con Excel... (N pendientes)")`
4. Polling picks up status changes
5. When status changes to `completed`:
   - Set `isProcessing = false` (stops polling)
   - Show appropriate toast (success/warning/error)
   - Refetch transacciones_json data

### Step 6.2: Toast messages

Using `sonner` (already installed):
- `toast.info("Sincronizando con Excel... (N pendientes)")`
- `toast.success("Excel sincronizado: N operaciones correctas")`
- `toast.warning("Excel sincronizado: X correctas, Y errores")`
- `toast.error("Error al sincronizar con Excel")`

---

## Phase 7: Testing & Verification

### Step 7.1: Backend verification

```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
```

Test endpoints:
1. `GET /api/v1/transacciones-json/by-portfolio/{some_pid}` — returns filtered records
2. `GET /api/v1/transacciones-json/process-excel-status` — returns `{ "status": "idle" }`
3. `POST /api/v1/transacciones-json/process-excel` — returns `{ "status": "no_pending", "count": 0 }` or starts processing

### Step 7.2: Frontend verification

```bash
cd frontend
npm run build
npm run dev
```

1. Navigate to a detail page with known transacciones_json records
2. Verify the new "Transacciones JSON" accordion section appears
3. Verify data loads and displays correctly
4. Verify expandable row details (JSON formatting)
5. Verify "Sincronizar Excel" button state (disabled/enabled)
6. Test sync flow if Excel files are available

---

## Phase 8: Documentation Updates

### Step 8.1: Update architecture docs

**File:** `specs/architecture/architecture_backend.md`
- Document the excel_mapping.py module
- Document the excel_writer.py service
- Document the 3 new endpoints
- Document the background task pattern

**File:** `specs/architecture/architecture_frontend.md`
- Document TransaccionesJsonSection
- Document the polling pattern for async operations
- Document the new hooks

### Step 8.2: Update README.md

- Add Excel write-back section under Backend
- Document new .env variables
- Mention the new detail page section

---

## Summary of All Files

### New Files (5)
1. `backend/app/services/excel_mapping.py` — Mapping configuration
2. `backend/app/services/excel_writer.py` — Excel write service + state management
3. `frontend/src/features/detail/components/sections/TransaccionesJsonSection.jsx` — Detail section
4. `frontend/src/features/detail/hooks/useTransaccionesJson.js` — Data hook
5. `frontend/src/features/detail/hooks/useExcelProcessStatus.js` — Polling hook

### Modified Files (9)
1. `db/schema.sql` — Add column
2. `backend/app/models.py` — Add column to model
3. `backend/app/schemas.py` — Add field to schema
4. `backend/app/routers/transacciones_json.py` — Add 3 endpoints
5. `backend/app/config.py` — Add EXCEL_SOURCE_DIR
6. `backend/.env` — Add EXCEL_SOURCE_DIR
7. `frontend/src/features/detail/DetailPage.jsx` — Add section
8. `frontend/src/features/detail/components/DetailNav.jsx` — Add nav entry
9. `specs/architecture/architecture_backend.md` — Document changes
10. `specs/architecture/architecture_frontend.md` — Document changes
11. `README.md` — Document changes

### Dependencies
- `xlwings` — Must be added to `backend/pyproject.toml`. Requires a Windows Excel installation accessible from WSL2 (COM bridge). Install via `uv add xlwings` from the backend directory.
