"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, FileText, Eye } from "lucide-react"
import { useAdminAuth } from "@/components/admin/admin-auth-provider"

interface Course {
  id: string
  title: string
  is_published: boolean
  sort_order: number
  comment_count: number
  checkin_count: number
  published_at: string | null
  created_at: string
}

export default function AdminCoursesPage() {
  const { adminKey } = useAdminAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCourses = async () => {
    if (!adminKey) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/study/courses", {
        headers: { "x-admin-key": adminKey },
      })
      if (res.ok) {
        const data = await res.json()
        setCourses(data.courses || [])
      }
    } catch (e) {
      console.error("Failed to fetch courses:", e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此课程？此操作不可撤销。")) return
    try {
      const res = await fetch(`/api/admin/study/courses/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      })
      if (res.ok) fetchCourses()
      else alert("删除失败")
    } catch {
      alert("删除失败")
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [adminKey])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">课程管理</h1>
          <p className="text-muted-foreground">创建、编辑和管理共学课程</p>
        </div>
        <Link href="/admin/study/courses/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新建课程
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">还没有课程，点击上方按钮创建第一课</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <Card key={course.id} className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium">{course.title}</h3>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      course.is_published
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {course.is_published ? "已发布" : "草稿"}
                  </span>
                </div>
                <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                  <span>排序: {course.sort_order}</span>
                  <span>打卡: {course.checkin_count}</span>
                  <span>评论: {course.comment_count}</span>
                  {course.published_at && (
                    <span>发布于: {new Date(course.published_at).toLocaleDateString("zh-CN")}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/study/courses/${course.id}/edit`}>
                  <Button variant="outline" size="sm">
                    编辑
                  </Button>
                </Link>
                <Link href={`/study/${course.id}`} target="_blank">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/admin/blog/new?fromCourseId=${course.id}`}>
                  <Button variant="outline" size="sm">
                    发布为博客
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleDelete(course.id)}
                >
                  删除
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
