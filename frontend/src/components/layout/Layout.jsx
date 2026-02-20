import { Navbar } from './Navbar'
import { Footer } from './Footer'

/**
 * Main layout wrapper with navbar and footer
 */
export function Layout({ children, showFooter = true }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      {showFooter && <Footer />}
    </div>
  )
}
