/**
 * Request Changes Modal
 * 
 * Modal for requesting modifications to entity application.
 */

'use client'

import { useState, useCallback } from 'react'
import { FileEdit, Loader2 } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export interface RequestChangesModalProps {
    isOpen: boolean
    onClose: () => void
    entityId: string
    entityName: string
    onSuccess?: () => void
}

const COMMON_ISSUES = [
    { id: 'license', label: 'Trade license document required' },
    { id: 'registration', label: 'Registration number incorrect' },
    { id: 'address', label: 'Business address incomplete' },
    { id: 'contact', label: 'Contact information missing' },
    { id: 'ownership', label: 'Ownership documents needed' },
]

export function RequestChangesModal({
    isOpen,
    onClose,
    entityId,
    entityName,
    onSuccess,
}: RequestChangesModalProps) {
    const [selectedIssues, setSelectedIssues] = useState<string[]>([])
    const [additionalNotes, setAdditionalNotes] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const isValid = selectedIssues.length > 0 || additionalNotes.trim().length >= 10

    const handleToggleIssue = useCallback((issueId: string) => {
        setSelectedIssues(prev =>
            prev.includes(issueId)
                ? prev.filter(id => id !== issueId)
                : [...prev, issueId]
        )
    }, [])

    const handleSubmit = useCallback(async () => {
        if (!isValid) return

        setIsLoading(true)
        try {
            const issues = COMMON_ISSUES.filter(i => selectedIssues.includes(i.id))
                .map(i => i.label)

            const response = await fetch(`/api/admin/entities/${entityId}/request-changes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    issues,
                    additionalNotes: additionalNotes.trim() || undefined
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to request changes')
            }

            toast.success('Change request sent to client')
            onSuccess?.()
            handleClose()
        } catch (error) {
            console.error('Error requesting changes:', error)
            toast.error('Failed to send change request. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }, [entityId, selectedIssues, additionalNotes, isValid, onSuccess])

    const handleClose = useCallback(() => {
        setSelectedIssues([])
        setAdditionalNotes('')
        onClose()
    }, [onClose])

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                            <FileEdit className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle>Request Changes</DialogTitle>
                            <DialogDescription>
                                Request modifications from <span className="font-medium">{entityName}</span>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Common Issues Checklist */}
                    <div className="space-y-3">
                        <Label>Select Issues</Label>
                        {COMMON_ISSUES.map(issue => (
                            <div key={issue.id} className="flex items-center space-x-3">
                                <Checkbox
                                    id={issue.id}
                                    checked={selectedIssues.includes(issue.id)}
                                    onCheckedChange={() => handleToggleIssue(issue.id)}
                                />
                                <label
                                    htmlFor={issue.id}
                                    className="text-sm cursor-pointer"
                                >
                                    {issue.label}
                                </label>
                            </div>
                        ))}
                    </div>

                    {/* Additional Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Additional Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Specify any additional changes required..."
                            value={additionalNotes}
                            onChange={(e) => setAdditionalNotes(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
                    </div>

                    {/* Info */}
                    <p className="text-sm text-muted-foreground bg-orange-50 dark:bg-orange-900/20 p-3 rounded-md">
                        Client will be notified and their application status will change to &quot;Requires Changes&quot;.
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!isValid || isLoading}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Send Request
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
