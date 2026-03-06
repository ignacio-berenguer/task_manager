-- ============================================================================
-- Task Manager Database Schema
-- PostgreSQL database for task management with Spanish column names
-- ============================================================================

-- ============================================================================
-- PARAMETRIC TABLES
-- ============================================================================

-- Valid estados for tareas
CREATE TABLE IF NOT EXISTS estados_tareas (
    id SERIAL PRIMARY KEY,
    valor TEXT NOT NULL UNIQUE,
    orden INTEGER DEFAULT 0,
    color TEXT DEFAULT NULL
);

-- Valid estados for acciones
CREATE TABLE IF NOT EXISTS estados_acciones (
    id SERIAL PRIMARY KEY,
    valor TEXT NOT NULL UNIQUE,
    orden INTEGER DEFAULT 0,
    color TEXT DEFAULT NULL
);

-- Valid responsables for tareas
CREATE TABLE IF NOT EXISTS responsables (
    id SERIAL PRIMARY KEY,
    valor TEXT NOT NULL UNIQUE,
    orden INTEGER DEFAULT 0
);

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Main tasks table
CREATE TABLE IF NOT EXISTS tareas (
    tarea_id SERIAL PRIMARY KEY,
    tarea TEXT NOT NULL,
    responsable TEXT,
    descripcion TEXT,
    fecha_siguiente_accion DATE,
    tema TEXT,
    estado TEXT,
    notas_anteriores TEXT,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tareas_responsable ON tareas(responsable);
CREATE INDEX IF NOT EXISTS idx_tareas_tema ON tareas(tema);
CREATE INDEX IF NOT EXISTS idx_tareas_estado ON tareas(estado);

-- Actions performed on tasks
CREATE TABLE IF NOT EXISTS acciones_realizadas (
    id SERIAL PRIMARY KEY,
    tarea_id INTEGER NOT NULL REFERENCES tareas(tarea_id) ON DELETE CASCADE,
    accion TEXT NOT NULL,
    fecha_accion DATE,
    estado TEXT,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_acciones_tarea_id ON acciones_realizadas(tarea_id);
CREATE INDEX IF NOT EXISTS idx_acciones_estado ON acciones_realizadas(estado);
CREATE INDEX IF NOT EXISTS idx_acciones_fecha_accion ON acciones_realizadas(fecha_accion);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Default estados for tareas
INSERT INTO estados_tareas (valor, orden, color) VALUES
    ('En curso', 1, 'blue'),
    ('Completado', 2, 'green'),
    ('Cancelado', 3, 'gray')
ON CONFLICT DO NOTHING;

-- Default estados for acciones
INSERT INTO estados_acciones (valor, orden, color) VALUES
    ('Pendiente', 1, 'amber'),
    ('Completada', 2, 'green')
ON CONFLICT DO NOTHING;

-- Default responsables
INSERT INTO responsables (valor, orden) VALUES
    ('Ignacio', 1),
    ('Mario', 2),
    ('MJ', 3),
    ('Elena', 4),
    ('Carla', 5),
    ('Álvaro', 6)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
