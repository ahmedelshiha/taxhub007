'use client'

import { AlertTriangle } from 'lucide-react'

export function LayoutErrorFallback({ error }: { error?: string }) {
    return (
        <html lang="en">
            <body>
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                    <div className="max-w-md w-full text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full">
                                <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Portal Temporarily Unavailable
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                We&apos;re experiencing technical difficulties. Please try again in a moment.
                            </p>
                            {error && (
                                <p className="text-xs text-gray-500 mt-4 font-mono">{error}</p>
                            )}
                        </div>
                        <a
                            href="/login"
                            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Return to Login
                        </a>
                    </div>
                </div>
            </body>
        </html>
    )
}
