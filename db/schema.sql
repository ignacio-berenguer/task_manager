-- ============================================================================
-- Task Manager Database Schema
-- SQLite database for task management with Spanish column names
-- ============================================================================

-- Enable foreign key enforcement
PRAGMA foreign_keys = ON;

-- Use WAL mode for better concurrency
PRAGMA journal_mode = WAL;

-- Optimize cache (8MB)
PRAGMA cache_size = -8192;

-- ============================================================================
-- PARAMETRIC TABLES
-- ============================================================================

-- Valid estados for tareas
CREATE TABLE IF NOT EXISTS estados_tareas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    valor TEXT NOT NULL UNIQUE,
    orden INTEGER DEFAULT 0,
    color TEXT DEFAULT NULL
);

-- Valid estados for acciones
CREATE TABLE IF NOT EXISTS estados_acciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    valor TEXT NOT NULL UNIQUE,
    orden INTEGER DEFAULT 0,
    color TEXT DEFAULT NULL
);

-- Valid responsables for tareas
CREATE TABLE IF NOT EXISTS responsables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    valor TEXT NOT NULL UNIQUE,
    orden INTEGER DEFAULT 0
);

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Main tasks table
CREATE TABLE IF NOT EXISTS tareas (
    tarea_id TEXT PRIMARY KEY,
    tarea TEXT NOT NULL,
    responsable TEXT,
    descripcion TEXT,
    fecha_siguiente_accion TEXT,  -- ISO 8601 date (YYYY-MM-DD)
    tema TEXT,
    estado TEXT,
    notas_anteriores TEXT,
    fecha_creacion TEXT DEFAULT (datetime('now')),
    fecha_actualizacion TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tareas_responsable ON tareas(responsable);
CREATE INDEX IF NOT EXISTS idx_tareas_tema ON tareas(tema);
CREATE INDEX IF NOT EXISTS idx_tareas_estado ON tareas(estado);

-- Actions performed on tasks
CREATE TABLE IF NOT EXISTS acciones_realizadas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tarea_id TEXT NOT NULL,
    accion TEXT NOT NULL,
    fecha_accion TEXT,  -- ISO 8601 date (YYYY-MM-DD)
    estado TEXT,
    fecha_creacion TEXT DEFAULT (datetime('now')),
    fecha_actualizacion TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tarea_id) REFERENCES tareas(tarea_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_acciones_tarea_id ON acciones_realizadas(tarea_id);
CREATE INDEX IF NOT EXISTS idx_acciones_estado ON acciones_realizadas(estado);
CREATE INDEX IF NOT EXISTS idx_acciones_fecha_accion ON acciones_realizadas(fecha_accion);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Default estados for tareas
INSERT OR IGNORE INTO estados_tareas (valor, orden) VALUES
    ('Pendiente', 1),
    ('En Progreso', 2),
    ('Completada', 3),
    ('Cancelada', 4);

-- Default estados for acciones
INSERT OR IGNORE INTO estados_acciones (valor, orden) VALUES
    ('Pendiente', 1),
    ('En Progreso', 2),
    ('Completada', 3);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
