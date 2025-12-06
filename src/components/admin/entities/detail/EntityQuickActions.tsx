/**
 * Entity Quick Actions
 * 
 * Action buttons for entity detail page.
 */

'use client'

import { useState } from 'react'
import {
    CheckCircle,
    XCircle,
    FileEdit,
    UserPlus,
    Archive,
    MoreVertical,
    Pencil
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    ApproveEntityModal,
    RejectEntityModal,
    RequestChangesModal,
    AssignUserModal,
    ArchiveEntityModal
} from '../modals'

interface EntityQuickActionsProps {
    entity: {
        id: string
        name: string
        status: string
    }
    onUpdate?: () => void
    onEdit?: () => void
}

type ModalType = 'approve' | 'reject' | 'request-changes' | 'assign' | 'archive' | null

export function EntityQuickActions({ entity, onUpdate, onEdit }: EntityQuickActionsProps) {
    const [activeModal, setActiveModal] = useState<ModalType>(null)

    const isPending = entity.status === 'PENDING' || entity.status === 'PENDING_APPROVAL'
    const isArchived = entity.status === 'ARCHIVED'

    const closeModal = () => setActiveModal(null)

    return (
        <>
            <div className="flex items-center gap-2">
                {/* Primary Actions for Pending */}
                {isPending && (
                    <>
                        <Button
                            size="sm"
                            onClick={() => setActiveModal('approve')}
                            className="gap-1"
                        >
                            <CheckCircle className="h-4 w-4" />
                            Approve
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setActiveModal('reject')}
                            className="gap-1"
                        >
                            <XCircle className="h-4 w-4" />
                            Reject
                        </Button>
                    </>
                )}

                {/* Edit Button */}
                {onEdit && !isArchived && (
                    <Button size="sm" variant="outline" onClick={onEdit} className="gap-1">
                        <Pencil className="h-4 w-4" />
                        Edit
                    </Button>
                )}

                {/* More Actions Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {isPending && (
                            <DropdownMenuItem onClick={() => setActiveModal('request-changes')}>
                                <FileEdit className="h-4 w-4 mr-2" />
                                Request Changes
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setActiveModal('assign')}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Assign User
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {!isArchived && (
                            <DropdownMenuItem
                                onClick={() => setActiveModal('archive')}
                                className="text-red-600"
                            >
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Modals */}
            <ApproveEntityModal
                isOpen={activeModal === 'approve'}
                onClose={closeModal}
                entityId={entity.id}
                entityName={entity.name}
                onSuccess={onUpdate}
            />
            <RejectEntityModal
                isOpen={activeModal === 'reject'}
                onClose={closeModal}
                entityId={entity.id}
                entityName={entity.name}
                onSuccess={onUpdate}
            />
            <RequestChangesModal
                isOpen={activeModal === 'request-changes'}
                onClose={closeModal}
                entityId={entity.id}
                entityName={entity.name}
                onSuccess={onUpdate}
            />
            <AssignUserModal
                isOpen={activeModal === 'assign'}
                onClose={closeModal}
                entityId={entity.id}
                entityName={entity.name}
                onSuccess={onUpdate}
            />
            <ArchiveEntityModal
                isOpen={activeModal === 'archive'}
                onClose={closeModal}
                entityId={entity.id}
                entityName={entity.name}
                onSuccess={onUpdate}
            />
        </>
    )
}
