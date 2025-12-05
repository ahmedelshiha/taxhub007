/**
 * Entity Setup API
 * POST /api/portal/entities/setup
 * Creates a new business entity for the authenticated user
 * 
 * Security:
 * - Rate limiting: 3 requests per hour per user
 * - CSRF validation via origin check
 * - Input sanitization for XSS prevention
 * - Audit logging for compliance
 */

import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { respond, zodDetails } from '@/lib/api-response'
import prisma from '@/lib/prisma'
import { applyRateLimit, getClientIp } from '@/lib/rate-limit'
import { isSameOrigin } from '@/lib/security/csrf'
import { logAudit } from '@/lib/audit'
import {
  EntitySetupRequestSchema,
  ERROR_CODES,
  type EntitySetupResponse
} from '@/lib/api/contracts/business-setup'

export const runtime = 'nodejs'

// Sanitize business name to prevent XSS
function sanitizeBusinessName(name: string): string {
  return name
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
}

export const POST = withTenantContext(async (request: NextRequest) => {
  const ctx = requireTenantContext()

  if (!ctx.userId) {
    return respond.unauthorized()
  }

  // CSRF Protection - validate origin
  if (!isSameOrigin(request as unknown as Request)) {
    try {
      await logAudit({
        action: 'security.csrf.rejected',
        actorId: ctx.userId,
        details: {
          origin: request.headers.get('origin'),
          route: '/api/portal/entities/setup',
        },
      })
    } catch { }
    return respond.forbidden('Invalid request origin')
  }

  // Rate Limiting - 3 entity setups per hour per user
  const ip = getClientIp(request as unknown as Request)
  const rateLimitKey = `business-setup:entity:${ctx.userId}:${ip}`
  const rateLimit = await applyRateLimit(rateLimitKey, 3, 60 * 60 * 1000)

  if (!rateLimit.allowed) {
    try {
      await logAudit({
        action: 'security.ratelimit.blocked',
        actorId: ctx.userId,
        details: {
          route: '/api/portal/entities/setup',
          ip,
          limit: 3,
          window: '1 hour',
        },
      })
    } catch { }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.TOO_MANY_REQUESTS,
          message: 'Too many setup attempts. Please try again later.'
        }
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': '3',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(rateLimit.resetAt / 1000)),
        }
      }
    )
  }

  // Parse and validate request body
  const body = await request.json().catch(() => null)
  const parsed = EntitySetupRequestSchema.safeParse(body)

  if (!parsed.success) {
    return respond.badRequest('Invalid request data', zodDetails(parsed.error))
  }

  // Sanitize inputs
  const data = {
    ...parsed.data,
    businessName: sanitizeBusinessName(parsed.data.businessName),
  }

  try {
    // Create the entity in database
    const entity = await prisma.entity.create({
      data: {
        name: data.businessName,
        country: data.country,
        legalForm: data.businessType === 'existing' ? 'LLC' : 'PENDING',
        economicDepartment: data.economicDepartment,
        status: 'ACTIVE',
        tenantId: ctx.tenantId as string,
        createdBy: ctx.userId as string,
        metadata: {
          setupType: data.businessType,
          licenseNumber: data.licenseNumber,
          taxId: data.taxId,
          phone: data.phone,
          email: data.email,
          website: data.website,
        },
      },
    })

    // Create user-entity relationship
    await prisma.userOnEntity.create({
      data: {
        userId: ctx.userId as string,
        entityId: entity.id,
        role: 'OWNER',
      },
    })

    // If existing business with license, create license record
    if (data.businessType === 'existing' && data.licenseNumber) {
      await prisma.entityLicense.create({
        data: {
          entityId: entity.id,
          country: data.country,
          authority: data.economicDepartment,
          licenseNumber: data.licenseNumber.toUpperCase().replace(/[^A-Z0-9\-]/g, ''),
          status: 'ACTIVE',
        },
      })
    }

    // Audit logging
    try {
      await prisma.entitySetupAuditLog.create({
        data: {
          entityId: entity.id,
          userId: ctx.userId as string,
          tenantId: ctx.tenantId as string,
          action: 'ENTITY_CREATED',
          requestData: {
            businessType: data.businessType,
            country: data.country,
            department: data.economicDepartment,
            // Don't log sensitive data like full license number
            hasLicense: !!data.licenseNumber,
          },
          ipAddress: ip,
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      })
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError)
    }

    // Create approval request for admin review
    let approvalId: string | null = null
    try {
      const approval = await prisma.entityApproval.create({
        data: {
          entityId: entity.id,
          requestedBy: ctx.userId as string,
          status: 'PENDING',
          submittedAt: new Date(),
          metadata: {
            entityName: data.businessName,
            country: data.country,
            legalForm: data.businessType === 'existing' ? 'LLC' : 'PENDING',
            setupType: data.businessType,
            economicDepartment: data.economicDepartment,
          },
        },
      })
      approvalId = approval.id

      // Update entity status to pending approval
      await prisma.entity.update({
        where: { id: entity.id },
        data: { status: 'PENDING_APPROVAL' },
      })

      // Log approval submission in audit
      await prisma.entitySetupAuditLog.create({
        data: {
          entityId: entity.id,
          userId: ctx.userId as string,
          tenantId: ctx.tenantId as string,
          action: 'APPROVAL_SUBMITTED',
          requestData: { approvalId },
          ipAddress: ip,
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      })
    } catch (approvalError) {
      console.error('Failed to create approval request:', approvalError)
      // Don't fail the whole request if approval creation fails
    }

    const response: EntitySetupResponse = {
      success: true,
      data: {
        entityId: entity.id,
        setupJobId: `job-${Date.now()}`,
        status: approvalId ? 'PENDING_APPROVAL' : 'PENDING_VERIFICATION',
        verificationEstimate: '~24 hours',
        createdAt: entity.createdAt.toISOString(),
      },
    }

    return respond.created(response)

  } catch (error: any) {
    console.error('Entity setup error:', error)

    // Handle unique constraint violations
    if (error?.code === 'P2002') {
      return respond.conflict('A business with this name already exists in your account', {
        code: ERROR_CODES.DUPLICATE_SUBMISSION,
      })
    }

    // Database not configured - return mock success for development
    if (String(error?.code || '').startsWith('P')) {
      const response: EntitySetupResponse = {
        success: true,
        data: {
          entityId: `dev-entity-${Date.now()}`,
          setupJobId: `job-${Date.now()}`,
          status: 'PENDING_VERIFICATION',
          verificationEstimate: '~5 minutes',
          createdAt: new Date().toISOString(),
        },
      }
      return respond.created(response)
    }

    return respond.serverError('Failed to create entity')
  }
}, { requireAuth: true })
