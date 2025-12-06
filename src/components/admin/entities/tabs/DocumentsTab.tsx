/**
 * Documents Tab
 * 
 * Document management for entity with upload functionality.
 */

'use client'

import { useState, useRef, useCallback } from 'react'
import useSWR from 'swr'
import { FileText, Download, Eye, Upload, Folder, X, Loader2, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fetcher } from '@/lib/api-client'
import { formatDate } from '@/lib/date-utils'
import { toast } from 'sonner'

interface DocumentsTabProps {
    entityId: string
}

const CATEGORIES = [
    { value: 'LICENSE', label: 'License' },
    { value: 'REGISTRATION', label: 'Registration' },
    { value: 'CONTRACT', label: 'Contract' },
    { value: 'CERTIFICATE', label: 'Certificate' },
    { value: 'OTHER', label: 'Other' },
]

const categoryColors: Record<string, string> = {
    LICENSE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    REGISTRATION: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    CONTRACT: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    CERTIFICATE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    OTHER: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export default function DocumentsTab({ entityId }: DocumentsTabProps) {
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [category, setCategory] = useState('OTHER')
    const [documentName, setDocumentName] = useState('')
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const { data, isLoading, mutate } = useSWR(
        `/api/admin/entities/${entityId}/documents`,
        fetcher
    )
    const documents = data?.data || []

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > MAX_FILE_SIZE) {
            toast.error('File too large. Maximum size is 10MB.')
            return
        }

        setSelectedFile(file)
        setDocumentName(file.name.replace(/\.[^/.]+$/, '')) // Remove extension
    }, [])

    const handleUpload = useCallback(async () => {
        if (!selectedFile) return

        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', selectedFile)
            formData.append('name', documentName || selectedFile.name)
            formData.append('category', category)

            const response = await fetch(`/api/admin/entities/${entityId}/documents`, {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                throw new Error('Failed to upload document')
            }

            toast.success('Document uploaded successfully')
            mutate()
            closeUploadModal()
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Failed to upload document. Please try again.')
        } finally {
            setIsUploading(false)
        }
    }, [selectedFile, documentName, category, entityId, mutate])

    const closeUploadModal = () => {
        setShowUploadModal(false)
        setSelectedFile(null)
        setDocumentName('')
        setCategory('OTHER')
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleDelete = async (docId: string, docName: string) => {
        if (!confirm(`Delete "${docName}"?`)) return

        try {
            const response = await fetch(
                `/api/admin/entities/${entityId}/documents/${docId}`,
                { method: 'DELETE' }
            )
            if (!response.ok) throw new Error('Delete failed')
            toast.success('Document deleted')
            mutate()
        } catch {
            toast.error('Failed to delete document')
        }
    }

    const handleDownload = (docId: string) => {
        window.open(`/api/admin/entities/${entityId}/documents/${docId}/download`, '_blank')
    }

    if (isLoading) {
        return <DocumentsSkeleton />
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Documents</CardTitle>
                    <Button size="sm" className="gap-1" onClick={() => setShowUploadModal(true)}>
                        <Upload className="h-4 w-4" />
                        Upload
                    </Button>
                </CardHeader>
                <CardContent>
                    {documents.length === 0 ? (
                        <div className="text-center py-12">
                            <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No documents uploaded</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-4 gap-1"
                                onClick={() => setShowUploadModal(true)}
                            >
                                <Upload className="h-4 w-4" />
                                Upload First Document
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {documents.map((doc: any) => (
                                <div
                                    key={doc.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-muted">
                                            <FileText className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <div className="font-medium">{doc.name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {formatDate(doc.createdAt)} • {formatFileSize(doc.size)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className={categoryColors[doc.category] || categoryColors.OTHER}>
                                            {doc.category}
                                        </Badge>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => window.open(doc.url, '_blank')}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleDownload(doc.id)}
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDelete(doc.id, doc.name)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Upload Modal */}
            <Dialog open={showUploadModal} onOpenChange={closeUploadModal}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Upload Document</DialogTitle>
                        <DialogDescription>
                            Upload a document for this entity. Maximum file size: 10MB.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* File Drop Zone */}
                        <div
                            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition hover:border-primary ${selectedFile ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-muted-foreground/30'
                                }`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                onChange={handleFileSelect}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                            />
                            {selectedFile ? (
                                <div className="flex items-center justify-center gap-3">
                                    <FileText className="h-8 w-8 text-green-600" />
                                    <div className="text-left">
                                        <p className="font-medium">{selectedFile.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatFileSize(selectedFile.size)}
                                        </p>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setSelectedFile(null)
                                            if (fileInputRef.current) fileInputRef.current.value = ''
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                                    <p className="font-medium">Click to select file</p>
                                    <p className="text-sm text-muted-foreground">
                                        PDF, Word, Excel, or images
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Document Name */}
                        <div className="space-y-2">
                            <Label htmlFor="docName">Document Name</Label>
                            <Input
                                id="docName"
                                value={documentName}
                                onChange={(e) => setDocumentName(e.target.value)}
                                placeholder="Enter document name"
                            />
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map(cat => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={closeUploadModal} disabled={isUploading}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={!selectedFile || isUploading}
                        >
                            {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Upload Document
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function DocumentsSkeleton() {
    return (
        <Card>
            <CardContent className="pt-6 space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1">
                            <Skeleton className="h-4 w-1/3 mb-1" />
                            <Skeleton className="h-3 w-1/4" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
