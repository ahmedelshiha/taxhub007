/**
 * Registrations Tab
 * 
 * Display entity tax registrations.
 */

'use client'

import useSWR from 'swr'
import { FileCheck, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { fetcher } from '@/lib/api-client'
import { formatDate } from '@/lib/date-utils'

interface RegistrationsTabProps {
    entityId: string
}

const statusColors: Record<string, string> = {
    VERIFIED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    EXPIRED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function RegistrationsTab({ entityId }: RegistrationsTabProps) {
    const { data, isLoading } = useSWR(`/api/entities/${entityId}`, fetcher)
    const registrations = data?.data?.registrations || []

    if (isLoading) {
        return <RegistrationsSkeleton />
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Tax Registrations</CardTitle>
                <Button size="sm" className="gap-1">
                    <Plus className="h-4 w-4" />
                    Add Registration
                </Button>
            </CardHeader>
            <CardContent>
                {registrations.length === 0 ? (
                    <div className="text-center py-12">
                        <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No registrations found</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {registrations.map((reg: any) => (
                            <div
                                key={reg.id}
                                className="flex items-center justify-between p-4 border rounded-lg"
                            >
                                <div>
                                    <div className="font-medium">{reg.type}</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        {reg.value}
                                    </div>
                                    {reg.verifiedAt && (
                                        <div className="text-xs text-green-600 mt-1">
                                            ✓ Verified {formatDate(reg.verifiedAt)}
                                        </div>
                                    )}
                                </div>
                                <Badge className={statusColors[reg.status] || statusColors.PENDING}>
                                    {reg.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function RegistrationsSkeleton() {
    return (
        <Card>
            <CardContent className="pt-6 space-y-3">
                {[1, 2].map(i => (
                    <div key={i} className="p-4 border rounded-lg">
                        <Skeleton className="h-5 w-1/4 mb-2" />
                        <Skeleton className="h-4 w-1/3" />
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
