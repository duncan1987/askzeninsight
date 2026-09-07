"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, Trash2, Users, ChevronRight } from "lucide-react"
import { useAdminAuth } from "@/components/admin/admin-auth-provider"
import Link from "next/link"

interface UserGroup {
  id: string
  name: string
  description: string
  created_at: string
  member_count: number
}

export default function AdminGroupsPage() {
  const { adminKey } = useAdminAuth()
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [creating, setCreating] = useState(false)

  const fetchGroups = async () => {
    if (!adminKey) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/study/groups?with_members=true", {
        headers: { "x-admin-key": adminKey },
      })
      if (res.ok) {
        const data = await res.json()
        setGroups(data.groups || [])
      }
    } catch {
      console.error("Failed to fetch groups")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!adminKey || !newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/admin/study/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() }),
      })
      if (res.ok) {
        setNewName("")
        setNewDesc("")
        setShowCreate(false)
        fetchGroups()
      } else {
        const data = await res.json()
        alert(data.error || "创建失败")
      }
    } catch {
      alert("创建失败")
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (groupId: string, name: string) => {
    if (!adminKey) return
    if (!confirm(`确认删除用户组"${name}"？成员将被移除但不删除用户。`)) return
    try {
      const res = await fetch(`/api/admin/study/groups/${groupId}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      })
      if (res.ok) {
        fetchGroups()
      } else {
        alert("删除失败")
      }
    } catch {
      alert("删除失败")
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [adminKey])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">用户组管理</h1>
          <p className="text-muted-foreground">将用户分组管理，便于统计和维护</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          新建用户组
        </Button>
      </div>

      {showCreate && (
        <Card className="p-6 mb-6">
          <h3 className="font-semibold mb-4">新建用户组</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="用户组名称"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="描述（可选）"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={creating || !newName.trim()} size="sm">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "创建"}
              </Button>
              <Button onClick={() => { setShowCreate(false); setNewName(""); setNewDesc("") }} variant="outline" size="sm">
                取消
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">暂无用户组，点击右上角创建</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <Card key={group.id} className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{group.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{group.member_count} 名成员</span>
                      {group.description && <span>· {group.description}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/study/groups/${group.id}`}>
                    <Button variant="outline" size="sm">
                      管理成员
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                    onClick={() => handleDelete(group.id, group.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
