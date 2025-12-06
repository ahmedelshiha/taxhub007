/**
 * Overview Tab
 * 
 * Summary view with key entity information.
 */

'use client'

import useSWR from 'swr'
import { Building2, FileText, Gauge, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { fetcher } from '@/lib/api-client'

interface OverviewTabProps {
    entityId: string
}

export default function OverviewTab({ entityId }: OverviewTabProps) {
    const { data, isLoading } = useSWR(`/api/entities/${entityId}`, fetcher)
    const entity = data?.data

    if (isLoading) {
        return <OverviewSkeleton />
    }

    if (!entity) {
        return <div className="text-muted-foreground">Entity not found</div>
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    icon={Building2}
                    label="Licenses"
                    value={entity.licenses?.length || 0}
                    color="blue"
                />
                <StatCard
                    icon={FileText}
                    label="Registrations"
                    value={entity.registrations?.length || 0}
                    color="green"
                />
                <StatCard
                    icon={Gauge}
                    label="Obligations"
                    value={entity.obligations?.length || 0}
                    color="purple"
                />
                <StatCard
                    icon={Clock}
                    label="Days Active"
                    value={Math.floor((Date.now() - new Date(entity.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                    color="orange"
                />
            </div>

            {/* Business Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Business Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DetailItem label="Business Name" value={entity.name} />
                        <DetailItem label="Country" value={entity.country} />
                        <DetailItem label="Legal Form" value={entity.legalForm || 'Not specified'} />
                        <DetailItem label="Activity Code" value={entity.activityCode || 'Not specified'} />
                        <DetailItem label="Fiscal Year Start" value={entity.fiscalYearStart || 'Not specified'} />
                        <DetailItem label="Registration Number" value={entity.registrationNumber || 'Pending'} />
                    </dl>
                </CardContent>
            </Card>
        </div>
    )
}

function StatCard({ icon: Icon, label, value, color }: {
    icon: any
    label: string
    value: number
    color: 'blue' | 'green' | 'purple' | 'orange'
}) {
    const colors = {
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
        orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    }

    return (
        <Card>
            <CardContent className="pt-4 flex items-center gap-4">
                <div className={`p-3 rounded-lg ${colors[color]}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-sm text-muted-foreground">{label}</div>
                </div>
            </CardContent>
        </Card>
    )
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="font-medium">{value}</dd>
        </div>
    )
}

function OverviewSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <Card key={i}>
                        <CardContent className="pt-4">
                            <Skeleton className="h-12 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </CardContent>
            </Card>
        </div>
    )
}
