/**
 * Entity Detail Tabs
 * 
 * Tab container for entity detail page with lazy loading.
 */

'use client'

import { Suspense, lazy } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load tabs
const OverviewTab = lazy(() => import('../tabs/OverviewTab'))
const UsersAccessTab = lazy(() => import('../tabs/UsersAccessTab'))
const DocumentsTab = lazy(() => import('../tabs/DocumentsTab'))
const RegistrationsTab = lazy(() => import('../tabs/RegistrationsTab'))
const LicensesTab = lazy(() => import('../tabs/LicensesTab'))
const ActivityLogTab = lazy(() => import('../tabs/ActivityLogTab'))

interface EntityDetailTabsProps {
    entityId: string
    defaultTab?: string
}

function TabSkeleton() {
    return (
        <div className="space-y-4 p-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
    )
}

export function EntityDetailTabs({ entityId, defaultTab = 'overview' }: EntityDetailTabsProps) {
    return (
        <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="registrations">Registrations</TabsTrigger>
                <TabsTrigger value="licenses">Licenses</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
                <Suspense fallback={<TabSkeleton />}>
                    <OverviewTab entityId={entityId} />
                </Suspense>
            </TabsContent>

            <TabsContent value="users" className="mt-4">
                <Suspense fallback={<TabSkeleton />}>
                    <UsersAccessTab entityId={entityId} />
                </Suspense>
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
                <Suspense fallback={<TabSkeleton />}>
                    <DocumentsTab entityId={entityId} />
                </Suspense>
            </TabsContent>

            <TabsContent value="registrations" className="mt-4">
                <Suspense fallback={<TabSkeleton />}>
                    <RegistrationsTab entityId={entityId} />
                </Suspense>
            </TabsContent>

            <TabsContent value="licenses" className="mt-4">
                <Suspense fallback={<TabSkeleton />}>
                    <LicensesTab entityId={entityId} />
                </Suspense>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
                <Suspense fallback={<TabSkeleton />}>
                    <ActivityLogTab entityId={entityId} />
                </Suspense>
            </TabsContent>
        </Tabs>
    )
}
