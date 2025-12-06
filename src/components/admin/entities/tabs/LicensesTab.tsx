/**
 * Licenses Tab
 * 
 * Display entity business licenses.
 */

'use client'

import useSWR from 'swr'
import { Award, Plus, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { fetcher } from '@/lib/api-client'
import { formatDate } from '@/lib/date-utils'

interface LicensesTabProps {
    entityId: string
}

const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    EXPIRED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    EXPIRING_SOON: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

export default function LicensesTab({ entityId }: LicensesTabProps) {
    const { data, isLoading } = useSWR(`/api/entities/${entityId}`, fetcher)
    const licenses = data?.data?.licenses || []

    if (isLoading) {
        return <LicensesSkeleton />
    }

    // Check for expiring licenses
    const now = new Date()
    const expiringLicenses = licenses.filter((lic: any) => {
        if (!lic.expiresAt) return false
        const expiry = new Date(lic.expiresAt)
        const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiry > 0 && daysUntilExpiry <= 30
    })

    return (
        <div className="space-y-4">
            {/* Expiring Warning */}
            {expiringLicenses.length > 0 && (
                <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800">
                    <CardContent className="pt-4 flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <p className="text-sm text-orange-700 dark:text-orange-400">
                            {expiringLicenses.length} license(s) expiring within 30 days
                        </p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Business Licenses</CardTitle>
                    <Button size="sm" className="gap-1">
                        <Plus className="h-4 w-4" />
                        Add License
                    </Button>
                </CardHeader>
                <CardContent>
                    {licenses.length === 0 ? (
                        <div className="text-center py-12">
                            <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No licenses found</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {licenses.map((license: any) => (
                                <div
                                    key={license.id}
                                    className="flex items-center justify-between p-4 border rounded-lg"
                                >
                                    <div>
                                        <div className="font-medium">{license.authority}</div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            License #: {license.licenseNumber}
                                        </div>
                                        {license.expiresAt && (
                                            <div className="text-xs text-muted-foreground mt-1">
                                                Expires: {formatDate(license.expiresAt)}
                                            </div>
                                        )}
                                    </div>
                                    <Badge className={statusColors[license.status] || statusColors.PENDING}>
                                        {license.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function LicensesSkeleton() {
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
