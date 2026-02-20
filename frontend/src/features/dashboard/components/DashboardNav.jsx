import { SidebarNav } from '@/components/shared/SidebarNav'

const NAV_ITEMS = [
  { label: 'Filtros', anchor: 'filters' },
  { label: 'KPIs', anchor: 'kpis' },
  { label: 'Priorización', anchor: 'chart-priority' },
  { label: 'Unidad', anchor: 'chart-unidad' },
  { label: 'Framework', anchor: 'chart-framework' },
  { label: 'Cluster', anchor: 'chart-cluster' },
  { label: 'Estado', anchor: 'chart-estado' },
  { label: 'Top Iniciativas', anchor: 'top-value' },
  { label: 'Cambios Recientes', anchor: 'recent-changes' },
]

export function DashboardNav() {
  return <SidebarNav items={NAV_ITEMS} />
}
