"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Check, Copy, Share2, ThumbsUp, ThumbsDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { FeedbackDialog } from "@/components/feedback-dialog"

interface MessageActionsProps {
  messageId: string
  content: string
  userQuestion?: string
  userTier?: {
    tier: 'anonymous' | 'free' | 'pro'
    authenticated: boolean
    full_name?: string
  }
  initialFeedbackType?: 'like' | 'dislike' | null
  onFeedbackChange?: (type: 'like' | 'dislike' | null) => void
}

interface FeedbackState {
  type: 'like' | 'dislike' | null
}

export function MessageActions({
  messageId,
  content,
  userQuestion,
  userTier,
  initialFeedbackType = null,
  onFeedbackChange,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>({ type: initialFeedbackType })

  // Update local state when initialFeedbackType changes
  useEffect(() => {
    setFeedback({ type: initialFeedbackType })
  }, [initialFeedbackType])

  const updateFeedbackState = (type: 'like' | 'dislike' | null) => {
    setFeedback({ type })
    onFeedbackChange?.(type)
  }

  // Handle copy
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      toast.success("Copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy text")
    }
  }

  // Handle like
  const handleLike = async () => {
    // Toggle like
    const newType = feedback.type === 'like' ? null : 'like'

    // If toggling off, just update UI state
    if (newType === null) {
      updateFeedbackState(null)
      return
    }

    updateFeedbackState(newType)

    const requestBody = {
      messageId,
      feedbackType: 'like',
    }
    console.log('[MessageActions] Submitting like:', requestBody)

    try {
      const response = await fetch("/api/message-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('[MessageActions] Error response:', errorData)
        throw new Error(errorData.error || "Failed to record feedback")
      }

      toast.success("Thank you for your feedback!")
    } catch (error) {
      console.error("Failed to submit like:", error)
      toast.error("Failed to record feedback")
      // Revert state on error
      updateFeedbackState(feedback.type)
    }
  }

  // Handle dislike
  const handleDislike = () => {
    if (feedback.type === 'dislike') {
      // Toggle off - just update UI state
      updateFeedbackState(null)
      return
    }
    setShowFeedback(true)
  }

  // Handle feedback submission
  const handleFeedbackSubmit = async (reason: string, customReason?: string) => {
    setIsSubmittingFeedback(true)
    updateFeedbackState('dislike')

    const requestBody = {
      messageId,
      feedbackType: 'dislike',
      feedbackReason: reason,
      feedbackCustomReason: customReason,
    }
    console.log('[MessageActions] Submitting dislike feedback:', requestBody)

    try {
      const response = await fetch("/api/message-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('[MessageActions] Error response:', errorData)
        throw new Error(errorData.error || "Failed to submit feedback")
      }

      toast.success("Thank you for your feedback!")
      setShowFeedback(false)
    } catch (error) {
      console.error("Failed to submit feedback:", error)
      toast.error("Failed to submit feedback")
      updateFeedbackState(feedback.type)
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  // Handle share for single message
  const handleShare = async () => {
    // Check if user is Pro for sharing
    if (userTier?.tier !== 'pro') {
      toast.error("Sharing is available for Pro users", {
        description: "Upgrade to Pro to unlock sharing features",
        action: {
          label: "Upgrade",
          onClick: () => (window.location.href = "/pricing"),
        },
      })
      return
    }

    try {
      // Create messages array with user question and assistant response
      const messagesToShare = []
      if (userQuestion) {
        messagesToShare.push({ role: "user", content: userQuestion })
      }
      messagesToShare.push({ role: "assistant", content })

      // Create share via API
      const response = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: userTier?.full_name,
          messages: messagesToShare,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create share")
      }

      const { shareId } = await response.json()

      // Create share URL and copy to clipboard
      const shareUrl = `${window.location.origin}/share/${shareId}`
      await navigator.clipboard.writeText(shareUrl)

      toast.success("Share link copied!", {
        description: "The link has been copied to your clipboard",
      })
    } catch (error) {
      console.error("Failed to create share:", error)
      toast.error("Failed to create share link")
    }
  }

  return (
    <>
      <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <Button
          onClick={handleCopy}
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 px-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground",
            copied && "text-green-600 dark:text-green-400"
          )}
          title="Copy"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
        </Button>

        <Button
          onClick={handleLike}
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 px-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground",
            feedback.type === 'like' && "text-green-600 dark:text-green-400 bg-green-500/10"
          )}
          title="Like"
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Like</span>
        </Button>

        <Button
          onClick={handleDislike}
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 px-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground",
            feedback.type === 'dislike' && "text-red-600 dark:text-red-400 bg-red-500/10"
          )}
          title="Dislike"
        >
          <ThumbsDown className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Dislike</span>
        </Button>

        <Button
          onClick={handleShare}
          variant="ghost"
          size="sm"
          className="h-7 px-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          title="Share"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Share</span>
        </Button>
      </div>

      <FeedbackDialog
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        onSubmit={handleFeedbackSubmit}
        isSubmitting={isSubmittingFeedback}
      />
    </>
  )
}
