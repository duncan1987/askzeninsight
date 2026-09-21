"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

const LAST_SEEN_KEY = 'notifications_last_seen_at'

interface Notification {
  id: string
  title: string
  content: string | null
  type: 'info' | 'warning' | 'success' | 'announcement'
  is_active: boolean
  created_at: string
  expires_at: string | null
}

export function NotificationIcon() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [hasNew, setHasNew] = useState(false)
  const [open, setOpen] = useState(false)
  const lastSeenAtRef = useRef<string | null>(null)
  const t = useTranslations('notification')

  useEffect(() => {
    lastSeenAtRef.current = localStorage.getItem(LAST_SEEN_KEY)
  }, [])

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications')
      if (!response.ok) return
      const data = await response.json()
      const list: Notification[] = data.notifications || []
      setNotifications(list)

      // Red dot shown when any active notification is newer than the
      // last time the user opened the popover. Opening the popover marks
      // everything currently published as seen — no per-id bookkeeping.
      const lastSeen = lastSeenAtRef.current
      const hasUnseen = list.some((n) => n.is_active && (!lastSeen || new Date(n.created_at) > new Date(lastSeen)))
      setHasNew(hasUnseen)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 120000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      // Mark all current notifications as seen
      const now = new Date().toISOString()
      lastSeenAtRef.current = now
      localStorage.setItem(LAST_SEEN_KEY, now)
      setHasNew(false)
    }
    setOpen(nextOpen)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={t('notifications')}>
          <Bell className={cn(
            "h-5 w-5 transition-all duration-200",
            hasNew && "text-amber-500 dark:text-amber-400"
          )} />
          {hasNew && (
            <span className="absolute top-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-red-500" aria-hidden="true" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 sm:w-96 p-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="font-semibold text-foreground">{t('notifications')}</h3>
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <p className="text-sm">{t('noNotifications')}</p>
            </div>
          ) : (
            <ScrollArea className="h-80">
              <div className="space-y-3 px-4 pb-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-3 rounded-lg border transition-colors",
                      !notification.is_active
                        ? "bg-muted/50 border-border opacity-60"
                        : "bg-background border-border hover:bg-muted/50",
                      notification.type === 'announcement' && "border-amber-500/50 bg-amber-500/5",
                      notification.type === 'warning' && "border-red-500/50 bg-red-500/5",
                      notification.type === 'success' && "border-green-500/50 bg-green-500/5",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "shrink-0 mt-0.5",
                          notification.type === 'announcement' && "text-amber-600",
                          notification.type === 'warning' && "text-red-600",
                          notification.type === 'success' && "text-green-600",
                          notification.type === 'info' && "text-blue-600",
                        )}
                      >
                        {notification.type === 'announcement' && '📢'}
                        {notification.type === 'warning' && '⚠️'}
                        {notification.type === 'success' && '✅'}
                        {notification.type === 'info' && 'ℹ️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {notification.title}
                        </p>
                        {notification.content && (
                          <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                            {notification.content}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
