"""SQLAlchemy ORM models for Task Manager."""

from sqlalchemy import Column, Integer, Text, Date, DateTime, ForeignKey
from app.database import Base


class Tarea(Base):
    __tablename__ = "tareas"

    tarea_id = Column(Integer, primary_key=True, autoincrement=True)
    tarea = Column(Text, nullable=False)
    responsable = Column(Text)
    descripcion = Column(Text)
    fecha_siguiente_accion = Column(Date)
    tema = Column(Text)
    estado = Column(Text)
    notas_anteriores = Column(Text)
    fecha_creacion = Column(DateTime)
    fecha_actualizacion = Column(DateTime)


class AccionRealizada(Base):
    __tablename__ = "acciones_realizadas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tarea_id = Column(Integer, ForeignKey("tareas.tarea_id", ondelete="CASCADE"), nullable=False)
    accion = Column(Text, nullable=False)
    fecha_accion = Column(Date)
    estado = Column(Text)
    fecha_creacion = Column(DateTime)
    fecha_actualizacion = Column(DateTime)


class Responsable(Base):
    __tablename__ = "responsables"

    id = Column(Integer, primary_key=True, autoincrement=True)
    valor = Column(Text, nullable=False, unique=True)
    orden = Column(Integer, default=0)


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
