/**
 * Assign User Modal
 * 
 * Modal for assigning an entity to a user with role selection.
 */

'use client'

import { useState, useCallback } from 'react'
import { UserPlus, Loader2, Search } from 'lucide-react'
import useSWR from 'swr'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { fetcher } from '@/lib/api-client'

export interface AssignUserModalProps {
    isOpen: boolean
    onClose: () => void
    entityId: string
    entityName: string
    onSuccess?: () => void
}

type EntityRole = 'OWNER' | 'EDITOR' | 'VIEWER'

const ROLES: { value: EntityRole; label: string; description: string }[] = [
    { value: 'OWNER', label: 'Owner', description: 'Full control including transfer' },
    { value: 'EDITOR', label: 'Editor', description: 'Can edit entity details' },
    { value: 'VIEWER', label: 'Viewer', description: 'Read-only access' },
]

export function AssignUserModal({
    isOpen,
    onClose,
    entityId,
    entityName,
    onSuccess,
}: AssignUserModalProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedUserId, setSelectedUserId] = useState('')
    const [role, setRole] = useState<EntityRole>('VIEWER')
    const [notifyUser, setNotifyUser] = useState(true)
    const [isLoading, setIsLoading] = useState(false)

    // Search users
    const { data: usersData } = useSWR(
        searchQuery.length >= 2 ? `/api/admin/users?search=${encodeURIComponent(searchQuery)}&limit=10` : null,
        fetcher
    )
    const users = usersData?.data || []

    const isValid = selectedUserId && role

    const handleSubmit = useCallback(async () => {
        if (!isValid) return

        setIsLoading(true)
        try {
            const response = await fetch(`/api/admin/entities/${entityId}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedUserId,
                    role,
                    notify: notifyUser
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to assign user')
            }

            toast.success('User assigned successfully')
            onSuccess?.()
            handleClose()
        } catch (error) {
            console.error('Error assigning user:', error)
            toast.error('Failed to assign user. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }, [entityId, selectedUserId, role, notifyUser, isValid, onSuccess])

    const handleClose = useCallback(() => {
        setSearchQuery('')
        setSelectedUserId('')
        setRole('VIEWER')
        setNotifyUser(true)
        onClose()
    }, [onClose])

    const selectedUser = users.find((u: any) => u.id === selectedUserId)

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <UserPlus className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle>Assign User</DialogTitle>
                            <DialogDescription>
                                Add user access to <span className="font-medium">{entityName}</span>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* User Search */}
                    <div className="space-y-2">
                        <Label>Search User</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        {users.length > 0 && !selectedUserId && (
                            <div className="border rounded-md max-h-40 overflow-y-auto">
                                {users.map((user: any) => (
                                    <button
                                        key={user.id}
                                        onClick={() => setSelectedUserId(user.id)}
                                        className="w-full p-2 text-left hover:bg-muted text-sm flex items-center gap-2"
                                    >
                                        <span className="font-medium">{user.name}</span>
                                        <span className="text-muted-foreground">{user.email}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {selectedUser && (
                            <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                                <span className="text-sm font-medium">{selectedUser.name} ({selectedUser.email})</span>
                                <Button size="sm" variant="ghost" onClick={() => setSelectedUserId('')}>
                                    Change
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={role} onValueChange={(v) => setRole(v as EntityRole)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ROLES.map(r => (
                                    <SelectItem key={r.value} value={r.value}>
                                        <div>
                                            <div className="font-medium">{r.label}</div>
                                            <div className="text-xs text-muted-foreground">{r.description}</div>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Notify */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="notify"
                            checked={notifyUser}
                            onCheckedChange={(checked) => setNotifyUser(!!checked)}
                        />
                        <label htmlFor="notify" className="text-sm">
                            Notify user via email
                        </label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!isValid || isLoading}>
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Assign User
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
