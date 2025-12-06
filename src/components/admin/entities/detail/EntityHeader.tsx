/**
 * Entity Header
 * 
 * Header section for entity detail page with key info cards.
 */

'use client'

import Link from 'next/link'
import { ArrowLeft, Building2, Calendar, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EntityStatusBadge } from '../EntityStatusBadge'

interface EntityHeaderProps {
    entity: {
        id: string
        name: string
        country: string
        legalForm?: string | null
        status: string
        createdAt: string | Date
        updatedAt: string | Date
    }
}

const countryInfo: Record<string, { name: string; flag: string }> = {
    AE: { name: 'United Arab Emirates', flag: '🇦🇪' },
    SA: { name: 'Saudi Arabia', flag: '🇸🇦' },
    EG: { name: 'Egypt', flag: '🇪🇬' },
    US: { name: 'United States', flag: '🇺🇸' },
    GB: { name: 'United Kingdom', flag: '🇬🇧' },
}

export function EntityHeader({ entity }: EntityHeaderProps) {
    const country = countryInfo[entity.country] || { name: entity.country, flag: '🌍' }

    return (
        <div className="space-y-6">
            {/* Back Link */}
            <Link href="/admin/entities">
                <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Entities
                </Button>
            </Link>

            {/* Title Row */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">{entity.name}</h1>
                            <EntityStatusBadge status={entity.status} size="lg" />
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                            <span className="text-xl">{country.flag}</span>
                            <span>{country.name}</span>
                            {entity.legalForm && (
                                <>
                                    <span>•</span>
                                    <span>{entity.legalForm}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground mb-1">Status</div>
                        <EntityStatusBadge status={entity.status} />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground mb-1">Legal Form</div>
                        <div className="font-medium">{entity.legalForm || '—'}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground mb-1">Created</div>
                        <div className="font-medium text-sm">
                            {new Date(entity.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                            })}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground mb-1">Updated</div>
                        <div className="font-medium text-sm">
                            {new Date(entity.updatedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
