/**
 * Reject Entity Modal
 * 
 * Professional modal for rejecting entity applications with required reason.
 */

'use client'

import { useState, useCallback } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export interface RejectEntityModalProps {
    isOpen: boolean
    onClose: () => void
    entityId: string
    entityName: string
    onSuccess?: () => void
}

type RejectionCategory = 'INCOMPLETE' | 'INVALID_INFO' | 'DUPLICATE' | 'COMPLIANCE' | 'OTHER'

const REJECTION_CATEGORIES: { value: RejectionCategory; label: string }[] = [
    { value: 'INCOMPLETE', label: 'Incomplete Information' },
    { value: 'INVALID_INFO', label: 'Invalid or Incorrect Information' },
    { value: 'DUPLICATE', label: 'Duplicate Entity' },
    { value: 'COMPLIANCE', label: 'Compliance Issues' },
    { value: 'OTHER', label: 'Other' },
]

const MIN_REASON_LENGTH = 20

export function RejectEntityModal({
    isOpen,
    onClose,
    entityId,
    entityName,
    onSuccess,
}: RejectEntityModalProps) {
    const [category, setCategory] = useState<RejectionCategory | ''>('')
    const [reason, setReason] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const isValid = category && reason.trim().length >= MIN_REASON_LENGTH

    const handleSubmit = useCallback(async () => {
        if (!isValid) return

        setIsLoading(true)
        try {
            const fullReason = `[${category}] ${reason.trim()}`
            const response = await fetch(`/api/admin/entities/${entityId}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: fullReason }),
            })

            if (!response.ok) {
                throw new Error('Failed to reject entity')
            }

            toast.success('Entity rejected successfully')
            onSuccess?.()
            handleClose()
        } catch (error) {
            console.error('Error rejecting entity:', error)
            toast.error('Failed to reject entity. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }, [entityId, category, reason, isValid, onSuccess])

    const handleClose = useCallback(() => {
        setCategory('')
        setReason('')
        onClose()
    }, [onClose])

    // Keyboard shortcut: Enter to submit, Escape handled by Dialog
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.ctrlKey && isValid && !isLoading) {
            handleSubmit()
        }
    }, [isValid, isLoading, handleSubmit])

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="sm:max-w-[500px]"
                onKeyDown={handleKeyDown}
            >
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle>Reject Business Application</DialogTitle>
                            <DialogDescription>
                                Rejecting <span className="font-medium">{entityName}</span>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Category Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="category">Rejection Reason *</Label>
                        <Select
                            value={category}
                            onValueChange={(v) => setCategory(v as RejectionCategory)}
                        >
                            <SelectTrigger id="category">
                                <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                            <SelectContent>
                                {REJECTION_CATEGORIES.map(cat => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Detailed Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="reason">
                            Detailed Explanation *
                            <span className="text-muted-foreground ml-1">
                                (min {MIN_REASON_LENGTH} characters)
                            </span>
                        </Label>
                        <Textarea
                            id="reason"
                            placeholder="Provide a detailed explanation for the rejection..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {reason.length}/{MIN_REASON_LENGTH} characters
                        </p>
                    </div>

                    {/* Info Note */}
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                        The client will be notified via email with this rejection reason.
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={!isValid || isLoading}
                    >
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Reject Application
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
