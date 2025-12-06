/**
 * Users Access Tab
 * 
 * Manage users with access to this entity.
 */

'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { UserPlus, Trash2, Shield, User, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { fetcher } from '@/lib/api-client'
import { toast } from 'sonner'
import { AssignUserModal } from '../modals'

interface UsersAccessTabProps {
    entityId: string
}

const roleIcons = {
    OWNER: Shield,
    EDITOR: User,
    VIEWER: Eye,
}

const roleColors = {
    OWNER: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    EDITOR: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    VIEWER: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
}

export default function UsersAccessTab({ entityId }: UsersAccessTabProps) {
    const [showAssignModal, setShowAssignModal] = useState(false)
    const { data, isLoading, mutate } = useSWR(`/api/admin/entities/${entityId}/users`, fetcher)
    const users = data?.data || []

    const handleRemoveUser = async (userId: string, userName: string) => {
        if (!confirm(`Remove ${userName} from this entity?`)) return

        try {
            const response = await fetch(`/api/admin/entities/${entityId}/users/${userId}`, {
                method: 'DELETE',
            })
            if (!response.ok) throw new Error('Failed to remove user')
            toast.success('User removed successfully')
            mutate()
        } catch (error) {
            toast.error('Failed to remove user')
        }
    }

    if (isLoading) {
        return <UsersSkeleton />
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Users with Access</CardTitle>
                    <Button size="sm" onClick={() => setShowAssignModal(true)} className="gap-1">
                        <UserPlus className="h-4 w-4" />
                        Add User
                    </Button>
                </CardHeader>
                <CardContent>
                    {users.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            No users assigned to this entity
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {users.map((userAccess: any) => {
                                const Icon = roleIcons[userAccess.role as keyof typeof roleIcons] || User
                                return (
                                    <div
                                        key={userAccess.id}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                                {userAccess.user.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <div className="font-medium">{userAccess.user.name}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {userAccess.user.email}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className={roleColors[userAccess.role as keyof typeof roleColors] || roleColors.VIEWER}>
                                                <Icon className="h-3 w-3 mr-1" />
                                                {userAccess.role}
                                            </Badge>
                                            {userAccess.role !== 'OWNER' && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => handleRemoveUser(userAccess.user.id, userAccess.user.name)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            <AssignUserModal
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                entityId={entityId}
                entityName=""
                onSuccess={() => mutate()}
            />
        </>
    )
}

function UsersSkeleton() {
    return (
        <Card>
            <CardContent className="pt-6 space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1">
                            <Skeleton className="h-4 w-1/3 mb-1" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
