import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

/**
 * Main layout wrapper with navbar and footer
 */
export function Layout({ children, showFooter = true }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Breadcrumb />
      <main className="flex-1">{children}</main>
      {showFooter && <Footer />}
    </div>
  )
}
