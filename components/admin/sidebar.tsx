"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAdminAuth } from "./admin-auth-provider"
import {
  LayoutDashboard,
  Users,
  DollarSign,
  BookOpen,
  MessageSquare,
  BarChart3,
  FileText,
  LogOut,
  UsersRound,
} from "lucide-react"
import { cn } from "@/lib/utils"

const menuItems = [
  { href: "/admin", label: "概览", icon: LayoutDashboard },
  { href: "/admin/users", label: "用户审核", icon: Users },
  { href: "/admin/refunds", label: "退款审核", icon: DollarSign },
  { href: "/admin/study/courses", label: "课程管理", icon: BookOpen },
  { href: "/admin/study/comments", label: "评论审核", icon: MessageSquare },
  { href: "/admin/study/checkins", label: "打卡统计", icon: BarChart3 },
  { href: "/admin/study/groups", label: "用户组管理", icon: UsersRound },
  { href: "/admin/blog", label: "博客管理", icon: FileText },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { logout } = useAdminAuth()

  return (
    <aside className="w-60 min-h-screen bg-muted/50 border-r flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">管理后台</h2>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {menuItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-2 border-t">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted w-full transition-colors"
        >
          <LogOut className="h-4 w-4" />
          退出登录
        </button>
      </div>
    </aside>
  )
}
