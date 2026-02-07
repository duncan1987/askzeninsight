"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Download,
  Trash2,
  FileJson,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"

interface ExportTask {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  format: 'json' | 'markdown'
  created_at: string
  expires_at: string
  total_conversations?: number
  total_messages?: number
  error_message?: string
}

interface DataManagementCardProps {
  conversationCount?: number
}

export function DataManagementCard({ conversationCount = 0 }: DataManagementCardProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [exportTasks, setExportTasks] = useState<ExportTask[]>([])
  const [deleteConfirmed, setDeleteConfirmed] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Poll for export status updates
  useEffect(() => {
    const fetchExports = async () => {
      try {
        const response = await fetch("/api/user/export-conversations")
        if (response.ok) {
          const data = await response.json()
          setExportTasks(data)
        }
      } catch (error) {
        console.error("Failed to fetch exports:", error)
      }
    }

    fetchExports()

    // Poll every 2 seconds if there are pending/processing tasks
    const interval = setInterval(() => {
      const hasActiveTasks = exportTasks.some(
        task => task.status === 'pending' || task.status === 'processing'
      )
      if (hasActiveTasks) {
        fetchExports()
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [exportTasks.length])

  const handleExport = async (format: 'json' | 'markdown') => {
    setIsExporting(true)
    try {
      const response = await fetch("/api/user/export-conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("Export task created", {
          description: "Processing in the background. It will be available for download shortly.",
        })
        // Refresh exports list
        const exportsResponse = await fetch("/api/user/export-conversations")
        if (exportsResponse.ok) {
          setExportTasks(await exportsResponse.json())
        }
      } else {
        throw new Error("Failed to create export")
      }
    } catch (error) {
      toast.error("Export failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownload = async (exportId: string) => {
    try {
      const response = await fetch(`/api/user/export-conversations/${exportId}/download`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Download failed")
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition")
      let filename = `zen-insight-conversations-${new Date().toISOString().split("T")[0]}.json`
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/)
        if (match) filename = match[1]
      }

      // Download file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Download successful", { description: "Conversation export file has been downloaded" })
    } catch (error) {
      toast.error("Download failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const handleDeleteAll = async () => {
    if (!deleteConfirmed) {
      setShowDeleteConfirm(true)
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch("/api/user/all-conversations", {
        method: "DELETE",
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("Deletion successful", {
          description: data.message || "All conversations have been deleted",
        })
        setShowDeleteConfirm(false)
        setDeleteConfirmed(false)
        // Refresh the page after 1 second
        setTimeout(() => window.location.reload(), 1000)
      } else {
        throw new Error("Failed to delete conversations")
      }
    } catch (error) {
      toast.error("Deletion failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  const getExportStatusIcon = (task: ExportTask) => {
    switch (task.status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getExportStatusText = (task: ExportTask) => {
    switch (task.status) {
      case 'pending':
        return 'Pending'
      case 'processing':
        return 'Processing...'
      case 'completed':
        return isExpired(task.expires_at) ? 'Expired' : 'Completed'
      case 'failed':
        return 'Failed'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Data Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Section */}
        <div>
          <h3 className="font-semibold mb-2">Export Conversations</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Download all conversation records for backup or personal archiving. Supports JSON and Markdown formats.
          </p>

          {conversationCount > 0 && (
            <p className="text-xs text-muted-foreground mb-3">
              {conversationCount} conversation{conversationCount > 1 ? 's' : ''} total
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('json')}
              disabled={isExporting || conversationCount === 0}
            >
              <FileJson className="h-4 w-4 mr-1.5" />
              {isExporting ? "Creating..." : "Export JSON"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('markdown')}
              disabled={isExporting || conversationCount === 0}
            >
              <FileText className="h-4 w-4 mr-1.5" />
              {isExporting ? "Creating..." : "Export Markdown"}
            </Button>
          </div>

          {/* Export Tasks List */}
          {exportTasks.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Export Records</p>
              {exportTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/30 text-sm"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getExportStatusIcon(task)}
                    <span className="text-muted-foreground">
                      {task.format.toUpperCase()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(task.created_at)}
                    </span>
                    {task.status === 'completed' && task.total_conversations && (
                      <span className="text-xs text-muted-foreground">
                        ({task.total_conversations} conversation{task.total_conversations > 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {getExportStatusText(task)}
                    </span>
                    {task.status === 'completed' && !isExpired(task.expires_at) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => handleDownload(task.id)}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete All Section */}
        <div className="border-t border-border pt-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2 text-destructive">
            <Trash2 className="h-4 w-4" />
            Delete All Conversations
          </h3>

          {!showDeleteConfirm ? (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                ⚠️ Warning: This action cannot be undone. All conversations will be permanently deleted from our servers.
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                We recommend exporting your data before deleting.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteAll}
                disabled={isDeleting || conversationCount === 0}
                className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Delete All Conversations
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm font-medium text-destructive mb-1">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  Confirm Deletion
                </p>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete all conversations? This will permanently delete {conversationCount} conversation{conversationCount > 1 ? 's' : ''} and all their messages.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="delete-confirm"
                  checked={deleteConfirmed}
                  onCheckedChange={(checked) =>
                    setDeleteConfirmed(checked === true)
                  }
                />
                <label
                  htmlFor="delete-confirm"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  I understand this cannot be undone
                </label>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAll}
                  disabled={!deleteConfirmed || isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Confirm Deletion"
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteConfirmed(false)
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
