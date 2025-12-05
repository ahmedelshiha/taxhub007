/**
 * License Lookup API
 * GET /api/portal/license/lookup
 * Verifies and retrieves business information by license number
 * 
 * Security:
 * - Rate limiting: 10 requests per minute per user
 * - Input sanitization for license number
 * - Audit logging for lookup attempts
 */

import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { respond, zodDetails } from '@/lib/api-response'
import prisma from '@/lib/prisma'
import { applyRateLimit, getClientIp } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import {
  LicenseLookupRequestSchema,
  ERROR_CODES,
  type LicenseLookupResponse
} from '@/lib/api/contracts/business-setup'

export const runtime = 'nodejs'

// Mock database of UAE licenses for demo purposes
const MOCK_LICENSES: Record<string, {
  businessName: string
  licenseNumber: string
  expiryDate: string
  activities: string[]
  legalForm: string
  economicDepartment: string
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED'
}> = {
  'DMCC-123456': {
    businessName: 'Example Trading LLC',
    licenseNumber: 'DMCC-123456',
    expiryDate: '2025-12-31',
    activities: ['General Trading', 'Import/Export'],
    legalForm: 'LLC',
    economicDepartment: 'dmcc',
    status: 'ACTIVE',
  },
  'DED-789012': {
    businessName: 'Dubai Services FZE',
    licenseNumber: 'DED-789012',
    expiryDate: '2025-06-30',
    activities: ['Business Consulting', 'Management Services'],
    legalForm: 'FZE',
    economicDepartment: 'ded-dubai',
    status: 'ACTIVE',
  },
  'JAFZA-345678': {
    businessName: 'Jebel Ali Logistics Co.',
    licenseNumber: 'JAFZA-345678',
    expiryDate: '2024-03-15',
    activities: ['Logistics', 'Warehousing', 'Distribution'],
    legalForm: 'LLC',
    economicDepartment: 'jafza',
    status: 'EXPIRED',
  },
}

// Sanitize license number input
function sanitizeLicense(license: string): string {
  return license
    .replace(/[^a-zA-Z0-9\-]/g, '')
    .toUpperCase()
    .trim()
}

export const GET = withTenantContext(async (request: NextRequest) => {
  const ctx = requireTenantContext()

  if (!ctx.userId) {
    return respond.unauthorized()
  }

  // Rate Limiting - 10 lookups per minute per user
  const ip = getClientIp(request as unknown as Request)
  const rateLimitKey = `business-setup:license-lookup:${ctx.userId}:${ip}`
  const rateLimit = await applyRateLimit(rateLimitKey, 10, 60 * 1000)

  if (!rateLimit.allowed) {
    try {
      await logAudit({
        action: 'security.ratelimit.blocked',
        actorId: ctx.userId,
        details: {
          route: '/api/portal/license/lookup',
          ip,
          limit: 10,
          window: '1 minute',
        },
      })
    } catch { }

    return NextResponse.json(
      {
        found: false,
        error: {
          code: ERROR_CODES.TOO_MANY_REQUESTS,
          message: 'Too many lookup attempts. Please wait a moment and try again.'
        }
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(rateLimit.resetAt / 1000)),
        }
      }
    )
  }

  const { searchParams } = new URL(request.url)
  const licenseNumber = searchParams.get('licenseNumber')
  const country = searchParams.get('country')

  // Validate query params
  const parsed = LicenseLookupRequestSchema.safeParse({
    licenseNumber,
    country,
  })

  if (!parsed.success) {
    return respond.badRequest('Invalid request parameters', zodDetails(parsed.error))
  }

  // Sanitize license number
  const sanitizedLicense = sanitizeLicense(parsed.data.licenseNumber)

  try {
    // Audit log the lookup attempt (without exposing full license)
    try {
      await logAudit({
        action: 'business.license.lookup',
        actorId: ctx.userId,
        details: {
          country: parsed.data.country,
          licensePrefix: sanitizedLicense.substring(0, 4) + '***',
        },
      })
    } catch { }

    // First check if we already have this license in our database
    const existingLicense = await prisma.entityLicense.findFirst({
      where: {
        licenseNumber: sanitizedLicense,
        country: parsed.data.country,
      },
      include: {
        entity: {
          select: {
            name: true,
            legalForm: true,
            economicDepartment: true,
            status: true,
          },
        },
      },
    })

    if (existingLicense) {
      const response: LicenseLookupResponse = {
        found: true,
        data: {
          businessName: existingLicense.entity.name,
          licenseNumber: existingLicense.licenseNumber,
          expiryDate: existingLicense.expiresAt?.toISOString().split('T')[0] ||
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          activities: ['General Trading'],
          legalForm: existingLicense.legalForm || existingLicense.entity.legalForm || undefined,
          economicDepartment: existingLicense.entity.economicDepartment || existingLicense.authority,
          status: existingLicense.status === 'ACTIVE' ? 'ACTIVE' :
            existingLicense.status === 'EXPIRED' ? 'EXPIRED' : 'SUSPENDED',
        },
      }
      return respond.ok(response)
    }

    // Check mock database (in production, this would call external government APIs)
    const mockData = MOCK_LICENSES[sanitizedLicense]

    if (mockData) {
      const response: LicenseLookupResponse = {
        found: true,
        data: mockData,
      }
      return respond.ok(response)
    }

    // License not found
    const response: LicenseLookupResponse = {
      found: false,
      error: {
        code: ERROR_CODES.LICENSE_NOT_FOUND,
        message: 'No business found with this license number. Please verify the license number and try again.',
      },
    }
    return respond.ok(response)

  } catch (error: any) {
    console.error('License lookup error:', error)

    // Database not configured - return mock data for development
    if (String(error?.code || '').startsWith('P')) {
      const mockData = MOCK_LICENSES[sanitizedLicense]

      if (mockData) {
        return respond.ok({
          found: true,
          data: mockData,
        })
      }

      return respond.ok({
        found: false,
        error: {
          code: ERROR_CODES.LICENSE_NOT_FOUND,
          message: 'License not found',
        },
      })
    }

    return respond.serverError('Failed to lookup license')
  }
}, { requireAuth: true })
