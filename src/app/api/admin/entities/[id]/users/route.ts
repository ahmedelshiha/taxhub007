/**
 * Entity Users API
 * 
 * Manage users with access to an entity.
 */

import { NextRequest } from "next/server"
import { withAdminAuth } from "@/lib/api-wrapper"
import { requireTenantContext } from "@/lib/tenant-utils"
import { respond } from "@/lib/api-response"
import prisma from "@/lib/prisma"
import { z } from "zod"

const addUserSchema = z.object({
    userId: z.string(),
    role: z.enum(["OWNER", "EDITOR", "VIEWER"]).default("VIEWER"),
    notify: z.boolean().optional().default(true),
})

/**
 * GET /api/admin/entities/[id]/users
 * Get all users with access to this entity
 */
export const GET = withAdminAuth(
    async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
        try {
            const { tenantId } = requireTenantContext()
            const { id: entityId } = await params

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

            // Get users with access
            const userAccess = await prisma.userOnEntity.findMany({
                where: { entityId },
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
            })

            return respond.ok({ data: userAccess })
        } catch (error) {
            console.error("Error fetching entity users:", error)
            return respond.serverError()
        }
    },
    { requireAuth: true }
)

/**
 * POST /api/admin/entities/[id]/users
 * Add a user to this entity
 */
export const POST = withAdminAuth(
    async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
        try {
            const { userId: adminId, tenantId } = requireTenantContext()
            const { id: entityId } = await params

            if (!entityId) {
                return respond.badRequest("Entity ID is required")
            }

            const body = await request.json()
            const validated = addUserSchema.parse(body)

            // Verify entity exists
            const entity = await prisma.entity.findFirst({
                where: { id: entityId, tenantId: tenantId as string },
            })

            if (!entity) {
                return respond.notFound("Entity not found")
            }

            // Check if user already has access
            const existing = await prisma.userOnEntity.findUnique({
                where: {
                    userId_entityId: {
                        userId: validated.userId,
                        entityId,
                    },
                },
            })

            if (existing) {
                // Update role
                const updated = await prisma.userOnEntity.update({
                    where: { id: existing.id },
                    data: { role: validated.role },
                    include: { user: { select: { id: true, name: true, email: true } } },
                })
                return respond.ok({ data: updated, message: "User role updated" })
            }

            // Create new access
            const access = await prisma.userOnEntity.create({
                data: {
                    userId: validated.userId,
                    entityId,
                    role: validated.role,
                },
                include: { user: { select: { id: true, name: true, email: true } } },
            })

            // Log audit event
            await prisma.entityAuditLog.create({
                data: {
                    entityId,
                    userId: adminId as string,
                    action: "ACCESS_GRANTED",
                    changes: {
                        grantedTo: validated.userId,
                        role: validated.role,
                    },
                },
            })

            return respond.created({ data: access, message: "User added successfully" })
        } catch (error) {
            console.error("Error adding user to entity:", error)

            if (error instanceof z.ZodError) {
                return respond.badRequest(
                    "Validation error: " + error.errors.map((e) => e.message).join(", ")
                )
            }

            return respond.serverError()
        }
    },
    { requireAuth: true }
)
