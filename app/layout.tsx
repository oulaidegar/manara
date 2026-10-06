import type { Metadata } from 'next'
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Radar — Public-Interest Impact & Performance',
  description: 'Communications analytics, strategic initiatives, and verifiable real-world impact for civil society.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <ClerkProvider>
          <Providers>
            <header className="flex justify-end items-center p-4 gap-4 h-16">
              <Show when="signed-out">
                <SignInButton mode="modal" fallbackRedirectUrl="/~/select-org">
                  <button className="text-sm font-medium hover:text-[var(--primary)] transition-colors cursor-pointer">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal" fallbackRedirectUrl="/~/select-org">
                  <button className="bg-purple-700 text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                    Sign Up
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </header>
            {children}
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  )
}

