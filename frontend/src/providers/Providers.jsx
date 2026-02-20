import { ClerkProvider } from '@clerk/clerk-react'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { ColorThemeProvider } from '@/components/theme/ColorThemeProvider'
import { QueryProvider } from './QueryProvider'
import { ChatProvider } from '@/features/chat/ChatContext'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

/**
 * Combined providers wrapper
 * Wraps the app with all necessary providers
 */
export function Providers({ children }) {
  if (!clerkPubKey) {
    console.warn('Missing VITE_CLERK_PUBLISHABLE_KEY - auth will not work')
  }

  return (
    <ClerkProvider
      publishableKey={clerkPubKey || 'pk_test_placeholder'}
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
      afterSignOutUrl="/"
    >
      <ThemeProvider>
        <ColorThemeProvider>
          <QueryProvider>
            <ChatProvider>
              {children}
              <Toaster richColors position="top-right" />
            </ChatProvider>
          </QueryProvider>
        </ColorThemeProvider>
      </ThemeProvider>
    </ClerkProvider>
  )
}
