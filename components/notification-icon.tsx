"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

const READ_NOTIFICATIONS_KEY = 'read_notifications'

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
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set())
  const [showAll, setShowAll] = useState(false)

  // Load read notification IDs from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(READ_NOTIFICATIONS_KEY)
    if (stored) {
      try {
        const ids = JSON.parse(stored) as string[]
        setReadNotificationIds(new Set(ids))
      } catch (e) {
        console.error('Failed to parse read notifications:', e)
      }
    }
  }, [])

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications()
    // Poll for new notifications every 2 minutes
    const interval = setInterval(fetchNotifications, 120000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])

        // Count unread notifications (active AND not read by user)
        const activeCount = (data.notifications || []).filter(
          (n: Notification) => n.is_active && !readNotificationIds.has(n.id)
        ).length
        setUnreadCount(activeCount)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const dismissAll = () => {
    // Mark all current notifications as read
    const currentIds = notifications.map(n => n.id)
    const newReadIds = new Set([...readNotificationIds, ...currentIds])

    // Update localStorage
    localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify([...newReadIds]))

    // Update state - don't show all notifications after dismiss
    setReadNotificationIds(newReadIds)
    setShowAll(false)
    setUnreadCount(0)
    setOpen(false)
  }

  // Filter notifications: show unread by default, or all if showAll is true
  const filteredNotifications = showAll
    ? notifications
    : notifications.filter(n => !readNotificationIds.has(n.id))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className={cn(
            "h-5 w-5 transition-all duration-200",
            unreadCount > 0 && "text-amber-500 dark:text-amber-400"
          )} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 sm:w-96 p-0">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            <div className="flex gap-2">
              {!showAll && notifications.length > filteredNotifications.length && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => setShowAll(true)}
                >
                  View all
                </Button>
              )}
              {showAll && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => setShowAll(false)}
                >
                  View unread
                </Button>
              )}
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={dismissAll}
                >
                  Dismiss all
                </Button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <p className="text-sm">
                {showAll ? "No notifications" : "No unread notifications"}
              </p>
              {!showAll && notifications.length > 0 && (
                <Button
                  variant="link"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowAll(true)}
                >
                  View all notifications
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea className="h-80">
              <div className="space-y-3 px-4 pb-4">
                {filteredNotifications.map((notification) => (
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
                          <p className="text-xs text-muted-foreground mt-1">
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
