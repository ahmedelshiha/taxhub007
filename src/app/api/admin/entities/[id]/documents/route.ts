/**
 * Entity Documents API
 * 
 * GET - List documents (attachments) for an entity
 * POST - Upload a new document
 * 
 * Uses the existing Attachment model and uploads-provider for cloud storage.
 */

import { NextRequest } from "next/server"
import { withAdminAuth } from "@/lib/api-wrapper"
import { requireTenantContext } from "@/lib/tenant-utils"
import { respond } from "@/lib/api-response"
import prisma from "@/lib/prisma"
import { putObject, getPublicUrl } from "@/lib/uploads-provider"

/**
 * GET /api/admin/entities/[id]/documents
 * Get all documents for an entity (using Attachment model)
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

            // Get all attachments linked to this entity
            const attachments = await prisma.attachment.findMany({
                where: {
                    entityId,
                    tenantId: tenantId as string,
                },
                orderBy: { uploadedAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    key: true,
                    url: true,
                    size: true,
                    contentType: true,
                    metadata: true,
                    uploadedAt: true,
                    uploader: {
                        select: { id: true, name: true, email: true },
                    },
                },
            })

            // Transform to include category from metadata
            const documents = attachments.map((att) => ({
                id: att.id,
                name: att.name || "Untitled",
                category: (att.metadata as any)?.category || "OTHER",
                size: att.size || 0,
                mimeType: att.contentType,
                url: att.url,
                key: att.key,
                createdAt: att.uploadedAt,
                uploadedBy: att.uploader,
            }))

            return respond.ok({ data: documents })
        } catch (error) {
            console.error("Error fetching documents:", error)
            return respond.serverError()
        }
    },
    { requireAuth: true }
)

/**
 * POST /api/admin/entities/[id]/documents
 * Upload a new document
 */
export const POST = withAdminAuth(
    async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
        try {
            const { userId, tenantId } = requireTenantContext()
            const { id: entityId } = await params

            if (!entityId) {
                return respond.badRequest("Entity ID is required")
            }

            // Verify entity exists
            const entity = await prisma.entity.findFirst({
                where: { id: entityId, tenantId: tenantId as string },
            })

            if (!entity) {
                return respond.notFound("Entity not found")
            }

            const formData = await request.formData()
            const file = formData.get("file") as File | null
            const name = formData.get("name") as string || "Untitled"
            const category = formData.get("category") as string || "OTHER"

            if (!file) {
                return respond.badRequest("No file provided")
            }

            // Validate file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                return respond.badRequest("File too large. Maximum size is 10MB.")
            }

            // Generate unique key for storage
            const fileExt = file.name.split('.').pop() || 'bin'
            const key = `entities/${entityId}/documents/${Date.now()}-${name.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`

            // Upload to cloud storage
            const buffer = Buffer.from(await file.arrayBuffer())
            let url: string | undefined

            try {
                await putObject(key, buffer, { contentType: file.type })
                url = await getPublicUrl(key)
            } catch (uploadError) {
                // If cloud storage fails, store as base64 (fallback for development)
                console.warn("Cloud storage unavailable, using base64 fallback:", uploadError)
                url = `data:${file.type};base64,${buffer.toString("base64")}`
            }

            // Create attachment record
            const attachment = await prisma.attachment.create({
                data: {
                    key,
                    url,
                    name,
                    size: file.size,
                    contentType: file.type,
                    entityId,
                    uploaderId: userId as string,
                    tenantId: tenantId as string,
                    metadata: { category },
                },
                select: {
                    id: true,
                    name: true,
                    key: true,
                    url: true,
                    size: true,
                    contentType: true,
                    metadata: true,
                    uploadedAt: true,
                },
            })

            // Log audit event
            await prisma.entityAuditLog.create({
                data: {
                    entityId,
                    userId: userId as string,
                    action: "DOCUMENT_UPLOADED",
                    changes: {
                        attachmentId: attachment.id,
                        name,
                        category,
                        size: file.size,
                    },
                },
            })

            return respond.created({
                data: {
                    id: attachment.id,
                    name: attachment.name,
                    category,
                    size: attachment.size,
                    mimeType: attachment.contentType,
                    url: attachment.url,
                    createdAt: attachment.uploadedAt,
                },
                message: "Document uploaded successfully"
            })
        } catch (error) {
            console.error("Error uploading document:", error)
            return respond.serverError()
        }
    },
    { requireAuth: true }
)
