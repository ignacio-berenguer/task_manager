export const CHANGELOG = [
  {
    version: "1.014",
    feature: 14,
    title: "Filtro rapido: Proxima semana",
    summary: "Nuevo boton de filtro rapido en la pagina de busqueda que filtra tareas con fecha siguiente accion dentro de los proximos 7 dias (hoy + 6 dias). El boton se integra con los filtros existentes, muestra estado activo/inactivo, aparece como tag removible, y su estado se preserva al navegar entre paginas."
  },
  {
    version: "1.013",
    feature: 13,
    title: "Mejoras de diseño responsivo movil",
    summary: "Correcciones de renderizado en pantallas moviles. Busqueda: boton Nueva Tarea compacto, filtros con posicion sticky corregida, iconos de filtro y botones de accion mas grandes para tacto, drawer con grid adaptable. Detalle: tabla de acciones con vista de tarjetas en movil, botones de accion mas grandes, padding responsivo en acordeones. Dialogos: ancho maximo limitado al viewport, padding y boton de cierre mejorados. Chat: botones de envio mas grandes. Pagina 404: tipografia responsiva."
  },
  {
    version: "1.012",
    feature: 12,
    title: "Estado persistente de busqueda",
    summary: "La pagina de busqueda preserva su estado completo (filtros, resultados, paginacion, ordenamiento, filtros de columna y posicion de scroll) al navegar a otra pagina y volver. El estado se almacena en memoria del modulo y se limpia automaticamente al recargar la pagina."
  },
  {
    version: "1.011",
    feature: 11,
    title: "Bulk inserts en migracion",
    summary: "La migracion de datos desde Excel ahora utiliza inserciones masivas (bulk inserts) con psycopg2 execute_values, reduciendo drasticamente los tiempos de importacion en bases de datos remotas. El tamano del lote es configurable via BATCH_COMMIT_SIZE. Se registran metricas de rendimiento (filas/segundo, lotes procesados)."
  },
  {
    version: "1.010",
    feature: 10,
    title: "Exportar base de datos",
    summary: "Nuevo menu Administrador en la barra de navegacion con opcion para exportar toda la base de datos en formato JSON. El archivo exportado contiene todas las tablas y puede usarse para restaurar la base de datos."
  },
  {
    version: "1.009",
    feature: 9,
    title: "Importacion de Tema desde Excel",
    summary: "La columna Tema del Excel de origen se importa y normaliza durante la migracion, mapeandose al campo tema de la tabla tareas. Valores vacios o ausentes se almacenan como NULL."
  },
  {
    version: "1.008",
    feature: 8,
    title: "Seguridad API con Clerk JWT",
    summary: "Proteccion del backend FastAPI con autenticacion Clerk JWT. Todas las rutas CRUD requieren un token JWT valido (frontend) o API key (servicios internos). Verificacion de tokens via JWKS con PyJWT. Soporte dual: JWT para usuarios del navegador y API key para MCP server y agente IA."
  },
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
