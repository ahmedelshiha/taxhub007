/**
 * Approve Entity Modal
 * 
 * Confirmation modal for approving entity applications.
 */

'use client'

import { useState, useCallback } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export interface ApproveEntityModalProps {
    isOpen: boolean
    onClose: () => void
    entityId: string
    entityName: string
    onSuccess?: () => void
}

export function ApproveEntityModal({
    isOpen,
    onClose,
    entityId,
    entityName,
    onSuccess,
}: ApproveEntityModalProps) {
    const [notes, setNotes] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/admin/entities/${entityId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes: notes.trim() || undefined }),
            })

            if (!response.ok) {
                throw new Error('Failed to approve entity')
            }

            toast.success('Entity approved successfully')
            onSuccess?.()
            handleClose()
        } catch (error) {
            console.error('Error approving entity:', error)
            toast.error('Failed to approve entity. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }, [entityId, notes, onSuccess])

    const handleClose = useCallback(() => {
        setNotes('')
        onClose()
    }, [onClose])

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle>Approve Business</DialogTitle>
                            <DialogDescription>
                                Approving <span className="font-medium">{entityName}</span>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Admin Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Admin Notes (optional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Add any internal notes about this approval..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
                    </div>

                    {/* Info */}
                    <p className="text-sm text-muted-foreground bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                        The client will be notified that their business has been approved.
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Approve Business
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
