import './globals.css'
import { Inter } from 'next/font/google'
import { Metadata, Viewport } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'

// Initialize Inter font
const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: {
    template: '%s | CostPerDemo',
    default: 'CostPerDemo - B2B SaaS Platform'
  },
  description: 'Client onboarding, campaign management, and analytics platform',
}

/**
 * Root layout component that wraps all pages
 * Provides HTML structure, font, and metadata
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen bg-[hsl(var(--background))]">
            {children}
          </main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
} 