'use client'

/**
 * WelcomeEmptyState - Compact Empty State Component
 * 
 * Compact, professional empty state for new portal users.
 * Takes minimal vertical space while being visually appealing.
 */

import { Plus, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WelcomeEmptyStateProps {
    title?: string
    onAddBusiness?: () => void
}

export function WelcomeEmptyState({
    title = 'Your Businesses',
    onAddBusiness
}: WelcomeEmptyStateProps) {
    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">{title}</h2>
            </div>

            {/* Compact Empty State Card */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-5 shadow-lg">
                {/* Decorative Background */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-purple-400/20 rounded-full blur-2xl" />
                </div>

                {/* Content - Horizontal Layout */}
                <div className="relative z-10 flex items-center gap-5">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                        <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                            <Building2 className="w-7 h-7 text-white" />
                        </div>
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white mb-0.5">
                            Add your first business
                        </h3>
                        <p className="text-sm text-blue-100/90">
                            Unlock tax management, compliance tracking, and financial tools.
                        </p>
                    </div>

                    {/* CTA Button */}
                    {onAddBusiness && (
                        <div className="flex-shrink-0">
                            <Button
                                onClick={onAddBusiness}
                                className="
                                    bg-white text-indigo-700 hover:bg-blue-50 
                                    font-semibold px-5 h-10
                                    shadow-lg hover:shadow-xl
                                    transform hover:scale-[1.02] transition-all duration-200
                                "
                            >
                                <Plus className="w-4 h-4 mr-1.5" />
                                Add Business
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default WelcomeEmptyState
