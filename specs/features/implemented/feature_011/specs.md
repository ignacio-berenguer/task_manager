# Feature 11: Backend API with FastAPI

## Overview

This feature implements a RESTful API backend using FastAPI to provide access to the portfolio database. The API supports CRUD operations on all tables and flexible search capabilities on key tables.

## Technology Stack

- **Framework:** FastAPI (Python 3.12+)
- **ORM:** SQLAlchemy 2.0 (declarative mapping)
- **Database:** SQLite (existing portfolio.db)
- **Validation:** Pydantic v2
- **Configuration:** python-dotenv

## Directory Structure

Following `specs/architecture_backend.md`:

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py            # Entry point & app configuration
│   ├── config.py          # Environment configuration
│   ├── database.py        # Connection setup & SessionLocal
│   ├── models.py          # SQLAlchemy ORM definitions
│   ├── schemas.py         # Pydantic models for validation
│   ├── crud.py            # Reusable CRUD operations
│   ├── search.py          # Flexible search operations
│   ├── dependencies.py    # DB sessions & common dependencies
│   └── routers/           # API Endpoints by resource
│       ├── __init__.py
│       ├── iniciativas.py
│       ├── datos_relevantes.py
│       ├── hechos.py
│       ├── datos_descriptivos.py
│       ├── etiquetas.py
│       ├── fichas.py
│       ├── informacion_economica.py
│       ├── acciones.py
│       └── search.py      # Cross-table search endpoint
├── .env                   # Environment variables
├── .env.example           # Template
├── pyproject.toml         # Dependencies
└── requirements.txt       # Alternative dependencies file
```

## Database Tables

### All Tables (CRUD Operations)

| Table | Records | Description |
|-------|---------|-------------|
| iniciativas | 813 | Main portfolio initiatives |
| datos_descriptivos | 814 | Descriptive data for initiatives |
| grupos_iniciativas | 53 | Initiative groups |
| informacion_economica | 811 | Economic information |
| facturacion | 127 | Billing records |
| datos_ejecucion | 211 | Execution/milestone data |
| hechos | 3,452 | Detailed fact records |
| beneficios | 26,568 | Benefits |
| etiquetas | 7,237 | Tags/labels |
| justificaciones | 631 | Justifications |
| ltp | 93 | Pending tasks |
| wbes | 122 | SAP WBEs |
| notas | 222 | Notes |
| avance | 1,182 | Progress tracking |
| acciones | 814 | Actions |
| descripciones | 116 | Descriptions |
| estado_especial | 3 | Special status |
| investment_memos | 27 | Investment memos |
| impacto_aatt | 45 | AATT impact |
| transacciones | 8,974 | Audit trail |
| fichas | 7,787 | Card/sheet data |
| datos_relevantes | 814 | Computed data (read-only) |
| migracion_metadata | 21 | Migration metadata (read-only) |

### Tables with Flexible Search

These tables require advanced filtering on any field:

1. **datos_relevantes** - 61 columns, computed metrics
2. **hechos** - 14 columns, fact records
3. **datos_descriptivos** - 21 columns, descriptive data
4. **etiquetas** - 9 columns, tags
5. **fichas** - 9 columns, card data
6. **informacion_economica** - 27 columns, economic data
7. **acciones** - 16 columns, action items

## API Endpoints

### Standard CRUD Endpoints

For each table, the following endpoints are available:

```
GET    /api/v1/{table}              # List all (with pagination)
GET    /api/v1/{table}/{id}         # Get by ID
POST   /api/v1/{table}              # Create new
PUT    /api/v1/{table}/{id}         # Update by ID
DELETE /api/v1/{table}/{id}         # Delete by ID
```

### Read-Only Tables

Some tables are read-only (no POST/PUT/DELETE):
- `datos_relevantes` - Computed by management module
- `migracion_metadata` - Generated during migration

### Flexible Search Endpoints

Advanced search with dynamic field filtering:

```
POST /api/v1/search/{table}
```

**Request Body:**
```json
{
  "filters": [
    {"field": "estado_de_la_iniciativa", "operator": "eq", "value": "Aprobada"},
    {"field": "importe_2025", "operator": "gte", "value": 100000},
    {"field": "unidad", "operator": "in", "value": ["DSO", "DGR"]}
  ],
  "order_by": "importe_2025",
  "order_dir": "desc",
  "limit": 100,
  "offset": 0
}
```

**Supported Operators:**
- `eq` - Equal
- `ne` - Not equal
- `gt` - Greater than
- `gte` - Greater than or equal
- `lt` - Less than
- `lte` - Less than or equal
- `like` - SQL LIKE pattern match
- `ilike` - Case-insensitive LIKE
- `in` - In list
- `not_in` - Not in list
- `is_null` - Is NULL
- `is_not_null` - Is not NULL

### Cross-Table Portfolio Search

Search across all tables by portfolio_id:

```
GET /api/v1/portfolio/{portfolio_id}
```

Returns aggregated data from all related tables for a given portfolio_id.

```
POST /api/v1/portfolio/search
```

**Request Body:**
```json
{
  "portfolio_ids": ["P001", "P002", "P003"],
  "tables": ["iniciativas", "hechos", "datos_descriptivos"]
}
```

Returns data from specified tables for the given portfolio_ids.

## Pydantic Schemas

### Base Schemas

Each table has corresponding Pydantic models:

```python
# Example for iniciativas
class IniciativaBase(BaseModel):
    portfolio_id: str
    nombre: str | None = None
    unidad: str | None = None
    # ... other fields

class IniciativaCreate(IniciativaBase):
    pass

class IniciativaUpdate(BaseModel):
    nombre: str | None = None
    unidad: str | None = None
    # All fields optional for partial updates

class Iniciativa(IniciativaBase):
    id: int
    fecha_creacion: datetime | None
    fecha_actualizacion: datetime | None

    class Config:
        from_attributes = True
```

### Search Schemas

```python
class SearchFilter(BaseModel):
    field: str
    operator: Literal["eq", "ne", "gt", "gte", "lt", "lte",
                      "like", "ilike", "in", "not_in",
                      "is_null", "is_not_null"]
    value: Any = None

class SearchRequest(BaseModel):
    filters: list[SearchFilter] = []
    order_by: str | None = None
    order_dir: Literal["asc", "desc"] = "asc"
    limit: int = Field(default=100, le=1000)
    offset: int = Field(default=0, ge=0)

class SearchResponse(BaseModel):
    total: int
    data: list[dict]
    limit: int
    offset: int
```

## SQLAlchemy Models

ORM models mirror the database schema exactly:

```python
class Iniciativa(Base):
    __tablename__ = "iniciativas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Text, nullable=False, unique=True)
    nombre = Column(Text)
    unidad = Column(Text)
    # ... all 61 columns from schema

    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime)
```

## Configuration

### Environment Variables (.env)

```env
# Database
DATABASE_URL=sqlite:///../../db/portfolio.db

# Logging
LOG_LEVEL=INFO
LOG_FILE=../logs/backend.log

# API Settings
API_PREFIX=/api/v1
API_TITLE=Portfolio Digital API
API_VERSION=1.0.0

# CORS (optional)
CORS_ORIGINS=["http://localhost:3000"]
```

### Logging Configuration

- Log file: `PROJECT_ROOT/logs/backend.log`
- Console output for INFO and above
- Configurable log level via LOG_LEVEL
- Format: `%(asctime)s - %(name)s - %(levelname)s - %(message)s`

## Error Handling

Standard HTTP error responses:

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 404 | Not Found |
| 422 | Unprocessable Entity |
| 500 | Internal Server Error |

Error response format:
```json
{
  "detail": "Error message",
  "errors": [{"field": "name", "message": "required"}]
}
```

## Pagination

All list endpoints support pagination:

```
GET /api/v1/iniciativas?limit=50&offset=100
```

Response includes pagination metadata:
```json
{
  "total": 813,
  "data": [...],
  "limit": 50,
  "offset": 100
}
```

## Running the API

```bash
cd backend

# Install dependencies
uv sync

# Run development server
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or with python
uv run python -m uvicorn app.main:app --reload
```

API documentation available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Testing

```bash
cd backend

# Run tests
uv run pytest

# Run with coverage
uv run pytest --cov=app
```

## Dependencies

```toml
[project]
name = "portfolio-backend"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "sqlalchemy>=2.0.0",
    "pydantic>=2.0.0",
    "pydantic-settings>=2.0.0",
    "python-dotenv>=1.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-cov>=4.0.0",
    "httpx>=0.27.0",
]
```
