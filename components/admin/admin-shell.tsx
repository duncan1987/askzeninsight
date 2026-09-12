import type { ReactNode } from "react"
import { AdminAuthProvider } from "./admin-auth-provider"
import { AdminSidebar } from "./sidebar"

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AdminAuthProvider>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 p-6 bg-background overflow-auto">
          {children}
        </main>
      </div>
    </AdminAuthProvider>
  )
}
