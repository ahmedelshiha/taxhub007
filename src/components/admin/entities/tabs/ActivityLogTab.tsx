/**
 * Activity Log Tab
 * 
 * Timeline of all actions on the entity.
 */

'use client'

import useSWR from 'swr'
import {
    Clock,
    CheckCircle,
    XCircle,
    UserPlus,
    FileEdit,
    Archive,
    Eye
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { fetcher } from '@/lib/api-client'
import { formatDate } from '@/lib/date-utils'

interface ActivityLogTabProps {
    entityId: string
}

const actionIcons: Record<string, any> = {
    CREATED: CheckCircle,
    APPROVED: CheckCircle,
    REJECTED: XCircle,
    UPDATED: FileEdit,
    ACCESS_GRANTED: UserPlus,
    ACCESS_REVOKED: XCircle,
    ARCHIVED: Archive,
    VIEWED: Eye,
}

const actionColors: Record<string, string> = {
    CREATED: 'text-green-600 bg-green-100',
    APPROVED: 'text-green-600 bg-green-100',
    REJECTED: 'text-red-600 bg-red-100',
    UPDATED: 'text-blue-600 bg-blue-100',
    ACCESS_GRANTED: 'text-purple-600 bg-purple-100',
    ACCESS_REVOKED: 'text-orange-600 bg-orange-100',
    ARCHIVED: 'text-gray-600 bg-gray-100',
    VIEWED: 'text-gray-600 bg-gray-100',
}

export default function ActivityLogTab({ entityId }: ActivityLogTabProps) {
    const { data, isLoading } = useSWR(`/api/admin/entities/${entityId}/activity`, fetcher)
    const activities = data?.data || []

    if (isLoading) {
        return <ActivitySkeleton />
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
                {activities.length === 0 ? (
                    <div className="text-center py-12">
                        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No activity recorded</p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

                        <div className="space-y-4">
                            {activities.map((activity: any) => {
                                const Icon = actionIcons[activity.action] || FileEdit
                                const color = actionColors[activity.action] || actionColors.UPDATED

                                return (
                                    <div key={activity.id} className="flex gap-4 relative">
                                        {/* Icon */}
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${color}`}>
                                            <Icon className="h-4 w-4" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 pb-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{activity.action.replace(/_/g, ' ')}</span>
                                                <span className="text-sm text-muted-foreground">
                                                    by {activity.user?.name || 'System'}
                                                </span>
                                            </div>
                                            <div className="text-sm text-muted-foreground mt-1">
                                                {formatDate(activity.createdAt)}
                                            </div>
                                            {activity.changes && (
                                                <div className="mt-2 text-sm bg-muted p-2 rounded">
                                                    {typeof activity.changes === 'string'
                                                        ? activity.changes
                                                        : JSON.stringify(activity.changes, null, 2)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function ActivitySkeleton() {
    return (
        <Card>
            <CardContent className="pt-6 space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1">
                            <Skeleton className="h-4 w-1/3 mb-2" />
                            <Skeleton className="h-3 w-1/4" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
