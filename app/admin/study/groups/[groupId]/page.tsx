"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, UserPlus, X, ArrowLeft } from "lucide-react"
import { useAdminAuth } from "@/components/admin/admin-auth-provider"
import Link from "next/link"

interface GroupMember {
  id: string
  username: string
  full_name: string
}

interface GroupInfo {
  id: string
  name: string
  description: string
  members: GroupMember[]
}

interface ApprovedUser {
  id: string
  username: string
  full_name: string
}

export default function GroupDetailPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { adminKey } = useAdminAuth()
  const [groupId, setGroupId] = useState<string>("")
  const [group, setGroup] = useState<GroupInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [allUsers, setAllUsers] = useState<ApprovedUser[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    params.then((p) => setGroupId(p.groupId))
  }, [params])

  useEffect(() => {
    if (!adminKey || !groupId) return
    setLoading(true)
    fetch(`/api/admin/study/groups/${groupId}`, {
      headers: { "x-admin-key": adminKey },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.group) setGroup(data.group)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [adminKey, groupId])

  const loadAllUsers = async () => {
    if (!adminKey) return
    try {
      const res = await fetch("/api/admin/user-review?status=approved&limit=200", {
        headers: { "x-admin-key": adminKey },
      })
      if (res.ok) {
        const data = await res.json()
        setAllUsers(data.users || [])
      }
    } catch {
      console.error("Failed to load users")
    }
  }

  const handleAddMembers = async () => {
    if (!adminKey || selectedUsers.size === 0) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/study/groups/${groupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ addMembers: Array.from(selectedUsers) }),
      })
      if (res.ok) {
        setSelectedUsers(new Set())
        setShowAdd(false)
        const detail = await fetch(`/api/admin/study/groups/${groupId}`, {
          headers: { "x-admin-key": adminKey },
        })
        const data = await detail.json()
        if (data.group) setGroup(data.group)
      }
    } catch {
      alert("添加失败")
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveMember = async (userId: string, username: string) => {
    if (!adminKey) return
    if (!confirm(`确认将"${username}"移出该组？`)) return
    try {
      const res = await fetch(`/api/admin/study/groups/${groupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ removeMembers: [userId] }),
      })
      if (res.ok) {
        const detail = await fetch(`/api/admin/study/groups/${groupId}`, {
          headers: { "x-admin-key": adminKey },
        })
        const data = await detail.json()
        if (data.group) setGroup(data.group)
      }
    } catch {
      alert("移除失败")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!group) return <p>用户组不存在</p>

  const memberIds = new Set(group.members.map((m) => m.id))
  const availableUsers = allUsers.filter((u) => !memberIds.has(u.id))

  return (
    <div>
      <Link href="/admin/study/groups" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        返回用户组列表
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">{group.name}</h1>
          <p className="text-muted-foreground">
            {group.description || "无描述"} · {group.members.length} 名成员
          </p>
        </div>
        <Button
          onClick={() => {
            if (allUsers.length === 0) loadAllUsers()
            setShowAdd(true)
          }}
          size="sm"
        >
          <UserPlus className="h-4 w-4 mr-1" />
          添加成员
        </Button>
      </div>

      {showAdd && (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">添加成员</h3>
            <Button onClick={() => setShowAdd(false)} variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
          {allUsers.length === 0 ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : availableUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">所有已批准用户都已在组中</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableUsers.map((user) => (
                <label key={user.id} className="flex items-center gap-2 px-2 py-1 hover:bg-muted rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user.id)}
                    onChange={(e) => {
                      const next = new Set(selectedUsers)
                      if (e.target.checked) next.add(user.id)
                      else next.delete(user.id)
                      setSelectedUsers(next)
                    }}
                  />
                  <span className="text-sm">{user.username}</span>
                  <span className="text-xs text-muted-foreground">{user.full_name}</span>
                </label>
              ))}
            </div>
          )}
          {selectedUsers.size > 0 && (
            <div className="mt-4">
              <Button onClick={handleAddMembers} disabled={saving} size="sm">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : `添加 ${selectedUsers.size} 人`}
              </Button>
            </div>
          )}
        </Card>
      )}

      {group.members.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">暂无成员</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {group.members.map((member) => (
            <Card key={member.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                  {member.username?.charAt(0) || "?"}
                </div>
                <div>
                  <span className="font-medium text-sm">{member.username}</span>
                  <span className="text-xs text-muted-foreground ml-2">{member.full_name}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700"
                onClick={() => handleRemoveMember(member.id, member.username)}
              >
                移除
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
