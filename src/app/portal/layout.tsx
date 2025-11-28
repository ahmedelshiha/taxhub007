/**
 * Portal Layout
 * Applies PortalDashboardLayout with all required providers to /portal/* routes
 * 
 * Providers:
 * - SessionProvider: Authentication state
 * - ThemeProvider: Dark mode support
 * - QueryProvider: React Query data fetching
 */

import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { authOptions } from '@/lib/auth'
import PortalDashboardLayout from '@/components/portal/layout/PortalDashboardLayout'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { QueryProvider } from '@/providers/QueryProvider'
import { LayoutErrorFallback } from './LayoutErrorFallback'

export const dynamic = 'force-dynamic'

export default async function PortalAppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Get session server-side for initial state with comprehensive error handling
    let session: Session | null = null
    let layoutError: string | null = null

    try {
        const sessionPromise = getServerSession(authOptions)
        const timeoutPromise = new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), 2000)
        )

        const result = await Promise.race([sessionPromise, timeoutPromise])
        session = result as Session | null

        // If we got a timeout, log it but continue
        if (result === null) {
            console.warn('[Portal Layout] Session fetch timed out after 2s, continuing with null session')
        }
    } catch (error) {
        console.error('[Portal Layout] Failed to get session:', error)
        layoutError = error instanceof Error ? error.message : 'Unknown error'
        session = null
    }

    // If we have a critical layout error, return fallback
    if (layoutError && layoutError.includes('ECONNREFUSED')) {
        return <LayoutErrorFallback error="Database connection failed" />
    }

    // Wrap providers with additional error boundary
    try {
        return (
            <SessionProvider session={session}>
                <ThemeProvider defaultTheme="light" enableSystem>
                    <QueryProvider>
                        <PortalDashboardLayout>
                            {children}
                        </PortalDashboardLayout>
                    </QueryProvider>
                </ThemeProvider>
            </SessionProvider>
        )
    } catch (error) {
        console.error('[Portal Layout] Provider initialization failed:', error)
        return <LayoutErrorFallback error="Failed to initialize portal" />
    }
}
