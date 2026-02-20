import { Layout } from '@/components/layout/Layout'
import { usePageTitle } from '@/hooks/usePageTitle'
import { HeroSection } from './components/HeroSection'
import { ChangelogSection } from './components/ChangelogSection'

/**
 * Public landing page
 */
export function LandingPage() {
  usePageTitle()

  return (
    <Layout>
      <HeroSection />
      <ChangelogSection />
    </Layout>
  )
}
