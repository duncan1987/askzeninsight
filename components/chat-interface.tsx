"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Send, Sparkles, RefreshCw, MessageSquare, Trash2, X, Zap, Brain, Flower2, Download, Share2, CheckSquare, Square, Image as ImageIcon, AlertTriangle, Check, Crown, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ShareCard } from "@/components/share-card"

interface UserTier {
  tier: 'anonymous' | 'free' | 'pro'
  model: string
  saveHistory: boolean
  authenticated: boolean
  avatar_url?: string
  full_name?: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface ChatError {
  error: string
  limit?: number
  remaining?: number
}

// Zen-inspired error messages for API failures
const ZEN_ERROR_MESSAGES = [
  "Mountains remain silent through storms. Please try again in a moment.",
  "The bamboo bends but does not break. Let us reconnect.",
  "In stillness, clarity returns. Breathe and try once more.",
  "All things pass. This momentary pause shall too.",
  "Like clouds drifting, connection fades and returns. Please try again.",
  "The river flows around obstacles. Let us find another path.",
  "A brief pause in the journey. Rest, then continue when ready.",
  "Cherry blossoms fall, yet bloom again. Your patience is appreciated.",
]

const getRandomZenError = () => {
  return ZEN_ERROR_MESSAGES[Math.floor(Math.random() * ZEN_ERROR_MESSAGES.length)]
}

// Example questions to guide users
const EXAMPLE_QUESTIONS = [
  {
    icon: Brain,
    text: "I'm feeling stressed about work. How can I find peace?",
  },
  {
    icon: Flower2,
    text: "Can you guide me through a simple meditation?",
  },
]

// Helper function to get user initials from full name
const getUserInitials = (fullName?: string) => {
  if (!fullName) return 'U'
  return fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
}

export function ChatInterface() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Welcome. I'm here to offer spiritual guidance and support. Whether you're seeking wisdom about faith, meditation, or life's challenges, feel free to share what's on your heart. How may I assist you today?",
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set())
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(undefined)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [userTier, setUserTier] = useState<UserTier>({
    tier: 'anonymous',
    model: 'glm-4-flash',
    saveHistory: false,
    authenticated: false,
    avatar_url: '',
    full_name: '',
  })
  const [fairUseNotice, setFairUseNotice] = useState<string | undefined>(undefined)
  const [showPrivacyWarning, setShowPrivacyWarning] = useState(false)
  const [isGeneratingCard, setIsGeneratingCard] = useState(false)
  const [shareCardPreview, setShareCardPreview] = useState<string | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeFeature, setUpgradeFeature] = useState<string>("")
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [shownToastThresholds, setShownToastThresholds] = useState<Set<number>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Load user tier on mount
  useEffect(() => {
    fetchUserTier()
  }, [])

  // Load conversations on mount (only if authenticated and tier supports history)
  useEffect(() => {
    if (userTier.authenticated && userTier.saveHistory) {
      loadConversations()
    }
  }, [userTier])

  const fetchUserTier = async () => {
    try {
      const response = await fetch("/api/user/tier")
      if (response.ok) {
        const data = await response.json()
        setUserTier(data)
      }
    } catch (error) {
      console.error("Failed to fetch user tier:", error)
    }
  }

  // Check usage and show toast notifications at thresholds
  const checkUsageAndShowToast = async () => {
    try {
      const response = await fetch("/api/user/usage-stats")
      if (response.ok) {
        const stats = await response.json()
        const { used, limit, percentage } = stats

        // Only show toast at 100% threshold
        if (percentage >= 100 && !shownToastThresholds.has(100)) {
          // Update shown thresholds
          setShownToastThresholds(prev => new Set([...prev, 100]))

          // Determine toast content based on tier
          if (userTier.tier === 'pro') {
            toast.warning("Premium Quota Exhausted", {
              description: `You've used your 30 daily premium messages. Further conversations will use the basic model (glm-4-flash). Your quota resets automatically tomorrow.`,
              duration: Infinity,
              closeButton: true,
            })
          } else {
            toast.error("Daily Message Limit Reached", {
              description: `You've used ${limit} messages. Please upgrade to Pro plan or try again tomorrow.`,
              duration: Infinity,
              closeButton: true,
              action: {
                label: "Upgrade to Pro",
                onClick: () => (window.location.href = "/pricing"),
              },
            })
          }
        }
      }
    } catch (error) {
      console.error("Failed to check usage:", error)
    }
  }

  const loadConversations = async () => {
    try {
      const response = await fetch("/api/conversations")
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      }
    } catch (error) {
      console.error("Failed to load conversations:", error)
    }
  }

  const loadConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations?conversationId=${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        console.log("Loaded conversation:", data)
        setCurrentConversationId(data.id)
        // Ensure we have messages array
        const messages = data.messages || []
        console.log("Setting messages:", messages)
        setMessages(
          messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
          }))
        )
        setShowHistory(false)
      } else {
        console.error("Failed to load conversation:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("Failed to load conversation:", error)
    }
  }

  const deleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    // Zen-inspired confirmation message
    const confirmed = window.confirm(
      "All things are impermanent.\n\nAre you ready to let go of this conversation?\n\n(Like a river flowing, once released, it cannot return.)"
    )

    if (!confirmed) return

    try {
      const response = await fetch(`/api/conversations?conversationId=${conversationId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== conversationId))
        if (currentConversationId === conversationId) {
          handleNewConversation()
        }
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error)
    }
  }

  const saveMessage = async (role: "user" | "assistant", content: string, explicitConversationId?: string) => {
    // Only save messages for authenticated users with history enabled
    if (!userTier.saveHistory) {
      console.log("Not saving message - history not enabled")
      return
    }

    try {
      setIsSaving(true)
      // Use explicit conversationId if provided (to avoid async state issues)
      const convId = explicitConversationId !== undefined ? explicitConversationId : currentConversationId
      console.log("Saving message:", { role, content: content.substring(0, 50) + "...", conversationId: convId })
      const response = await fetch("/api/conversations/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId, role, content }),
      })
      if (response.ok) {
        const data = await response.json()
        console.log("Message saved successfully:", data)
        // Only update state if we got a new conversation ID
        if (data.conversationId && data.conversationId !== currentConversationId) {
          setCurrentConversationId(data.conversationId)
        }
        // Refresh conversation list
        loadConversations()
        return data.conversationId
      } else {
        console.error("Failed to save message:", response.status, response.statusText)
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("Error data:", errorData)
      }
    } catch (error) {
      console.error("Failed to save message:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    const userInput = input
    setInput("")
    setIsLoading(true)

    // Save user message to database and get the conversation ID
    const conversationId = await saveMessage("user", userInput)

    // Create empty assistant message for streaming
    const assistantMessageId = (Date.now() + 1).toString()
    setMessages((prev) => [
      ...prev,
      { id: assistantMessageId, role: "assistant", content: "" },
    ])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messages.concat(userMessage).map((msg) => ({
            role: msg.role,
            parts: [{ type: "text", text: msg.content }],
          })),
        }),
      })

      if (!response.ok) {
        // Handle usage limit error (429)
        if (response.status === 429) {
          const errorData: ChatError = await response.json()
          throw new Error(errorData.error || "Daily message limit exceeded")
        }
        throw new Error(`API error: ${response.statusText}`)
      }

      // Check for fair use notice in response headers
      const fairUseNoticeHeader = response.headers.get("X-Fair-Use-Notice")
      if (fairUseNoticeHeader) {
        const decodedNotice = decodeURIComponent(fairUseNoticeHeader)
        setFairUseNotice(decodedNotice)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No response body")
      }

      let fullResponse = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        fullResponse += text
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: msg.content + text }
              : msg
          )
        )
      }

      // Save assistant message to database using the conversation ID we got earlier
      if (fullResponse && conversationId) {
        await saveMessage("assistant", fullResponse, conversationId)
      }
    } catch (error) {
      console.error("Chat error:", error)
      // Use zen-inspired error message for API errors, or show specific error message for limits
      let errorMessage = getRandomZenError()
      if (error instanceof Error) {
        // For usage limit errors (429), show the specific message
        if (error.message.includes("Daily message limit")) {
          errorMessage = error.message
        }
      }
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: errorMessage,
        },
      ])
    } finally {
      setIsLoading(false)
      // Check usage and show toast notification
      checkUsageAndShowToast()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleExampleQuestion = (question: string) => {
    setInput(question)
    // Auto-send after a brief delay for better UX
    setTimeout(() => {
      handleSend()
    }, 100)
  }

  const handleNewConversation = () => {
    if (isLoading) return
    setCurrentConversationId(undefined)
    setMessages([
      {
        id: Date.now().toString(),
        role: "assistant",
        content: "Welcome. I'm here to offer spiritual guidance and support. Whether you're seeking wisdom about faith, meditation, or life's challenges, feel free to share what's on your heart. How may I assist you today?",
      },
    ])
    setInput("")
    setShowHistory(false)
    setIsSelectionMode(false)
    setSelectedMessageIds(new Set())
  }

  // Selection mode functions
  const toggleMessageSelection = (messageId: string) => {
    const newSelection = new Set(selectedMessageIds)
    if (newSelection.has(messageId)) {
      newSelection.delete(messageId)
    } else {
      newSelection.add(messageId)
    }
    setSelectedMessageIds(newSelection)
  }

  const toggleSelectAll = () => {
    if (selectedMessageIds.size === messages.length) {
      setSelectedMessageIds(new Set())
    } else {
      setSelectedMessageIds(new Set(messages.map((m) => m.id)))
    }
  }

  const clearSelection = () => {
    setSelectedMessageIds(new Set())
  }

  const exitSelectionMode = () => {
    setIsSelectionMode(false)
    setSelectedMessageIds(new Set())
  }

  // Export functions
  const exportToTxt = () => {
    if (!checkExportPermission("TXT Export")) return

    const selectedMessages = messages.filter((m) => selectedMessageIds.has(m.id))
    if (selectedMessages.length === 0) return

    const timestamp = new Date().toLocaleString()
    let content = `═══════════════════════════════════════════════════════\n`
    content += `           Spiritual Conversation with koji\n`
    content += `═══════════════════════════════════════════════════════\n\n`
    content += `Date: ${timestamp}\n`
    content += `Messages: ${selectedMessages.length}\n\n`
    content += `───────────────────────────────────────────────────────\n\n`

    selectedMessages.forEach((msg, idx) => {
      const role = msg.role === "user" ? "You" : "koji"
      content += `[${role}]\n${msg.content}\n\n`
      content += `───────────────────────────────────────────────────────\n\n`
    })

    content += `\n═══════════════════════════════════════════════════════\n`
    content += `Generated by Ask Zen Insight\n`
    content += `https://ask.zeninsight.xyz\n`
    content += `═══════════════════════════════════════════════════════\n`

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `zen-conversation-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportToMarkdown = () => {
    if (!checkExportPermission("Markdown Export")) return

    const selectedMessages = messages.filter((m) => selectedMessageIds.has(m.id))
    if (selectedMessages.length === 0) return

    const timestamp = new Date().toLocaleString()
    let content = `# 🧘 Spiritual Conversation with koji\n\n`
    content += `> *Emptiness and Stillness*\n\n`
    content += `**Date:** ${timestamp}  \n`
    content += `**Messages:** ${selectedMessages.length}\n\n`
    content += `---\n\n`

    selectedMessages.forEach((msg) => {
      const role = msg.role === "user" ? "🙏 **You**" : "🌸 **koji**"
      content += `### ${role}\n\n${msg.content}\n\n---\n\n`
    })

    content += `\n<div align="center">\n\n`
    content += `***\n\n`
    content += `_Generated by **Ask Zen Insight**_\n\n`
    content += `[https://ask.zeninsight.xyz](https://ask.zeninsight.xyz)\n\n`
    content += `</div>\n`

    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `zen-conversation-${Date.now()}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleGenerateShareCard = async () => {
    if (!checkExportPermission("Share Card")) return

    const selectedMessages = messages.filter((m) => selectedMessageIds.has(m.id))
    if (selectedMessages.length === 0) return

    // Show privacy warning first
    setShowPrivacyWarning(true)
  }

  const confirmGenerateShareCard = async () => {
    setShowPrivacyWarning(false)
    setIsGeneratingCard(true)

    try {
      // Dynamic import to avoid SSR issues
      const html2canvas = (await import("html2canvas")).default

      const cardElement = document.getElementById("zen-share-card")
      if (!cardElement) {
        throw new Error("Share card element not found")
      }

      const canvas = await html2canvas(cardElement, {
        scale: 2, // Higher quality
        backgroundColor: null,
        logging: false,
        onclone: (clonedDoc) => {
          // Replace oklch CSS variables with hex equivalents for html2canvas compatibility
          const root = clonedDoc.documentElement
          root.style.setProperty("--background", "#ffffff")
          root.style.setProperty("--foreground", "#1e293b")
          root.style.setProperty("--card", "#ffffff")
          root.style.setProperty("--card-foreground", "#1e293b")
          root.style.setProperty("--popover", "#ffffff")
          root.style.setProperty("--popover-foreground", "#1e293b")
          root.style.setProperty("--primary", "#1e293b")
          root.style.setProperty("--primary-foreground", "#fafafa")
          root.style.setProperty("--secondary", "#f1f5f9")
          root.style.setProperty("--secondary-foreground", "#1e293b")
          root.style.setProperty("--muted", "#f1f5f9")
          root.style.setProperty("--muted-foreground", "#64748b")
          root.style.setProperty("--accent", "#f1f5f9")
          root.style.setProperty("--accent-foreground", "#1e293b")
          root.style.setProperty("--border", "#e2e8f0")
          root.style.setProperty("--input", "#e2e8f0")
          root.style.setProperty("--ring", "#94a3b8")
        },
      })

      // Convert canvas to data URL and show preview modal
      const dataUrl = canvas.toDataURL("image/png")
      setShareCardPreview(dataUrl)
      setShowPreviewModal(true)
      setIsGeneratingCard(false)
    } catch (error) {
      console.error("Failed to generate share card:", error)
      setIsGeneratingCard(false)
    }
  }

  const handleCopyShareLink = async () => {
    try {
      // Get selected messages
      const selectedMessages = messages.filter((m) => selectedMessageIds.has(m.id))

      if (selectedMessages.length === 0) {
        console.error("No messages selected")
        return
      }

      // Create share via API
      const response = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: userTier.full_name,
          messages: selectedMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create share")
      }

      const { shareId } = await response.json()

      // Create share URL
      const shareUrl = `${window.location.origin}/share/${shareId}`
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2000)
      })
    } catch (error) {
      console.error("Failed to create share link:", error)
    }
  }

  const handleDownloadCard = () => {
    if (!shareCardPreview) return

    const a = document.createElement("a")
    a.href = shareCardPreview
    a.download = `zen-conversation-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const closePreviewModal = () => {
    setShowPreviewModal(false)
    setShareCardPreview(null)
    setCopiedLink(false)
  }

  // Check if user has access to export and sharing features
  const checkExportPermission = (featureName: string): boolean => {
    // Only Pro tier (authenticated with saveHistory) can export
    if (userTier.tier !== 'pro') {
      setUpgradeFeature(featureName)
      setShowUpgradeModal(true)
      return false
    }
    return true
  }

  return (
    <div className={cn(
      "container mx-auto px-4 py-8 transition-all duration-300",
      // When sidebar is collapsed, reduce max-width for better focus
      userTier.saveHistory && !sidebarCollapsed ? "max-w-[1800px]" : "max-w-7xl"
    )}>
      <div className={cn(
        "flex gap-6 transition-all duration-300",
        userTier.saveHistory && !sidebarCollapsed && "lg:gap-8"
      )}>
        {/* Sidebar - Conversation History (only for Pro users) */}
        {userTier.saveHistory && (
          <aside className={cn(
            "shrink-0 transition-all duration-300 overflow-hidden",
            sidebarCollapsed ? "w-0 lg:w-0 opacity-0" : "w-80 lg:w-80 opacity-100",
            showHistory ? "block" : "hidden lg:block"
          )}>
            <Card className="border border-border bg-card h-full flex flex-col" style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}>
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-lg">Chat History</h2>
                  <Button
                    onClick={handleNewConversation}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="hidden lg:inline">New</span>
                  </Button>
                </div>
                <Button
                  onClick={() => setShowHistory(!showHistory)}
                  variant="ghost"
                  size="sm"
                  className="lg:hidden w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Close
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {conversations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No conversations yet
                  </p>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => loadConversation(conv.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg text-sm transition-colors relative group cursor-pointer",
                        currentConversationId === conv.id
                          ? "bg-primary/10 border border-primary/20"
                          : "bg-muted/50 hover:bg-muted/80"
                      )}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          loadConversation(conv.id)
                        }
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{conv.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(conv.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={(e) => deleteConversation(conv.id, e)}
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </aside>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 min-w-0">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* Mobile: Open sidebar button */}
                {!showHistory && userTier.saveHistory && (
                  <Button
                    onClick={() => setShowHistory(true)}
                    variant="outline"
                    size="icon"
                    className="lg:hidden"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                )}
                {/* Desktop: Toggle sidebar button */}
                {userTier.saveHistory && (
                  <Button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    variant="outline"
                    size="icon"
                    className="hidden lg:flex"
                    title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  >
                    {sidebarCollapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronLeft className="h-4 w-4" />
                    )}
                  </Button>
                )}
                <div className="text-center flex-1 lg:text-left">
                  <h1 className="text-3xl font-bold text-foreground mb-2">Spiritual Guidance Chat</h1>
                  <p className="text-muted-foreground">Share your thoughts and questions with koji (Emptiness and Stillness)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Selection Mode Toggle */}
                {messages.length > 1 && !isSelectionMode && (
                  <Button
                    onClick={() => setIsSelectionMode(true)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <CheckSquare className="h-4 w-4" />
                    <span className="hidden sm:inline">Select Messages</span>
                  </Button>
                )}
                {/* Tier Badge */}
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                  userTier.tier === 'pro'
                    ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                )}>
                  {userTier.tier === 'pro' ? (
                    <Zap className="h-3.5 w-3.5" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  <span>{userTier.tier === 'pro' ? 'Pro' : userTier.authenticated ? 'Free' : 'Guest'}</span>
                  <span className="text-muted-foreground/70 mx-1">•</span>
                  <span>{userTier.model}</span>
                </div>
                {isSaving && (
                  <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>
                )}
              </div>
            </div>
          </div>

          <Card
            className="border border-border bg-card overflow-hidden flex flex-col"
            style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}
          >
        {/* Fair Use Notice Banner */}
        {fairUseNotice && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3">
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200 flex-1">
                {fairUseNotice}
              </p>
              <button
                onClick={() => setFairUseNotice(undefined)}
                className="shrink-0 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => {
            const isSelected = selectedMessageIds.has(message.id)
            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 group transition-all duration-200",
                  message.role === "user" ? "justify-end" : "justify-start",
                  isSelectionMode && "hover:bg-muted/30 -mx-2 px-2 py-2 rounded-lg"
                )}
              >
                {/* Selection Checkbox */}
                {isSelectionMode && (
                  <div className="flex items-center">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleMessageSelection(message.id)}
                      className={cn(
                        "transition-all duration-200",
                        isSelected && "border-primary bg-primary text-primary-foreground"
                      )}
                    />
                  </div>
                )}
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center overflow-hidden">
                    <img
                      src="/peaceful-prayer-meditation.jpg"
                      alt="koji"
                      className="h-8 w-8 object-cover"
                    />
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-lg px-4 py-3 transition-all duration-200",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground max-w-[75%]"
                      : "bg-muted text-foreground max-w-[85%]",
                    isSelected && "ring-2 ring-primary ring-offset-2"
                  )}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === "user" && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={userTier.avatar_url || undefined}
                      alt={userTier.full_name || "You"}
                    />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-medium">
                      {getUserInitials(userTier.full_name)}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            )
          })}
          {isLoading && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content === "" && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center overflow-hidden">
                <img
                  src="/peaceful-prayer-meditation.jpg"
                  alt="koji"
                  className="h-8 w-8 object-cover"
                />
              </div>
              <div className="bg-muted rounded-lg px-4 py-3">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Selection Mode Toolbar */}
        {isSelectionMode && (
          <div className="border-t border-border bg-muted/30 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={toggleSelectAll}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {selectedMessageIds.size === messages.length ? (
                      <>
                        <Square className="h-4 w-4" />
                        <span className="hidden sm:inline">Deselect All</span>
                      </>
                    ) : (
                      <>
                        <CheckSquare className="h-4 w-4" />
                        <span className="hidden sm:inline">Select All</span>
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={clearSelection}
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    <span className="hidden sm:inline">Clear</span>
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {selectedMessageIds.size > 0 && (
                      <span className="font-medium text-foreground">{selectedMessageIds.size}</span>
                    )}{" "}
                    selected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={exitSelectionMode}
                    variant="ghost"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  {selectedMessageIds.size > 0 && (
                    <>
                      <Button
                        onClick={exportToTxt}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">TXT</span>
                      </Button>
                      <Button
                        onClick={exportToMarkdown}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Markdown</span>
                      </Button>
                      <Button
                        onClick={handleGenerateShareCard}
                        variant="default"
                        size="sm"
                        className="gap-2"
                        disabled={isGeneratingCard}
                      >
                        {isGeneratingCard ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            <span className="hidden sm:inline">Generating...</span>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">Share Card</span>
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-border bg-background p-4">
          {/* AI Guidance Disclaimer - Compact */}
          <div className="mb-3">
            <button
              onClick={() => setShowDisclaimer(!showDisclaimer)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 hover:border-blue-500/20 transition-colors text-left group"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="text-xs text-blue-700 dark:text-blue-300">
                  AI provides spiritual guidance for reflection only
                  <span className="text-blue-600 dark:text-blue-400 font-medium"> — not professional advice</span>
                </span>
              </div>
              <span className="text-xs text-blue-600 dark:text-blue-400 opacity-60 group-hover:opacity-100 transition-opacity">
                {showDisclaimer ? '▲' : '▼'}
              </span>
            </button>
            {showDisclaimer && (
              <div className="mt-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mb-1">
                  AI Guidance Disclaimer
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  This AI provides spiritual guidance and meditation support for reflection
                  purposes only. It is NOT professional medical, mental health, or legal
                  advice. If experiencing mental health crisis or self-harm thoughts,
                  please contact emergency services or qualified healthcare professionals
                  immediately.
                </p>
              </div>
            )}
          </div>

          {/* Example Questions - Only show on initial state */}
          {messages.length === 1 && (
            <div className="mb-4 space-y-2">
              {EXAMPLE_QUESTIONS.map((question, index) => {
                const IconComponent = question.icon
                return (
                  <button
                    key={index}
                    onClick={() => handleExampleQuestion(question.text)}
                    disabled={isLoading}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-muted/50 hover:bg-muted/80 hover:border-primary/30 transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed",
                      "hover:shadow-sm"
                    )}
                  >
                    <IconComponent className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm text-foreground">
                      {question.text}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          <div className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share your thoughts or ask a question..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send • Your conversation is private and confidential
          </p>
          </div>
      </Card>
      </div>
      </div>

      {/* Privacy Warning Dialog */}
      {showPrivacyWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6 border-border bg-card">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Privacy Notice</h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    You are about to create a shareable image of your spiritual conversation.
                  </p>
                  <p className="font-medium text-foreground">
                    Please consider:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>This image will contain your personal reflections</li>
                    <li>Once shared online, it cannot be fully removed</li>
                    <li>Others may see, save, or reshare this content</li>
                    <li>Review the selected messages carefully</li>
                  </ul>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => setShowPrivacyWarning(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Go Back
                  </Button>
                  <Button
                    onClick={confirmGenerateShareCard}
                    variant="default"
                    className="flex-1"
                  >
                    I Understand, Generate
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Share Card Preview Modal */}
      {showPreviewModal && shareCardPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full border-border bg-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="text-lg font-semibold">Share Card Preview</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Review your spiritual conversation card</p>
              </div>
              <Button
                onClick={closePreviewModal}
                variant="ghost"
                size="icon"
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Preview Image */}
            <div className="p-6 bg-muted/30 flex items-center justify-center">
              <div className="rounded-lg overflow-hidden shadow-2xl">
                <img
                  src={shareCardPreview}
                  alt="Share Card Preview"
                  className="max-w-full h-auto"
                  style={{ maxHeight: "500px" }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-border bg-muted/20">
              <div className="flex gap-3">
                <Button
                  onClick={handleCopyShareLink}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" />
                      Copy Share Link
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleDownloadCard}
                  variant="default"
                  className="flex-1 gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Card
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-3">
                The image will be downloaded as a PNG file
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Upgrade Required Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6 border-border bg-card">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
                <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Pro Feature</h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    <span className="font-medium text-foreground">{upgradeFeature}</span> is available exclusively for Pro subscribers.
                  </p>
                  <p className="text-xs">
                    Upgrade to Pro to unlock:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Export conversations to TXT and Markdown</li>
                    <li>Generate beautiful share cards</li>
                    <li>Save chat history</li>
                    <li>Access to advanced AI models</li>
                  </ul>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => setShowUpgradeModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Maybe Later
                  </Button>
                  <Button
                    onClick={() => {
                      window.location.href = "/pricing"
                    }}
                    variant="default"
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  >
                    <Crown className="h-4 w-4 mr-1" />
                    Upgrade to Pro
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Hidden Share Card Component for Generation */}
      {selectedMessageIds.size > 0 && (
        <div className="fixed -left-[9999px] top-0">
          <ShareCard
            messages={messages.filter((m) => selectedMessageIds.has(m.id))}
            username={userTier.full_name}
          />
        </div>
      )}
    </div>
  )
}
