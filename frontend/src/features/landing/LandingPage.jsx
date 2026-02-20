import { Layout } from '@/components/layout/Layout'
import { usePageTitle } from '@/hooks/usePageTitle'
import { HeroSection } from './components/HeroSection'
import { ChangelogSection } from './components/ChangelogSection'
import { createLogger } from '@/lib/logger'

const logger = createLogger('LandingPage')

/**
 * Public landing page
 */
export function LandingPage() {
  usePageTitle()
  logger.info('Landing page loaded')

  return (
    <Layout>
      <HeroSection />
      <ChangelogSection />
    </Layout>
  )
}
