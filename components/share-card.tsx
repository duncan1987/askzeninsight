import React from "react"
import type { Message } from "@/components/chat-interface"

interface ShareCardProps {
  messages: Message[]
  username?: string
}

export function ShareCard({ messages, username }: ShareCardProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div
      id="zen-share-card"
      style={{
        all: "initial",
        position: "relative",
        display: "block",
        fontFamily: "Georgia, serif",
        width: "600px",
        borderRadius: "1rem",
        overflow: "hidden",
        background: "linear-gradient(to bottom right, #f5f0eb, #faf6f1)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        color: "#1e293b",
        fontSize: "16px",
        lineHeight: "1.5",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div
        style={{
          all: "initial",
          display: "block",
          boxSizing: "border-box",
          padding: "1.5rem 2rem",
          background: "linear-gradient(to right, #8B5A2B, #A0522D)",
          color: "#ffffff",
        }}
      >
        <div style={{ all: "initial", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              all: "initial",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "4rem",
              width: "4rem",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(4px)",
              border: "2px solid rgba(255, 255, 255, 0.3)",
              overflow: "hidden",
            }}
          >
            <img
              src="/peaceful-prayer-meditation.jpg"
              alt="koji"
              style={{
                all: "initial",
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
          <div style={{ all: "initial" }}>
            <h1 style={{ all: "initial", margin: 0, fontSize: "1.5rem", fontWeight: "bold", color: "#ffffff" }}>Spiritual Conversation</h1>
            <p style={{ all: "initial", margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "#fef3c7" }}>
              with koji • Emptiness and Stillness
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          all: "initial",
          display: "block",
          boxSizing: "border-box",
          padding: "1.5rem 2rem",
        }}
      >
        {messages.map((message, idx) => (
          <div
            key={idx}
            style={{
              all: "initial",
              display: "flex",
              gap: "0.75rem",
              justifyContent: message.role === "user" ? "flex-end" : "flex-start",
              marginBottom: "1rem",
            }}
          >
            {message.role === "assistant" && (
              <div
                style={{
                  all: "initial",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  height: "2rem",
                  width: "2rem",
                  borderRadius: "50%",
                  background: "linear-gradient(to bottom right, rgba(139, 90, 43, 0.2), rgba(160, 82, 45, 0.2))",
                  border: "1px solid rgba(139, 90, 43, 0.3)",
                }}
              >
                <span style={{ all: "initial", fontSize: "0.875rem", lineHeight: "1" }}>🌸</span>
              </div>
            )}
            <div
              style={{
                all: "initial",
                boxSizing: "border-box",
                borderRadius: "0.5rem",
                padding: "0.75rem 1rem",
                maxWidth: "80%",
                ...(message.role === "user"
                  ? {
                      background: "linear-gradient(to bottom right, #8B5A2B, #A0522D)",
                      color: "#ffffff",
                    }
                  : {
                      background: "#ffffff",
                      border: "1px solid #D4A574",
                      color: "#1e293b",
                    }),
              }}
            >
              <p
                style={{
                  all: "initial",
                  margin: 0,
                  fontSize: "0.875rem",
                  lineHeight: "1.625",
                  whiteSpace: "pre-wrap",
                  display: "-webkit-box",
                  WebkitLineClamp: 6,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {message.content}
              </p>
            </div>
            {message.role === "user" && (
              <div
                style={{
                  all: "initial",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  height: "2rem",
                  width: "2rem",
                  borderRadius: "50%",
                  background: "linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.2))",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                }}
              >
                <span style={{ all: "initial", fontSize: "0.875rem", lineHeight: "1" }}>🙏</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          all: "initial",
          display: "block",
          boxSizing: "border-box",
          padding: "1rem 2rem",
          background: "#f5f0eb",
          borderTop: "1px solid #D4A574",
        }}
      >
        <div style={{ all: "initial", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ all: "initial", fontSize: "0.75rem", color: "#475569" }}>
            <p style={{ all: "initial", margin: 0, fontWeight: "500" }}>{formatDate(new Date())}  •  {messages.length} messages</p>
          </div>
          <div style={{ all: "initial", textAlign: "right" }}>
            <p style={{ all: "initial", margin: 0, fontSize: "0.75rem", fontWeight: "600", color: "#8B5A2B" }}>
              Ask Zen Insight
            </p>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div
        style={{
          all: "initial",
          position: "absolute",
          top: 0,
          right: 0,
          pointerEvents: "none",
          width: "128px",
          height: "128px",
          background: "radial-gradient(circle at top right, rgba(212, 165, 116, 0.15), transparent)",
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          all: "initial",
          position: "absolute",
          bottom: 0,
          left: 0,
          pointerEvents: "none",
          width: "96px",
          height: "96px",
          background: "radial-gradient(circle at bottom left, rgba(139, 90, 43, 0.08), transparent)",
          borderRadius: "50%",
        }}
      />
    </div>
  )
}
