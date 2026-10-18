import { redirect } from "next/navigation"
import { AdminShell } from "@/components/admin/admin-shell"
import { isAdminGroupUser } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const allowed = await isAdminGroupUser()
  if (!allowed) {
    redirect("/")
  }

  return <AdminShell>{children}</AdminShell>
}
