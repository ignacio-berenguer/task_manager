# Feature 11: Implementation Plan

## Summary

Implement a FastAPI backend providing CRUD operations for all database tables and flexible search capabilities on key tables.

## Implementation Steps

### Step 1: Project Setup

**Create directory structure:**

```bash
mkdir -p backend/app/routers
touch backend/app/__init__.py
touch backend/app/routers/__init__.py
```

**Create pyproject.toml:**

```toml
[project]
name = "portfolio-backend"
version = "0.1.0"
description = "Portfolio Digital API Backend"
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

**Create .env.example:**

```env
# Database (relative to backend folder)
DATABASE_URL=sqlite:///../db/portfolio.db

# Logging
LOG_LEVEL=INFO
LOG_FILE=portfolio_backend.log

# API Settings
API_PREFIX=/api/v1
API_TITLE=Portfolio Digital API
API_VERSION=1.0.0
```

### Step 2: Configuration Module

**File:** `backend/app/config.py`

```python
from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///../db/portfolio.db"

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "portfolio_backend.log"

    # API
    API_PREFIX: str = "/api/v1"
    API_TITLE: str = "Portfolio Digital API"
    API_VERSION: str = "1.0.0"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
```

### Step 3: Database Connection

**File:** `backend/app/database.py`

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from pathlib import Path
from .config import settings

# Calculate database path
_backend_dir = Path(__file__).parent.parent
_project_root = _backend_dir.parent
_db_path = _project_root / "db" / "portfolio.db"

DATABASE_URL = f"sqlite:///{_db_path}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite specific
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Step 4: SQLAlchemy Models

**File:** `backend/app/models.py`

Create ORM models for all 23 tables. Key models:

```python
from sqlalchemy import Column, Integer, Text, Real, DateTime, ForeignKey
from sqlalchemy.sql import func
from .database import Base

class Iniciativa(Base):
    __tablename__ = "iniciativas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Text, nullable=False, unique=True)
    nombre = Column(Text)
    unidad = Column(Text)
    origen = Column(Text)
    digital_framework_level_1 = Column(Text)
    # ... all 61 columns
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime)

class DatosRelevantes(Base):
    __tablename__ = "datos_relevantes"

    portfolio_id = Column(Text, primary_key=True)
    nombre = Column(Text)
    # ... all 60+ columns

class Hecho(Base):
    __tablename__ = "hechos"

    id_hecho = Column(Integer, primary_key=True)
    portfolio_id = Column(Text, nullable=False)
    nombre = Column(Text)
    # ... all columns

# ... define all 23 models
```

### Step 5: Pydantic Schemas

**File:** `backend/app/schemas.py`

Create Pydantic schemas for validation:

```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Any, Literal

# Search schemas
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

class PaginatedResponse(BaseModel):
    total: int
    data: list[dict]
    limit: int
    offset: int

# Iniciativa schemas
class IniciativaBase(BaseModel):
    portfolio_id: str
    nombre: str | None = None
    unidad: str | None = None
    # ... other fields

class IniciativaCreate(IniciativaBase):
    pass

class IniciativaUpdate(BaseModel):
    nombre: str | None = None
    # All fields optional

class Iniciativa(IniciativaBase):
    id: int
    fecha_creacion: datetime | None = None
    fecha_actualizacion: datetime | None = None

    class Config:
        from_attributes = True

# ... schemas for all tables
```

### Step 6: CRUD Operations

**File:** `backend/app/crud.py`

Generic CRUD operations:

```python
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Type, TypeVar, Generic
from .database import Base

ModelType = TypeVar("ModelType", bound=Base)

class CRUDBase(Generic[ModelType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    def get(self, db: Session, id: int) -> ModelType | None:
        return db.query(self.model).filter(self.model.id == id).first()

    def get_by_portfolio_id(self, db: Session, portfolio_id: str) -> ModelType | None:
        return db.query(self.model).filter(
            self.model.portfolio_id == portfolio_id
        ).first()

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100):
        total = db.query(func.count(self.model.id)).scalar()
        data = db.query(self.model).offset(skip).limit(limit).all()
        return {"total": total, "data": data, "limit": limit, "offset": skip}

    def create(self, db: Session, obj_in: dict) -> ModelType:
        db_obj = self.model(**obj_in)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: ModelType, obj_in: dict) -> ModelType:
        for field, value in obj_in.items():
            if value is not None:
                setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, id: int) -> bool:
        obj = db.query(self.model).filter(self.model.id == id).first()
        if obj:
            db.delete(obj)
            db.commit()
            return True
        return False
```

### Step 7: Search Operations

**File:** `backend/app/search.py`

Flexible search implementation:

```python
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import Type
from .database import Base
from .schemas import SearchRequest, SearchFilter

def apply_filter(query, model, filter: SearchFilter):
    column = getattr(model, filter.field, None)
    if column is None:
        raise ValueError(f"Invalid field: {filter.field}")

    match filter.operator:
        case "eq":
            return query.filter(column == filter.value)
        case "ne":
            return query.filter(column != filter.value)
        case "gt":
            return query.filter(column > filter.value)
        case "gte":
            return query.filter(column >= filter.value)
        case "lt":
            return query.filter(column < filter.value)
        case "lte":
            return query.filter(column <= filter.value)
        case "like":
            return query.filter(column.like(filter.value))
        case "ilike":
            return query.filter(column.ilike(filter.value))
        case "in":
            return query.filter(column.in_(filter.value))
        case "not_in":
            return query.filter(~column.in_(filter.value))
        case "is_null":
            return query.filter(column.is_(None))
        case "is_not_null":
            return query.filter(column.isnot(None))
        case _:
            raise ValueError(f"Invalid operator: {filter.operator}")

def search(db: Session, model: Type[Base], request: SearchRequest):
    query = db.query(model)

    # Apply filters
    for f in request.filters:
        query = apply_filter(query, model, f)

    # Get total count
    total = query.count()

    # Apply ordering
    if request.order_by:
        column = getattr(model, request.order_by, None)
        if column:
            if request.order_dir == "desc":
                column = column.desc()
            query = query.order_by(column)

    # Apply pagination
    data = query.offset(request.offset).limit(request.limit).all()

    return {
        "total": total,
        "data": [row.__dict__ for row in data],
        "limit": request.limit,
        "offset": request.offset
    }
```

### Step 8: API Routers

**File:** `backend/app/routers/iniciativas.py`

Example router for iniciativas:

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Iniciativa
from ..schemas import (
    IniciativaCreate, IniciativaUpdate, Iniciativa as IniciativaSchema,
    SearchRequest, PaginatedResponse
)
from ..crud import CRUDBase
from ..search import search

router = APIRouter(prefix="/iniciativas", tags=["Iniciativas"])
crud = CRUDBase(Iniciativa)

@router.get("/", response_model=PaginatedResponse)
def list_iniciativas(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return crud.get_multi(db, skip=skip, limit=limit)

@router.get("/{id}", response_model=IniciativaSchema)
def get_iniciativa(id: int, db: Session = Depends(get_db)):
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    return obj

@router.post("/", response_model=IniciativaSchema, status_code=201)
def create_iniciativa(
    data: IniciativaCreate,
    db: Session = Depends(get_db)
):
    return crud.create(db, data.model_dump())

@router.put("/{id}", response_model=IniciativaSchema)
def update_iniciativa(
    id: int,
    data: IniciativaUpdate,
    db: Session = Depends(get_db)
):
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    return crud.update(db, obj, data.model_dump(exclude_unset=True))

@router.delete("/{id}")
def delete_iniciativa(id: int, db: Session = Depends(get_db)):
    if not crud.delete(db, id):
        raise HTTPException(status_code=404, detail="Not found")
    return {"status": "deleted"}

@router.post("/search", response_model=PaginatedResponse)
def search_iniciativas(
    request: SearchRequest,
    db: Session = Depends(get_db)
):
    return search(db, Iniciativa, request)
```

### Step 9: Main Application

**File:** `backend/app/main.py`

```python
import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import (
    iniciativas, datos_relevantes, hechos, datos_descriptivos,
    etiquetas, fichas, informacion_economica, acciones,
    # ... other routers
)

# Setup logging
_backend_dir = Path(__file__).parent.parent
_project_root = _backend_dir.parent
_logs_dir = _project_root / "logs"
_logs_dir.mkdir(exist_ok=True)

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(_logs_dir / settings.LOG_FILE),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Create app
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    docs_url=f"{settings.API_PREFIX}/docs",
    redoc_url=f"{settings.API_PREFIX}/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(iniciativas.router, prefix=settings.API_PREFIX)
app.include_router(datos_relevantes.router, prefix=settings.API_PREFIX)
app.include_router(hechos.router, prefix=settings.API_PREFIX)
app.include_router(datos_descriptivos.router, prefix=settings.API_PREFIX)
app.include_router(etiquetas.router, prefix=settings.API_PREFIX)
app.include_router(fichas.router, prefix=settings.API_PREFIX)
app.include_router(informacion_economica.router, prefix=settings.API_PREFIX)
app.include_router(acciones.router, prefix=settings.API_PREFIX)
# ... other routers

@app.get("/")
def root():
    return {"message": "Portfolio Digital API", "version": settings.API_VERSION}

@app.get("/health")
def health():
    return {"status": "healthy"}

logger.info(f"Starting {settings.API_TITLE} v{settings.API_VERSION}")
```

### Step 10: Create All Routers

Create routers for all tables:

| File | Table | Operations |
|------|-------|------------|
| `iniciativas.py` | iniciativas | Full CRUD + Search |
| `datos_relevantes.py` | datos_relevantes | Read + Search (no write) |
| `hechos.py` | hechos | Full CRUD + Search |
| `datos_descriptivos.py` | datos_descriptivos | Full CRUD + Search |
| `etiquetas.py` | etiquetas | Full CRUD + Search |
| `fichas.py` | fichas | Full CRUD + Search |
| `informacion_economica.py` | informacion_economica | Full CRUD + Search |
| `acciones.py` | acciones | Full CRUD + Search |
| `beneficios.py` | beneficios | Full CRUD |
| `facturacion.py` | facturacion | Full CRUD |
| `grupos_iniciativas.py` | grupos_iniciativas | Full CRUD |
| `justificaciones.py` | justificaciones | Full CRUD |
| `ltp.py` | ltp | Full CRUD |
| `wbes.py` | wbes | Full CRUD |
| `notas.py` | notas | Full CRUD |
| `avance.py` | avance | Full CRUD |
| `descripciones.py` | descripciones | Full CRUD |
| `estado_especial.py` | estado_especial | Full CRUD |
| `investment_memos.py` | investment_memos | Full CRUD |
| `impacto_aatt.py` | impacto_aatt | Full CRUD |
| `datos_ejecucion.py` | datos_ejecucion | Full CRUD |
| `transacciones.py` | transacciones | Read only |
| `migracion_metadata.py` | migracion_metadata | Read only |
| `portfolio.py` | Cross-table | Portfolio search |

### Step 11: Portfolio Search Router

**File:** `backend/app/routers/portfolio.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import (
    Iniciativa, DatosRelevantes, Hecho, DatosDescriptivo,
    Etiqueta, Ficha, InformacionEconomica, Accion
)

router = APIRouter(prefix="/portfolio", tags=["Portfolio Search"])

@router.get("/{portfolio_id}")
def get_portfolio_data(portfolio_id: str, db: Session = Depends(get_db)):
    """Get all data for a specific portfolio_id."""
    result = {}

    result["iniciativa"] = db.query(Iniciativa).filter(
        Iniciativa.portfolio_id == portfolio_id
    ).first()

    result["datos_relevantes"] = db.query(DatosRelevantes).filter(
        DatosRelevantes.portfolio_id == portfolio_id
    ).first()

    result["hechos"] = db.query(Hecho).filter(
        Hecho.portfolio_id == portfolio_id
    ).all()

    # ... fetch from other tables

    return result

@router.post("/search")
def search_portfolios(
    portfolio_ids: list[str],
    tables: list[str] | None = None,
    db: Session = Depends(get_db)
):
    """Search across tables by portfolio_ids."""
    # Implementation
    pass
```

### Step 12: Update Documentation

#### 12.1 Update README.md

Add Backend section:

```markdown
## Backend API

The backend provides a REST API for accessing the portfolio database.

### Running the Backend

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

API documentation: http://localhost:8000/api/v1/docs
```

#### 12.2 Update specs/architecture_backend.md

Add implementation details and API reference.

#### 12.3 Update CLAUDE.md

Add backend module documentation.

### Step 13: Testing

**File:** `backend/tests/test_api.py`

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_list_iniciativas():
    response = client.get("/api/v1/iniciativas")
    assert response.status_code == 200
    assert "total" in response.json()
    assert "data" in response.json()

def test_search_iniciativas():
    response = client.post("/api/v1/iniciativas/search", json={
        "filters": [
            {"field": "estado_de_la_iniciativa", "operator": "eq", "value": "Aprobada"}
        ],
        "limit": 10
    })
    assert response.status_code == 200
```

## Files to Create

| File | Purpose |
|------|---------|
| `backend/pyproject.toml` | Dependencies |
| `backend/.env.example` | Config template |
| `backend/app/__init__.py` | Package init |
| `backend/app/main.py` | App entry point |
| `backend/app/config.py` | Configuration |
| `backend/app/database.py` | DB connection |
| `backend/app/models.py` | SQLAlchemy models |
| `backend/app/schemas.py` | Pydantic schemas |
| `backend/app/crud.py` | CRUD operations |
| `backend/app/search.py` | Search operations |
| `backend/app/dependencies.py` | Dependencies |
| `backend/app/routers/__init__.py` | Routers package |
| `backend/app/routers/*.py` | 24 router files |
| `backend/tests/test_api.py` | Tests |

## Files to Update

| File | Change |
|------|--------|
| `.gitignore` | Add backend patterns |
| `README.md` | Add backend documentation |
| `CLAUDE.md` | Add backend instructions |
| `specs/architecture_backend.md` | Complete architecture docs |

## Testing Plan

1. **Setup:**
   ```bash
   cd backend
   uv sync
   ```

2. **Start server:**
   ```bash
   uv run uvicorn app.main:app --reload --port 8000
   ```

3. **Test endpoints:**
   - Open http://localhost:8000/api/v1/docs
   - Test each CRUD endpoint
   - Test search endpoints
   - Test portfolio search

4. **Run tests:**
   ```bash
   uv run pytest
   ```

## Rollback Plan

If issues arise:
1. Remove `backend/` directory
2. Revert documentation changes
3. Existing management module is unaffected
