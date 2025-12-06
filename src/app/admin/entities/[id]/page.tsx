/**
 * Entity Detail Page (Refactored)
 * 
 * Uses modular components for tabs, header, and actions.
 */

"use client"

import { Suspense, useState, useEffect } from "react"
import { useParams } from "next/navigation"
import useSWR from "swr"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { EntityHeader, EntityQuickActions, EntityDetailTabs } from "@/components/admin/entities/detail"
import { fetcher } from "@/lib/api-client"

export default function EntityDetailPage() {
  const params = useParams() as { id?: string }
  const entityId = params?.id

  const { data, error, isLoading, mutate } = useSWR(
    entityId ? `/api/entities/${entityId}` : null,
    fetcher
  )

  const entity = data?.data

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !entity) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {error?.message || "Entity not found"}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header with Status Cards */}
      <EntityHeader entity={entity} />

      {/* Quick Actions */}
      <div className="flex justify-end">
        <EntityQuickActions
          entity={entity}
          onUpdate={() => mutate()}
        />
      </div>

      {/* Tabbed Content */}
      <Suspense fallback={<div className="h-96 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
        <EntityDetailTabs entityId={entity.id} />
      </Suspense>
    </div>
  )
}
