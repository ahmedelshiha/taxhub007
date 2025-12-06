/**
 * Business Approvals Client Page
 * 
 * Refactored to use new modal components.
 */

"use client";

import { useState } from "react";
import useSWR from "swr";
import { CheckCircle, XCircle, Clock, AlertCircle, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { fetcher } from "@/lib/api-client";
import { formatDate } from "@/lib/date-utils";
import { ApprovalDetailModal } from "./ApprovalDetailModal";
import {
    ApproveEntityModal,
    RejectEntityModal,
    RequestChangesModal
} from "@/components/admin/entities/modals";
import { EntityStatusBadge } from "@/components/admin/entities/EntityStatusBadge";

interface EntityApproval {
    id: string;
    entity: {
        id: string;
        name: string;
        country: string;
        legalForm: string;
        createdAt: string;
    };
    requester: {
        name: string;
        email: string;
    };
    status: string;
    submittedAt: string;
    reviewedAt?: string;
    rejectionReason?: string;
}

type ModalState = {
    type: 'approve' | 'reject' | 'request-changes' | 'detail' | null;
    approval: EntityApproval | null;
};

export default function BusinessApprovalsClientPage() {
    const [statusFilter, setStatusFilter] = useState("PENDING");
    const [modalState, setModalState] = useState<ModalState>({ type: null, approval: null });

    const { data, error, isLoading, mutate } = useSWR(
        `/api/admin/entities/pending?status=${statusFilter}`,
        fetcher
    );

    const approvals = data?.data?.approvals || [];

    const openModal = (type: ModalState['type'], approval: EntityApproval) => {
        setModalState({ type, approval });
    };

    const closeModal = () => {
        setModalState({ type: null, approval: null });
    };

    const handleSuccess = () => {
        mutate();
        closeModal();
    };

    if (error) {
        return (
            <div className="container mx-auto px-4 py-12">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center text-red-600">
                            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                            <p className="text-lg font-medium">Error loading approvals</p>
                            <p className="text-sm text-muted-foreground">{error.message}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6 max-w-7xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Business Approvals</h1>
                    <p className="text-muted-foreground">
                        Review and manage pending business submissions
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-lg">Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <div className="w-64">
                            <label className="text-sm font-medium mb-2 block">Status</label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All</SelectItem>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="APPROVED">Approved</SelectItem>
                                    <SelectItem value="REJECTED">Rejected</SelectItem>
                                    <SelectItem value="REQUIRES_CHANGES">Requires Changes</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Approvals List */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>
                            {isLoading ? "Loading..." : `${approvals.length} Approvals`}
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-12">
                            <Clock className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
                            <p className="mt-4 text-muted-foreground">Loading approvals...</p>
                        </div>
                    ) : approvals.length === 0 ? (
                        <div className="text-center py-12">
                            <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                            <p className="mt-4 text-muted-foreground">
                                No approvals found for the selected filter
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {approvals.map((approval: EntityApproval) => (
                                <div
                                    key={approval.id}
                                    className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-lg">
                                                    {approval.entity.name}
                                                </h3>
                                                <EntityStatusBadge status={approval.status} />
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground block">Client</span>
                                                    <span className="font-medium">{approval.requester.name}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block">Country</span>
                                                    <span className="font-medium">{approval.entity.country}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block">Legal Form</span>
                                                    <span className="font-medium">{approval.entity.legalForm || "N/A"}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block">Submitted</span>
                                                    <span className="font-medium">{formatDate(approval.submittedAt)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openModal('detail', approval)}
                                            >
                                                View Details
                                            </Button>
                                            {approval.status === "PENDING" && (
                                                <>
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => openModal('approve', approval)}
                                                        className="gap-1"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openModal('request-changes', approval)}
                                                        className="gap-1"
                                                    >
                                                        <FileEdit className="h-4 w-4" />
                                                        Request Changes
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => openModal('reject', approval)}
                                                        className="gap-1"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modals */}
            {modalState.approval && (
                <>
                    <ApprovalDetailModal
                        approval={modalState.approval}
                        isOpen={modalState.type === 'detail'}
                        onClose={closeModal}
                        onApprove={(entityId) => {
                            closeModal();
                            const approval = approvals.find((a: EntityApproval) => a.entity.id === entityId);
                            if (approval) openModal('approve', approval);
                        }}
                        onReject={(entityId) => {
                            closeModal();
                            const approval = approvals.find((a: EntityApproval) => a.entity.id === entityId);
                            if (approval) openModal('reject', approval);
                        }}
                    />

                    <ApproveEntityModal
                        isOpen={modalState.type === 'approve'}
                        onClose={closeModal}
                        entityId={modalState.approval.entity.id}
                        entityName={modalState.approval.entity.name}
                        onSuccess={handleSuccess}
                    />

                    <RejectEntityModal
                        isOpen={modalState.type === 'reject'}
                        onClose={closeModal}
                        entityId={modalState.approval.entity.id}
                        entityName={modalState.approval.entity.name}
                        onSuccess={handleSuccess}
                    />

                    <RequestChangesModal
                        isOpen={modalState.type === 'request-changes'}
                        onClose={closeModal}
                        entityId={modalState.approval.entity.id}
                        entityName={modalState.approval.entity.name}
                        onSuccess={handleSuccess}
                    />
                </>
            )}
        </div>
    );
}
