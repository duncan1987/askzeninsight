"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Send, Sparkles, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { UsageMeter } from "@/components/usage-meter"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
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

  // Refresh usage meter after each message
  useEffect(() => {
    if (!shouldShowUsageMeter && messages.length > 1) {
      setShouldShowUsageMeter(true)
    }
  }, [messages, shouldShowUsageMeter])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

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

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No response body")
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: msg.content + text }
              : msg
          )
        )
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
    setMessages([
      {
        id: Date.now().toString(),
        role: "assistant",
        content: "Welcome. I'm here to offer spiritual guidance and support. Whether you're seeking wisdom about faith, meditation, or life's challenges, feel free to share what's on your heart. How may I assist you today?",
      },
    ])
    setInput("")
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-2">Spiritual Guidance Chat</h1>
            <p className="text-muted-foreground">Share your thoughts and questions with koji (Emptiness and Stillness)</p>
          </div>
          <Button
            onClick={handleNewConversation}
            disabled={isLoading}
            variant="outline"
            size="lg"
            className="gap-2 shrink-0 ml-4"
          >
            <RefreshCw className="h-4 w-4" />
            New Conversation
          </Button>
        </div>
        {shouldShowUsageMeter && (
          <div className="max-w-md mx-auto">
            <UsageMeter refreshKey={usageRefreshKey} />
          </div>
        )}
      </div>

      <Card
        className="border border-border bg-card overflow-hidden flex flex-col"
        style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}
      >
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
                  "max-w-[80%] rounded-lg px-4 py-3",
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
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
  )
}
