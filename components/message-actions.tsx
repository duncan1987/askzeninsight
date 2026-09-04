"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Check, Copy, Share2, ThumbsUp, ThumbsDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { FeedbackDialog } from "@/components/feedback-dialog"
import { useTranslations } from "next-intl"

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
  const t = useTranslations("chat")

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
      toast.success(t("copiedToClipboard"))
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error(t("failedToCopy"))
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
        throw new Error(errorData.error || t("failedToRecordFeedback"))
      }

      toast.success(t("feedbackThanks"))
    } catch (error) {
      console.error("Failed to submit like:", error)
      toast.error(t("failedToRecordFeedback"))
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
        throw new Error(errorData.error || t("failedToSubmitFeedback"))
      }

      toast.success(t("feedbackThanks"))
      setShowFeedback(false)
    } catch (error) {
      console.error("Failed to submit feedback:", error)
      toast.error(t("failedToSubmitFeedback"))
      updateFeedbackState(feedback.type)
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  // Handle share for single message
  const handleShare = async () => {
    // Check if user is Pro for sharing
    if (userTier?.tier !== 'pro') {
      toast.error(t("sharingProOnly"), {
        description: t("sharingProOnlyDesc"),
        action: {
          label: t("upgrade"),
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

      toast.success(t("shareLinkCopied"), {
        description: t("shareLinkCopiedDesc"),
      })
    } catch (error) {
      console.error("Failed to create share:", error)
      toast.error(t("failedToCreateShare"))
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
          title={t("copyTitle")}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">{copied ? t("copied") : t("copy")}</span>
        </Button>

        <Button
          onClick={handleLike}
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 px-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground",
            feedback.type === 'like' && "text-green-600 dark:text-green-400 bg-green-500/10"
          )}
          title={t("likeTitle")}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t("like")}</span>
        </Button>

        <Button
          onClick={handleDislike}
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 px-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground",
            feedback.type === 'dislike' && "text-red-600 dark:text-red-400 bg-red-500/10"
          )}
          title={t("dislikeTitle")}
        >
          <ThumbsDown className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t("dislike")}</span>
        </Button>

        <Button
          onClick={handleShare}
          variant="ghost"
          size="sm"
          className="h-7 px-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          title={t("shareTitle")}
        >
          <Share2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t("share")}</span>
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
