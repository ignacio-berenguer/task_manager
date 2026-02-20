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
import { SearchSkeleton } from '@/components/shared/skeletons/SearchSkeleton'
import { DetailSkeleton } from '@/components/shared/skeletons/DetailSkeleton'

// Lazy-loaded route components (code-split by route)
const SearchPage = lazy(() => import('@/features/search/SearchPage'))
const DetailPage = lazy(() => import('@/features/detail/DetailPage'))
const ChatPage = lazy(() => import('@/features/chat/ChatPage').then(m => ({ default: m.ChatPage })))

const logger = createLogger('App')

function TitledSignIn() {
  usePageTitle('Iniciar Sesion')
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn routing="path" path="/sign-in" afterSignInUrl="/search" />
    </div>
  )
}

function TitledSignUp() {
  usePageTitle('Registrarse')
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp routing="path" path="/sign-up" afterSignUpUrl="/search" />
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
            <Route path="/search" element={<ErrorBoundary><Suspense fallback={<SearchSkeleton />}><SearchPage /></Suspense></ErrorBoundary>} />
            <Route path="/detail/:tarea_id" element={<ErrorBoundary><Suspense fallback={<DetailSkeleton />}><DetailPage /></Suspense></ErrorBoundary>} />
            <Route path="/chat" element={<ErrorBoundary><Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><ChatPage /></Suspense></ErrorBoundary>} />
          </Route>

          {/* 404 catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </Providers>
  )
}

export default App
