"""SQLAlchemy ORM models for Task Manager."""

from sqlalchemy import Column, Integer, Text, ForeignKey
from app.database import Base


class Tarea(Base):
    __tablename__ = "tareas"

    tarea_id = Column(Text, primary_key=True)
    tarea = Column(Text, nullable=False)
    responsable = Column(Text)
    descripcion = Column(Text)
    fecha_siguiente_accion = Column(Text)
    tema = Column(Text)
    estado = Column(Text)
    fecha_creacion = Column(Text)
    fecha_actualizacion = Column(Text)


class AccionRealizada(Base):
    __tablename__ = "acciones_realizadas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tarea_id = Column(Text, ForeignKey("tareas.tarea_id", ondelete="CASCADE"), nullable=False)
    accion = Column(Text, nullable=False)
    estado = Column(Text)
    fecha_creacion = Column(Text)
    fecha_actualizacion = Column(Text)


class EstadoTarea(Base):
    __tablename__ = "estados_tareas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    valor = Column(Text, nullable=False, unique=True)
    orden = Column(Integer, default=0)
    color = Column(Text)


class EstadoAccion(Base):
    __tablename__ = "estados_acciones"

    id = Column(Integer, primary_key=True, autoincrement=True)
    valor = Column(Text, nullable=False, unique=True)
    orden = Column(Integer, default=0)
    color = Column(Text)
