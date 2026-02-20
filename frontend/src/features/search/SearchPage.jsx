import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, X } from 'lucide-react'
import { createLogger } from '@/lib/logger'
import apiClient from '@/api/client'

const LOG = createLogger('Search')

const DEFAULT_COLUMNS = ['tarea_id', 'tarea', 'responsable', 'tema', 'estado', 'fecha_siguiente_accion']
const DEFAULT_PAGE_SIZE = 50

const COLUMN_LABELS = {
  tarea_id: 'ID',
  tarea: 'Tarea',
  responsable: 'Responsable',
  descripcion: 'Descripcion',
  fecha_siguiente_accion: 'Fecha Sig. Accion',
  tema: 'Tema',
  estado: 'Estado',
  fecha_creacion: 'Creado',
  fecha_actualizacion: 'Actualizado',
}

export default function SearchPage() {
  usePageTitle('Busqueda')
  const navigate = useNavigate()

  const [filters, setFilters] = useState({
    tarea_id: '',
    tarea: '',
    responsable: '',
    tema: '',
    estado: '',
  })
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize] = useState(DEFAULT_PAGE_SIZE)
  const [sortField, setSortField] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [filterOptions, setFilterOptions] = useState(null)

  // Fetch filter options on first load
  useEffect(() => {
    apiClient.get('/tareas/filter-options').then(res => {
      setFilterOptions(res.data)
    }).catch(err => LOG.error('Error loading filter options', err))
  }, [])

  const doSearch = useCallback(async (pageOverride = 0) => {
    setLoading(true)
    try {
      const searchFilters = []
      if (filters.tarea_id) searchFilters.push({ field: 'tarea_id', operator: 'ilike', value: `%${filters.tarea_id}%` })
      if (filters.tarea) searchFilters.push({ field: 'tarea', operator: 'ilike', value: `%${filters.tarea}%` })
      if (filters.responsable) searchFilters.push({ field: 'responsable', operator: 'eq', value: filters.responsable })
      if (filters.tema) searchFilters.push({ field: 'tema', operator: 'eq', value: filters.tema })
      if (filters.estado) searchFilters.push({ field: 'estado', operator: 'eq', value: filters.estado })

      const body = {
        filters: searchFilters,
        limit: pageSize,
        offset: pageOverride * pageSize,
      }
      if (sortField) {
        body.order_by = sortField
        body.order_dir = sortDir
      }

      const res = await apiClient.post('/tareas/search', body)
      setResults(res.data)
      setPage(pageOverride)
    } catch (err) {
      LOG.error('Search error', err)
    } finally {
      setLoading(false)
    }
  }, [filters, sortField, sortDir, pageSize])

  const clearFilters = () => {
    setFilters({ tarea_id: '', tarea: '', responsable: '', tema: '', estado: '' })
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const totalPages = results ? Math.ceil(results.total / pageSize) : 0

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <h1 className="mb-6 text-2xl font-bold">Busqueda de Tareas</h1>

        {/* Filters */}
        <div className="mb-6 rounded-lg border bg-card p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Input
              placeholder="ID Tarea"
              value={filters.tarea_id}
              onChange={e => setFilters(f => ({ ...f, tarea_id: e.target.value }))}
            />
            <Input
              placeholder="Tarea (texto)"
              value={filters.tarea}
              onChange={e => setFilters(f => ({ ...f, tarea: e.target.value }))}
            />
            <select
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={filters.responsable}
              onChange={e => setFilters(f => ({ ...f, responsable: e.target.value }))}
            >
              <option value="">Responsable</option>
              {filterOptions?.responsables?.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <select
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={filters.tema}
              onChange={e => setFilters(f => ({ ...f, tema: e.target.value }))}
            >
              <option value="">Tema</option>
              {filterOptions?.temas?.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={filters.estado}
              onChange={e => setFilters(f => ({ ...f, estado: e.target.value }))}
            >
              <option value="">Estado</option>
              {filterOptions?.estados?.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => doSearch(0)} disabled={loading}>
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Limpiar
            </Button>
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="rounded-lg border bg-card">
            <div className="border-b px-4 py-3 text-sm text-muted-foreground">
              {results.total} resultado{results.total !== 1 ? 's' : ''}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {DEFAULT_COLUMNS.map(col => (
                      <th
                        key={col}
                        className="cursor-pointer px-4 py-3 text-left font-medium hover:bg-muted"
                        onClick={() => handleSort(col)}
                      >
                        {COLUMN_LABELS[col] || col}
                        {sortField === col && (sortDir === 'asc' ? ' \u2191' : ' \u2193')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.data.map(row => (
                    <tr
                      key={row.tarea_id}
                      className="cursor-pointer border-b hover:bg-muted/50"
                      onClick={() => navigate(`/detail/${row.tarea_id}`)}
                    >
                      {DEFAULT_COLUMNS.map(col => (
                        <td key={col} className="px-4 py-3">
                          {col === 'estado' ? (
                            <Badge variant="outline">{row[col] || '-'}</Badge>
                          ) : (
                            row[col] || '-'
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => doSearch(page - 1)}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Pagina {page + 1} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => doSearch(page + 1)}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
