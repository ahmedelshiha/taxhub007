/**
 * Entity Document Delete API
 * 
 * DELETE - Remove a document from an entity
 * 
 * Uses the existing Attachment model and uploads-provider.
 */

import { NextRequest } from "next/server"
import { withAdminAuth } from "@/lib/api-wrapper"
import { requireTenantContext } from "@/lib/tenant-utils"
import { respond } from "@/lib/api-response"
import prisma from "@/lib/prisma"
import { removeObject } from "@/lib/uploads-provider"

/**
 * DELETE /api/admin/entities/[id]/documents/[docId]
 * Delete a document (attachment)
 */
export const DELETE = withAdminAuth(
    async (
        request: NextRequest,
        { params }: { params: Promise<{ id: string; docId: string }> }
    ) => {
        try {
            const { userId, tenantId } = requireTenantContext()
            const { id: entityId, docId } = await params

            if (!entityId || !docId) {
                return respond.badRequest("Entity ID and Document ID are required")
            }

            // Verify entity exists
            const entity = await prisma.entity.findFirst({
                where: { id: entityId, tenantId: tenantId as string },
            })

            if (!entity) {
                return respond.notFound("Entity not found")
            }

            // Find the attachment
            const attachment = await prisma.attachment.findFirst({
                where: {
                    id: docId,
                    entityId,
                    tenantId: tenantId as string,
                },
            })

            if (!attachment) {
                return respond.notFound("Document not found")
            }

            // Delete from cloud storage if key exists
            if (attachment.key) {
                try {
                    await removeObject(attachment.key)
                } catch (storageError) {
                    console.warn("Failed to delete from storage:", storageError)
                    // Continue with database deletion even if storage fails
                }
            }

            // Delete attachment record
            await prisma.attachment.delete({
                where: { id: docId },
            })

            // Log audit event
            await prisma.entityAuditLog.create({
                data: {
                    entityId,
                    userId: userId as string,
                    action: "DOCUMENT_DELETED",
                    changes: {
                        attachmentId: docId,
                        name: attachment.name,
                    },
                },
            })

            return respond.ok({ message: "Document deleted successfully" })
        } catch (error) {
            console.error("Error deleting document:", error)
            return respond.serverError()
        }
    },
    { requireAuth: true }
)

/**
 * GET /api/admin/entities/[id]/documents/[docId]/download
 * Download a document
 */
export const GET = withAdminAuth(
    async (
        request: NextRequest,
        { params }: { params: Promise<{ id: string; docId: string }> }
    ) => {
        try {
            const { tenantId } = requireTenantContext()
            const { id: entityId, docId } = await params

            if (!entityId || !docId) {
                return respond.badRequest("Entity ID and Document ID are required")
            }

            // Find the attachment
            const attachment = await prisma.attachment.findFirst({
                where: {
                    id: docId,
                    entityId,
                    tenantId: tenantId as string,
                },
            })

            if (!attachment) {
                return respond.notFound("Document not found")
            }

            // Redirect to the document URL
            if (attachment.url) {
                return Response.redirect(attachment.url, 302)
            }

            return respond.notFound("Document URL not available")
        } catch (error) {
            console.error("Error downloading document:", error)
            return respond.serverError()
        }
    },
    { requireAuth: true }
)
