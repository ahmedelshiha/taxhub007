/**
 * Entity User Delete API
 * 
 * Remove a user's access to an entity.
 */

import { NextRequest } from "next/server"
import { withAdminAuth } from "@/lib/api-wrapper"
import { requireTenantContext } from "@/lib/tenant-utils"
import { respond } from "@/lib/api-response"
import prisma from "@/lib/prisma"

/**
 * DELETE /api/admin/entities/[id]/users/[userId]
 * Remove a user's access to an entity
 */
export const DELETE = withAdminAuth(
    async (
        request: NextRequest,
        { params }: { params: Promise<{ id: string; userId: string }> }
    ) => {
        try {
            const { userId: adminId, tenantId } = requireTenantContext()
            const { id: entityId, userId } = await params

            if (!entityId || !userId) {
                return respond.badRequest("Entity ID and User ID are required")
            }

            // Verify entity exists
            const entity = await prisma.entity.findFirst({
                where: { id: entityId, tenantId: tenantId as string },
            })

            if (!entity) {
                return respond.notFound("Entity not found")
            }

            // Check if user has access
            const access = await prisma.userOnEntity.findUnique({
                where: {
                    userId_entityId: {
                        userId,
                        entityId,
                    },
                },
            })

            if (!access) {
                return respond.notFound("User access not found")
            }

            // Prevent removing the last owner
            if (access.role === "OWNER") {
                const ownerCount = await prisma.userOnEntity.count({
                    where: { entityId, role: "OWNER" },
                })
                if (ownerCount <= 1) {
                    return respond.badRequest("Cannot remove the last owner")
                }
            }

            // Remove access
            await prisma.userOnEntity.delete({
                where: { id: access.id },
            })

            // Log audit event
            await prisma.entityAuditLog.create({
                data: {
                    entityId,
                    userId: adminId as string,
                    action: "ACCESS_REVOKED",
                    changes: {
                        revokedFrom: userId,
                        previousRole: access.role,
                    },
                },
            })

            return respond.ok({ message: "User access removed" })
        } catch (error) {
            console.error("Error removing user access:", error)
            return respond.serverError()
        }
    },
    { requireAuth: true }
)
