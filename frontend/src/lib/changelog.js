export const CHANGELOG = [
  {
    version: "1.007",
    feature: 7,
    title: "Migracion a PostgreSQL",
    summary: "Migracion de base de datos SQLite a PostgreSQL. Campos de fecha convertidos de TEXT a tipos DATE/TIMESTAMP nativos. Configuracion de conexion via variables de entorno individuales (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME)."
  },
  {
    version: "1.006",
    feature: 6,
    title: "Acciones Rapidas",
    summary: "Añadir acciones y cambiar fecha siguiente accion directamente desde la pagina de busqueda y detalle. Los botones de accion en la tabla de resultados ahora son funcionales con dialogos modales."
  },
  {
    version: "1.005",
    feature: 5,
    title: "Tags de Filtros Activos y Filtros por Columna en Popover",
    summary: "Los filtros activos de busqueda se muestran como tags removibles junto al conteo de resultados. Los filtros por columna se acceden mediante un icono de embudo en el encabezado de cada columna, liberando espacio vertical en la tabla."
  },
  {
    version: "1.004",
    feature: 4,
    title: "Mejoras de Interfaz",
    summary: "Filtros por columna en tabla de busqueda, jerarquia visual mejorada (tarea_id secundario, nombre de tarea prominente), etiquetas de estado con colores para acciones, acciones compactas, notas en acordeon, fecha siguiente accion en cabecera de detalle, atajo Ctrl+Shift+F desde detalle, titulo fijo en busqueda, y botones de accion placeholder."
  },
  {
    version: "1.003",
    feature: 3,
    title: "Mejoras UI: Busqueda y Detalle",
    summary: "Filtros con etiquetas, atajos de teclado, columnas ordenables y reordenables, tags de estado con color, panel lateral de filtros, visor rapido, acordeones, y mejoras de navegacion."
  },
  {
    version: "1.002",
    feature: 2,
    title: "Migración Tareas: Notas → Acciones",
    summary: "Migración personalizada de tareas: parseo de Notas en acciones individuales con fechas y estados, tabla paramétrica de responsables, y campo notas_anteriores."
  },
  {
    version: "1.001",
    feature: 1,
    title: "Task Manager MVP",
    summary: "Primera version del Task Manager: gestion de tareas y acciones realizadas con busqueda, detalle y CRUD."
  }
]
