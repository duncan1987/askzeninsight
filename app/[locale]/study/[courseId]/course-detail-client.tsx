"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Lock, Volume2, Pause, Square, Share2, Check, Loader2 } from "lucide-react"
import { useRouter } from "@/i18n/navigation"

interface Course {
  id: string
  title: string
  content_html: string
  truncation_index: number | null
  published_at: string | null
}

interface Comment {
  id: string
  content: string
  created_at: string
  user: { username: string; avatar_url: string | null }
}

interface CourseDetailClientProps {
  course: Course
  isCheckedIn: boolean
  comments: Comment[]
}

type SpeechState = "idle" | "loading" | "playing" | "paused"

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
}

export function CourseDetailClient({ course, isCheckedIn, comments: initialComments }: CourseDetailClientProps) {
  const router = useRouter()
  const [checkedIn, setCheckedIn] = useState(isCheckedIn)
  const [checkinLoading, setCheckinLoading] = useState(false)
  const [comments, setComments] = useState(initialComments)
  const [commentText, setCommentText] = useState("")
  const [commentLoading, setCommentLoading] = useState(false)
  const [contentHtml, setContentHtml] = useState(course.content_html)
  const [speechState, setSpeechState] = useState<SpeechState>("idle")
  const [copied, setCopied] = useState(false)
  const [ttsSupported, setTtsSupported] = useState(false)
  const [useServerTts, setUseServerTts] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const audioUrlsRef = useRef<Map<number, string>>(new Map())
  const totalChunksRef = useRef(0)
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const serverTtsStoppedRef = useRef(false)

  useEffect(() => {
    const webSpeechOk =
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      typeof SpeechSynthesisUtterance !== "undefined"
    // WeChat built-in browser has unreliable Web Speech support — always use server TTS there
    const isWeChat =
      typeof navigator !== "undefined" && /MicroMessenger/i.test(navigator.userAgent)
    setTtsSupported(webSpeechOk)
    setUseServerTts(!webSpeechOk || isWeChat)
  }, [])

  useEffect(() => {
    setCheckedIn(isCheckedIn)
    setContentHtml(course.content_html)
    setComments(initialComments)
  }, [isCheckedIn, course.content_html, initialComments])

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      serverTtsStoppedRef.current = true
      if (audioElRef.current) {
        audioElRef.current.pause()
        audioElRef.current = null
      }
      for (const url of audioUrlsRef.current.values()) {
        URL.revokeObjectURL(url)
      }
      audioUrlsRef.current.clear()
    }
  }, [])

  // Auto check-in after returning from login via a shared "打卡解锁" click:
  // the redirect URL carries ?autocheckin=1; once the user is back (and
  // logged in), complete the check-in so the full content expands.
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    if (params.get("autocheckin") !== "1") return

    // Strip the flag from the URL so a later share/refresh doesn't repeat it
    params.delete("autocheckin")
    const cleanUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname
    window.history.replaceState(null, "", cleanUrl)

    if (isCheckedIn) return

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/study/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId: course.id }),
        })
        if (!cancelled && res.ok) {
          router.refresh()
        }
      } catch {
        // Silently ignore — the user can still tap the unlock button
      }
    })()
    return () => {
      cancelled = true
    }
  }, [course.id, isCheckedIn, router])

  const fetchServerChunk = useCallback(
    async (index: number): Promise<string | null> => {
      const cached = audioUrlsRef.current.get(index)
      if (cached) return cached

      const res = await fetch("/api/study/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id, chunkIndex: index }),
      })

      if (res.status === 401) {
        router.push(`/auth/sign-in?redirect=/study/${course.id}`)
        return null
      }
      if (!res.ok) return null

      const contentType = res.headers.get("content-type") || ""
      if (!contentType.includes("audio")) return null

      totalChunksRef.current = parseInt(res.headers.get("x-total-chunks") || "0", 10)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      audioUrlsRef.current.set(index, url)
      return url
    },
    [course.id, router]
  )

  const playServerChunk = useCallback(
    (index: number, url: string) => {
      const audio = new Audio(url)
      audioElRef.current = audio

      audio.onended = () => {
        if (serverTtsStoppedRef.current) return
        const next = index + 1
        if (next < totalChunksRef.current) {
          setSpeechState("loading")
          fetchServerChunk(next)
            .then((nextUrl) => {
              if (serverTtsStoppedRef.current) return
              if (nextUrl) {
                playServerChunk(next, nextUrl)
              } else {
                setSpeechState("idle")
              }
            })
            .catch(() => {
              if (!serverTtsStoppedRef.current) setSpeechState("idle")
            })
        } else {
          setSpeechState("idle")
        }
      }
      audio.onerror = () => {
        if (!serverTtsStoppedRef.current) setSpeechState("idle")
      }
      audio.play().catch(() => {
        if (!serverTtsStoppedRef.current) setSpeechState("idle")
      })
      setSpeechState("playing")

      // Prefetch the next chunk while this one plays
      const prefetchIdx = index + 1
      if (prefetchIdx < totalChunksRef.current && !audioUrlsRef.current.has(prefetchIdx)) {
        fetchServerChunk(prefetchIdx).catch(() => {})
      }
    },
    [fetchServerChunk]
  )

  const handleServerSpeak = useCallback(async () => {
    if (speechState === "playing") {
      audioElRef.current?.pause()
      setSpeechState("paused")
      return
    }

    if (speechState === "paused") {
      audioElRef.current?.play().catch(() => setSpeechState("idle"))
      setSpeechState("playing")
      return
    }

    // idle → start from the first chunk
    serverTtsStoppedRef.current = false
    setSpeechState("loading")
    try {
      const url = await fetchServerChunk(0)
      if (serverTtsStoppedRef.current) return
      if (!url) {
        setSpeechState("idle")
        alert("语音合成失败，请稍后重试")
        return
      }
      playServerChunk(0, url)
    } catch {
      if (!serverTtsStoppedRef.current) {
        setSpeechState("idle")
        alert("语音合成失败，请稍后重试")
      }
    }
  }, [speechState, fetchServerChunk, playServerChunk])

  const handleSpeak = useCallback(() => {
    if (!checkedIn) return

    if (useServerTts) {
      handleServerSpeak()
      return
    }

    const synth = window.speechSynthesis

    if (speechState === "playing") {
      synth.pause()
      setSpeechState("paused")
      return
    }

    if (speechState === "paused") {
      synth.resume()
      setSpeechState("playing")
      return
    }

    synth.cancel()

    const plainText = stripHtml(contentHtml)
    const utterance = new SpeechSynthesisUtterance(plainText)
    utterance.lang = "zh-CN"
    utterance.rate = 1.0
    utterance.pitch = 1.0

    const voices = synth.getVoices()
    const zhVoice = voices.find((v) => v.lang.startsWith("zh"))
    if (zhVoice) utterance.voice = zhVoice

    utterance.onend = () => setSpeechState("idle")
    utterance.onerror = () => setSpeechState("idle")

    utteranceRef.current = utterance
    synth.speak(utterance)
    setSpeechState("playing")
  }, [checkedIn, contentHtml, speechState, useServerTts, handleServerSpeak])

  const handleStop = useCallback(() => {
    if (useServerTts) {
      serverTtsStoppedRef.current = true
      if (audioElRef.current) {
        audioElRef.current.pause()
        audioElRef.current = null
      }
      setSpeechState("idle")
      return
    }

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setSpeechState("idle")
  }, [useServerTts])

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/study/${course.id}`
    const shareData = {
      title: `${course.title} - 空寂共学`,
      text: `我在空寂共学社区学习了《${course.title}》，一起来打卡吧！`,
      url,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
        return
      } catch (e) {
        if ((e as DOMException).name === "AbortError") return
      }
    }

    try {
      await navigator.clipboard.writeText(shareData.text + "\n" + url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = shareData.text + "\n" + url
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [course.id, course.title])

  const handleCheckin = async () => {
    setCheckinLoading(true)
    try {
      const res = await fetch("/api/study/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id }),
      })
      if (res.status === 401) {
        router.push(`/auth/sign-in?redirect=${encodeURIComponent(`/study/${course.id}?autocheckin=1`)}`)
        return
      }
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || "打卡失败")
      }
    } catch {
      alert("打卡失败，请重试")
    } finally {
      setCheckinLoading(false)
    }
  }

  const handleComment = async () => {
    if (!commentText.trim()) return
    setCommentLoading(true)
    try {
      const res = await fetch("/api/study/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id, content: commentText.trim() }),
      })
      if (res.status === 401) {
        router.push(`/auth/sign-in?redirect=/study/${course.id}`)
        return
      }
      if (res.ok) {
        const data = await res.json()
        setComments((prev) => [...prev, data.comment])
        setCommentText("")
      } else {
        const data = await res.json()
        alert(data.error || "评论失败")
      }
    } catch {
      alert("评论失败，请重试")
    } finally {
      setCommentLoading(false)
    }
  }

  const displayHtml = contentHtml

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Link href="/study" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          返回课程列表
        </Link>
        {checkedIn && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={handleShare}
              title="分享课程"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
            </Button>
            {(ttsSupported || useServerTts) && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={handleSpeak}
                  disabled={speechState === "loading"}
                  title={
                    speechState === "idle"
                      ? "朗读课程"
                      : speechState === "loading"
                        ? "正在合成语音..."
                        : speechState === "playing"
                          ? "暂停"
                          : "继续朗读"
                  }
                >
                  {speechState === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : speechState === "idle" ? (
                    <Volume2 className="h-4 w-4" />
                  ) : speechState === "playing" ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-amber-600" />
                  )}
                </Button>
                {speechState !== "idle" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={handleStop}
                    title="停止朗读"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
      {course.published_at && (
        <p className="text-sm text-muted-foreground mb-8">
          {new Date(course.published_at).toLocaleDateString("zh-CN")}
        </p>
      )}

      <div className="relative">
        <div
          className="prose prose-sm sm:prose-base max-w-none"
          dangerouslySetInnerHTML={{ __html: displayHtml }}
        />

        {!checkedIn && (
          <div className="relative mt-[-80px] pt-[80px]">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
            <div className="relative flex flex-col items-center py-12 gap-4">
              <Lock className="h-8 w-8 text-amber-600" />
              <p className="text-muted-foreground text-sm">打卡后解锁完整内容</p>
              <Button
                onClick={handleCheckin}
                disabled={checkinLoading}
                size="lg"
                className="bg-amber-600 hover:bg-amber-700"
              >
                📌 打卡解锁完整内容
              </Button>
            </div>
          </div>
        )}
      </div>

      {checkedIn && (
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">
            全部评论 ({comments.length} 条)
          </h2>
          {comments.length > 0 ? (
            <div className="space-y-4 mb-6">
              {comments.map((comment) => (
                <Card key={comment.id} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {comment.user.username?.charAt(0) || "?"}
                    </div>
                    <span className="font-medium text-sm">{comment.user.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                  <p className="text-sm pl-10">{comment.content}</p>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground mb-6">暂无评论，分享你的学习心得吧</p>
          )}

          <div className="sticky bottom-0 bg-background border-t pt-4 pb-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value.slice(0, 1000))}
                placeholder="发表学习心得..."
                className="flex-1 px-4 py-2 border rounded-lg text-sm"
                maxLength={1000}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && commentText.trim()) {
                    e.preventDefault()
                    handleComment()
                  }
                }}
              />
              <Button
                onClick={handleComment}
                disabled={!commentText.trim() || commentLoading}
                size="sm"
              >
                发表
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {commentText.length}/1000
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
