/**
 * Archive Entity Modal
 * 
 * Confirmation modal for archiving an entity.
 */

'use client'

import { useState, useCallback } from 'react'
import { Archive, Loader2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export interface ArchiveEntityModalProps {
    isOpen: boolean
    onClose: () => void
    entityId: string
    entityName: string
    onSuccess?: () => void
}

export function ArchiveEntityModal({
    isOpen,
    onClose,
    entityId,
    entityName,
    onSuccess,
}: ArchiveEntityModalProps) {
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/entities/${entityId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'ARCHIVED' }),
            })

            if (!response.ok) {
                throw new Error('Failed to archive entity')
            }

            toast.success('Entity archived successfully', {
                action: {
                    label: 'Undo',
                    onClick: () => handleUndo(),
                },
                duration: 5000,
            })
            onSuccess?.()
            onClose()
        } catch (error) {
            console.error('Error archiving entity:', error)
            toast.error('Failed to archive entity. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }, [entityId, onSuccess, onClose])

    const handleUndo = useCallback(async () => {
        try {
            await fetch(`/api/entities/${entityId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'ACTIVE' }),
            })
            toast.success('Archive undone')
            onSuccess?.()
        } catch (error) {
            toast.error('Failed to undo archive')
        }
    }, [entityId, onSuccess])

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            <Archive className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle>Archive Business</DialogTitle>
                            <DialogDescription>
                                Archiving <span className="font-medium">{entityName}</span>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                        This will hide the entity from the main list. The data will be preserved
                        and can be restored by an administrator.
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Archive
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
