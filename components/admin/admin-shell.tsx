"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AdminAuthProvider, useAdminAuth } from "./admin-auth-provider"
import { AdminSidebar } from "./sidebar"

function AdminLoginGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, login } = useAdminAuth()
  const [key, setKey] = useState("")

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 p-6 bg-background overflow-auto">
          {children}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-8">
      <Card className="p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">管理员认证</h2>
        <p className="text-sm text-gray-600 mb-4">
          请输入管理员密钥以访问后台管理。
        </p>
        <input
          type="password"
          placeholder="输入管理员密钥"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
          onKeyDown={(e) => {
            if (e.key === "Enter" && key) login(key)
          }}
        />
        <Button onClick={() => { if (key) login(key) }} disabled={!key} className="w-full">
          认证
        </Button>
      </Card>
    </div>
  )
}

import type { ReactNode } from "react"

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminLoginGate>{children}</AdminLoginGate>
    </AdminAuthProvider>
  )
}
