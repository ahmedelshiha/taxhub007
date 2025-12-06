/**
 * Request Changes API
 * 
 * Request modifications to an entity application.
 */

import { NextRequest } from "next/server"
import { withAdminAuth } from "@/lib/api-wrapper"
import { requireTenantContext } from "@/lib/tenant-utils"
import { respond } from "@/lib/api-response"
import { entityApprovalService } from "@/services/entities/entity-approval.service"
import { z } from "zod"

const requestChangesSchema = z.object({
    issues: z.array(z.string()).optional(),
    additionalNotes: z.string().optional(),
})

/**
 * POST /api/admin/entities/[id]/request-changes
 * Request changes for an entity
 */
export const POST = withAdminAuth(
    async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
        try {
            const { userId, tenantId } = requireTenantContext()
            const { id: entityId } = await params

            if (!entityId) {
                return respond.badRequest("Entity ID is required")
            }

            const body = await request.json()
            const validated = requestChangesSchema.parse(body)

            // Combine issues and notes into reason
            const issuesList = validated.issues?.join("; ") || ""
            const notes = validated.additionalNotes || ""
            const reason = [issuesList, notes].filter(Boolean).join("\n\n")

            if (!reason.trim()) {
                return respond.badRequest("At least one issue or note is required")
            }

            const approval = await entityApprovalService.requestChanges(
                entityId,
                userId as string,
                reason,
                tenantId as string,
                {}
            )

            return respond.ok({
                success: true,
                message: "Change request sent",
                approval,
            })
        } catch (error) {
            console.error("Error requesting changes:", error)

            if (error instanceof z.ZodError) {
                return respond.badRequest(
                    "Validation error: " + error.errors.map((e) => e.message).join(", ")
                )
            }

            if (error instanceof Error) {
                return respond.badRequest(error.message)
            }

            return respond.serverError()
        }
    },
    { requireAuth: true }
)
