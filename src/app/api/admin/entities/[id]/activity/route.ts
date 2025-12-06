/**
 * Entity Activity API
 * 
 * Get activity log for an entity.
 */

import { NextRequest } from "next/server"
import { withAdminAuth } from "@/lib/api-wrapper"
import { requireTenantContext } from "@/lib/tenant-utils"
import { respond } from "@/lib/api-response"
import prisma from "@/lib/prisma"

/**
 * GET /api/admin/entities/[id]/activity
 * Get activity log for an entity
 */
export const GET = withAdminAuth(
    async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
        try {
            const { tenantId } = requireTenantContext()
            const { id: entityId } = await params
            const { searchParams } = new URL(request.url)

            const page = parseInt(searchParams.get("page") || "1")
            const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100)
            const actionFilter = searchParams.get("action")

            if (!entityId) {
                return respond.badRequest("Entity ID is required")
            }

            // Verify entity exists and belongs to tenant
            const entity = await prisma.entity.findFirst({
                where: { id: entityId, tenantId: tenantId as string },
            })

            if (!entity) {
                return respond.notFound("Entity not found")
            }

            // Build where clause
            const where: any = { entityId }
            if (actionFilter) {
                where.action = actionFilter
            }

            // Get activity logs
            const [activities, total] = await Promise.all([
                prisma.entityAuditLog.findMany({
                    where,
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                prisma.entityAuditLog.count({ where }),
            ])

            return respond.ok({
                data: activities,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            })
        } catch (error) {
            console.error("Error fetching entity activity:", error)
            return respond.serverError()
        }
    },
    { requireAuth: true }
)
