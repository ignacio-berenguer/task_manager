import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SignIn, SignUp } from '@clerk/clerk-react'
import { Providers } from '@/providers/Providers'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { NotFoundPage } from '@/components/shared/NotFoundPage'
import { LandingPage } from '@/features/landing/LandingPage'
import { usePageTitle } from '@/hooks/usePageTitle'
import { createLogger } from '@/lib/logger'
import { DashboardSkeleton } from '@/components/shared/skeletons/DashboardSkeleton'
import { SearchSkeleton } from '@/components/shared/skeletons/SearchSkeleton'
import { DetailSkeleton } from '@/components/shared/skeletons/DetailSkeleton'
import { ReportSkeleton } from '@/components/shared/skeletons/ReportSkeleton'

// Lazy-loaded route components (code-split by route)
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const SearchPage = lazy(() => import('@/features/search/SearchPage'))
const DetailPage = lazy(() => import('@/features/detail/DetailPage'))
const ReportPage = lazy(() => import('@/features/reports/ReportPage'))
const LTPsReportPage = lazy(() => import('@/features/reports/LTPsReportPage'))
const AccionesReportPage = lazy(() => import('@/features/reports/AccionesReportPage'))
const EtiquetasReportPage = lazy(() => import('@/features/reports/EtiquetasReportPage'))
const TransaccionesReportPage = lazy(() => import('@/features/reports/TransaccionesReportPage'))
const TransaccionesJsonReportPage = lazy(() => import('@/features/reports/TransaccionesJsonReportPage'))
const JustificacionesReportPage = lazy(() => import('@/features/reports/JustificacionesReportPage'))
const DependenciasReportPage = lazy(() => import('@/features/reports/DependenciasReportPage'))
const DescripcionesReportPage = lazy(() => import('@/features/reports/DescripcionesReportPage'))
const NotasReportPage = lazy(() => import('@/features/reports/NotasReportPage'))
const DocumentosReportPage = lazy(() => import('@/features/reports/DocumentosReportPage'))
const ChatPage = lazy(() => import('@/features/chat/ChatPage').then(m => ({ default: m.ChatPage })))
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then(m => ({ default: m.RegisterPage })))
const JobsPage = lazy(() => import('@/pages/JobsPage').then(m => ({ default: m.JobsPage })))
const ParametricasPage = lazy(() => import('@/features/parametricas/ParametricasPage'))
const EtiquetasDestacadasPage = lazy(() => import('@/features/parametricas/EtiquetasDestacadasPage'))

const logger = createLogger('App')

function TitledSignIn() {
  usePageTitle('Iniciar Sesion')
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn routing="path" path="/sign-in" afterSignInUrl="/dashboard" />
    </div>
  )
}

function TitledSignUp() {
  usePageTitle('Registrarse')
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp routing="path" path="/sign-up" afterSignUpUrl="/dashboard" />
    </div>
  )
}

/**
 * Main application component with routing
 */
function App() {
  logger.info('Application initialized')

  return (
    <Providers>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/sign-in/*" element={<TitledSignIn />} />
          <Route path="/sign-up/*" element={<TitledSignUp />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<ErrorBoundary><Suspense fallback={<DashboardSkeleton />}><DashboardPage /></Suspense></ErrorBoundary>} />
            <Route path="/search" element={<ErrorBoundary><Suspense fallback={<SearchSkeleton />}><SearchPage /></Suspense></ErrorBoundary>} />
            <Route path="/detail/:portfolio_id" element={<ErrorBoundary><Suspense fallback={<DetailSkeleton />}><DetailPage /></Suspense></ErrorBoundary>} />
            <Route path="/informes/hechos" element={<ErrorBoundary><Suspense fallback={<ReportSkeleton />}><ReportPage /></Suspense></ErrorBoundary>} />
            <Route path="/informes/ltps" element={<ErrorBoundary><Suspense fallback={<ReportSkeleton />}><LTPsReportPage /></Suspense></ErrorBoundary>} />
            <Route path="/informes/acciones" element={<ErrorBoundary><Suspense fallback={<ReportSkeleton />}><AccionesReportPage /></Suspense></ErrorBoundary>} />
            <Route path="/informes/etiquetas" element={<ErrorBoundary><Suspense fallback={<ReportSkeleton />}><EtiquetasReportPage /></Suspense></ErrorBoundary>} />
            <Route path="/informes/transacciones" element={<ErrorBoundary><Suspense fallback={<ReportSkeleton />}><TransaccionesReportPage /></Suspense></ErrorBoundary>} />
            <Route path="/informes/transacciones-json" element={<ErrorBoundary><Suspense fallback={<ReportSkeleton />}><TransaccionesJsonReportPage /></Suspense></ErrorBoundary>} />
            <Route path="/informes/justificaciones" element={<ErrorBoundary><Suspense fallback={<ReportSkeleton />}><JustificacionesReportPage /></Suspense></ErrorBoundary>} />
            <Route path="/informes/dependencias" element={<ErrorBoundary><Suspense fallback={<ReportSkeleton />}><DependenciasReportPage /></Suspense></ErrorBoundary>} />
            <Route path="/informes/descripciones" element={<ErrorBoundary><Suspense fallback={<ReportSkeleton />}><DescripcionesReportPage /></Suspense></ErrorBoundary>} />
            <Route path="/informes/notas" element={<ErrorBoundary><Suspense fallback={<ReportSkeleton />}><NotasReportPage /></Suspense></ErrorBoundary>} />
            <Route path="/informes/documentos" element={<ErrorBoundary><Suspense fallback={<ReportSkeleton />}><DocumentosReportPage /></Suspense></ErrorBoundary>} />
            <Route path="/chat" element={<ErrorBoundary><Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><ChatPage /></Suspense></ErrorBoundary>} />
            <Route path="/register" element={<ErrorBoundary><Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><RegisterPage /></Suspense></ErrorBoundary>} />
            <Route path="/jobs" element={<ErrorBoundary><Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><JobsPage /></Suspense></ErrorBoundary>} />
            <Route path="/parametricas/etiquetas-destacadas" element={<ErrorBoundary><Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><EtiquetasDestacadasPage /></Suspense></ErrorBoundary>} />
            <Route path="/parametricas" element={<ErrorBoundary><Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><ParametricasPage /></Suspense></ErrorBoundary>} />
          </Route>

          {/* 404 catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </Providers>
  )
}

export default App
