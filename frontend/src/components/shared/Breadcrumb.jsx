import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { buildBreadcrumbs } from '@/lib/routeMeta'

export function Breadcrumb() {
  const location = useLocation()
  const crumbs = buildBreadcrumbs(location.pathname, location.state)

  if (crumbs.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className="w-full px-6 sm:px-8 xl:px-12 py-2 border-b bg-muted/10">
      <ol className="flex items-center gap-1 text-sm text-muted-foreground min-w-0">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          return (
            <li key={crumb.path} className="flex items-center gap-1 min-w-0">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
              {isLast ? (
                <span className="font-medium text-foreground truncate">{crumb.label}</span>
              ) : (
                <Link to={crumb.path} className="hover:text-foreground transition-colors truncate">
                  {crumb.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
