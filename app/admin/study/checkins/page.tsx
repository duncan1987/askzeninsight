"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useAdminAuth } from "@/components/admin/admin-auth-provider"

interface CheckinStats {
  courses: { id: string; title: string }[]
  users: { id: string; username: string }[]
  matrix: Record<string, Record<string, { checked_in: boolean; has_comment: boolean }>>
  totalUsers: number
  totalCourses: number
  avgRate: string
}

interface Group {
  id: string
  name: string
}

export default function AdminCheckinsPage() {
  const { adminKey } = useAdminAuth()
  const [stats, setStats] = useState<CheckinStats | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(
    (groupId: string) => {
      if (!adminKey) return
      setLoading(true)
      const url = groupId
        ? `/api/admin/study/checkins?group=${encodeURIComponent(groupId)}`
        : "/api/admin/study/checkins"
      fetch(url, {
        headers: { "x-admin-key": adminKey },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.stats) setStats(data.stats)
          if (data.groups) setGroups(data.groups)
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    },
    [adminKey]
  )

  useEffect(() => {
    if (adminKey) fetchStats("")
  }, [adminKey, fetchStats])

  const handleGroupChange = (groupId: string) => {
    setSelectedGroup(groupId)
    fetchStats(groupId)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">打卡统计</h1>
      <p className="text-muted-foreground mb-6">学员×课程打卡情况</p>

      <div className="mb-6 flex items-center gap-3">
        <label htmlFor="group-filter" className="text-sm font-medium">
          用户组筛选
        </label>
        <select
          id="group-filter"
          value={selectedGroup}
          onChange={(e) => handleGroupChange(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm bg-background min-w-[160px]"
        >
          <option value="">全部用户</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        {selectedGroup && (
          <button
            onClick={() => handleGroupChange("")}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            清除筛选
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : !stats ? null : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <div className="text-sm text-muted-foreground">学员数</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.totalCourses}</div>
                <div className="text-sm text-muted-foreground">课程数</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.avgRate}</div>
                <div className="text-sm text-muted-foreground">平均打卡率</div>
              </CardContent>
            </Card>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">学员</th>
                  {stats.courses.map((c) => (
                    <th key={c.id} className="p-2 font-medium text-center min-w-[80px]">
                      <span className="truncate block max-w-[80px]" title={c.title}>
                        {c.title.slice(0, 6)}...
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{user.username}</td>
                    {stats.courses.map((course) => {
                      const cell = stats.matrix[user.id]?.[course.id]
                      return (
                        <td key={course.id} className="p-2 text-center">
                          {!cell ? (
                            <span className="text-muted-foreground">-</span>
                          ) : cell.checked_in && cell.has_comment ? (
                            <span className="text-green-600 font-bold">✓</span>
                          ) : cell.checked_in ? (
                            <span className="text-amber-600">✓</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
            <span>
              <span className="text-green-600 font-bold">✓</span> 打卡+评论
            </span>
            <span>
              <span className="text-amber-600">✓</span> 仅打卡
            </span>
            <span>- 未打卡</span>
          </div>
        </>
      )}
    </div>
  )
}
