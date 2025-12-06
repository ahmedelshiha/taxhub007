/**
 * Entity Status Badge
 * 
 * Reusable status badge component for entities.
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type EntityStatus =
    | 'ACTIVE'
    | 'PENDING'
    | 'PENDING_APPROVAL'
    | 'APPROVED'
    | 'REJECTED'
    | 'REQUIRES_CHANGES'
    | 'ARCHIVED'
    | 'SUSPENDED'

interface EntityStatusBadgeProps {
    status: string
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

const statusConfig: Record<EntityStatus, { label: string; className: string }> = {
    ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
    PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
    PENDING_APPROVAL: { label: 'Pending Approval', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
    APPROVED: { label: 'Approved', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
    REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
    REQUIRES_CHANGES: { label: 'Requires Changes', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
    ARCHIVED: { label: 'Archived', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    SUSPENDED: { label: 'Suspended', className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
}

const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
}

export function EntityStatusBadge({ status, size = 'md', className }: EntityStatusBadgeProps) {
    const config = statusConfig[status as EntityStatus] || {
        label: status,
        className: 'bg-gray-100 text-gray-700',
    }

    return (
        <Badge
            className={cn(
                'font-medium border-0',
                config.className,
                sizeClasses[size],
                className
            )}
        >
            {config.label}
        </Badge>
    )
}
