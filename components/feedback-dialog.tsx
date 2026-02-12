"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X } from "lucide-react"

const PRESET_REASONS = [
  "This explanation is not clear enough.",
  "This answer lacks depth.",
  "This explanation is not very helpful.",
  "This answer is confusing.",
  "This explanation is not detailed enough.",
]

interface FeedbackDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reason: string, customReason?: string) => void
  isSubmitting?: boolean
}

export function FeedbackDialog({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: FeedbackDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [customReason, setCustomReason] = useState("")

  if (!isOpen) return null

  const handleSubmit = () => {
    if (selectedReason || customReason.trim()) {
      onSubmit(selectedReason || "", customReason.trim() || undefined)
      // Reset form
      setSelectedReason(null)
      setCustomReason("")
    }
  }

  const handleClose = () => {
    setSelectedReason(null)
    setCustomReason("")
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold">Your feedback will help us to be better</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tell us what can be improved
            </p>
          </div>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="icon"
            className="shrink-0"
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Preset Options */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Select a reason:</p>
            <div className="space-y-2">
              {PRESET_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  disabled={isSubmitting}
                  className={`
                    w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200
                    ${
                      selectedReason === reason
                        ? "bg-primary text-primary-foreground border border-primary"
                        : "bg-muted/50 hover:bg-muted/80 border border-transparent"
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`
                        w-4 h-4 rounded-full border-2 flex items-center justify-center
                        ${
                          selectedReason === reason
                            ? "border-current"
                            : "border-muted-foreground/50"
                        }
                      `}
                    >
                      {selectedReason === reason && (
                        <div className="w-2 h-2 rounded-full bg-current" />
                      )}
                    </div>
                    <span>{reason}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Input */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              Or share your own thoughts:
            </p>
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              disabled={isSubmitting}
              placeholder="Type your feedback here..."
              className="
                w-full px-3 py-2 rounded-lg text-sm border border-border bg-background
                focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                resize-none transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20">
          <div className="flex gap-3">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="default"
              className="flex-1"
              disabled={isSubmitting || (!selectedReason && !customReason.trim())}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Feedback"
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
