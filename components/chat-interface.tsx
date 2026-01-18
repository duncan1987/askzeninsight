"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Send, Sparkles, RefreshCw, MessageSquare, Trash2, X, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { UsageMeter } from "@/components/usage-meter"

interface UserTier {
  tier: 'anonymous' | 'free' | 'pro'
  model: string
  saveHistory: boolean
  authenticated: boolean
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
  const [shouldShowUsageMeter, setShouldShowUsageMeter] = useState(false)
  const [usageRefreshKey, setUsageRefreshKey] = useState(0)
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(undefined)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [userTier, setUserTier] = useState<UserTier>({
    tier: 'anonymous',
    model: 'glm-4-flash',
    saveHistory: false,
    authenticated: false,
  })
  const [fairUseNotice, setFairUseNotice] = useState<string | undefined>(undefined)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Refresh usage meter after each message
  useEffect(() => {
    if (!shouldShowUsageMeter && messages.length > 1) {
      setShouldShowUsageMeter(true)
    }
  }, [messages, shouldShowUsageMeter])

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

  const saveMessage = async (role: "user" | "assistant", content: string) => {
    // Only save messages for authenticated users with history enabled
    if (!userTier.saveHistory) {
      console.log("Not saving message - history not enabled")
      return
    }

    try {
      setIsSaving(true)
      console.log("Saving message:", { role, content: content.substring(0, 50) + "...", conversationId: currentConversationId })
      const response = await fetch("/api/conversations/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: currentConversationId, role, content }),
      })
      if (response.ok) {
        const data = await response.json()
        console.log("Message saved successfully:", data)
        setCurrentConversationId(data.conversationId)
        // Refresh conversation list
        loadConversations()
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

    // Save user message to database (wait for it to complete to ensure conversationId is set)
    await saveMessage("user", userInput)

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

      // Save assistant message to database
      if (fullResponse) {
        await saveMessage("assistant", fullResponse)
      }
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage = error instanceof Error ? error.message : "I apologize, but I'm having trouble connecting right now. Please try again."
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
      // Refresh usage meter after message is sent/received
      setUsageRefreshKey((prev) => prev + 1)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
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
  }

  return (
    <div className={cn(
      "container mx-auto px-4 py-8 transition-all duration-300",
      userTier.saveHistory ? "max-w-[1800px]" : "max-w-5xl"
    )}>
      <div className={cn(
        "flex gap-6",
        userTier.saveHistory && "lg:gap-8"
      )}>
        {/* Sidebar - Conversation History (only for Pro users) */}
        {userTier.saveHistory && (
          <aside className={cn(
            "w-80 shrink-0 transition-all duration-300",
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
                    <button
                      key={conv.id}
                      onClick={() => loadConversation(conv.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg text-sm transition-colors relative group",
                        currentConversationId === conv.id
                          ? "bg-primary/10 border border-primary/20"
                          : "bg-muted/50 hover:bg-muted/80"
                      )}
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
                    </button>
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
                <div className="text-center flex-1 lg:text-left">
                  <h1 className="text-3xl font-bold text-foreground mb-2">Spiritual Guidance Chat</h1>
                  <p className="text-muted-foreground">Share your thoughts and questions with koji (Emptiness and Stillness)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
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
            {shouldShowUsageMeter && (
              <div className="max-w-md mx-auto lg:mx-0">
                <UsageMeter refreshKey={usageRefreshKey} />
              </div>
            )}
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

        {/* Medical & Disclaimer Banner */}
        <div className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mb-1">
                Important: AI Guidance Disclaimer
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                This AI provides spiritual guidance and meditation support for reflection
                purposes only. It is NOT professional medical, mental health, or legal
                advice. If experiencing mental health crisis or self-harm thoughts,
                please contact emergency services or qualified healthcare professionals
                immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "rounded-lg px-4 py-3",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground max-w-[75%]"
                    : "bg-muted text-foreground max-w-[85%]"
                )}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === "user" && (
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-sm font-medium">You</span>
                </div>
              )}
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content === "" && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
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

        {/* Input Area */}
        <div className="border-t border-border bg-background p-4">
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
    </div>
  )
}
