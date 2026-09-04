"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CheckinCalendarProps {
  userId?: string
}

export function CheckinCalendar({ userId }: CheckinCalendarProps) {
  const [checkins, setCheckins] = useState<Array<{ created_at: string }>>([])
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })

  useEffect(() => {
    if (!userId) return
    fetch(`/api/study/checkins?month=${currentMonth}`)
      .then((r) => r.json())
      .then((data) => {
        setCheckins(data.checkins || [])
      })
      .catch(console.error)
  }, [userId, currentMonth])

  const checkinDays = new Set<string>()
  checkins.forEach((c) => {
    const date = new Date(c.created_at)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    checkinDays.add(key)
  })

  const [year, month] = currentMonth.split("-").map(Number)
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const startWeekday = (firstDay.getDay() + 6) % 7
  const totalDays = lastDay.getDate()

  const weekdays = ["一", "二", "三", "四", "五", "六", "日"]

  const days: Array<{ date: number | null; isCheckin: boolean }> = []
  for (let i = 0; i < startWeekday; i++) {
    days.push({ date: null, isCheckin: false })
  }
  for (let d = 1; d <= totalDays; d++) {
    const key = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    days.push({ date: d, isCheckin: checkinDays.has(key) })
  }

  const prevMonth = () => {
    const d = new Date(year, month - 2, 1)
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
  }

  const nextMonth = () => {
    const d = new Date(year, month, 1)
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
  }

  const checkinCount = checkinDays.size

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">📅 我的打卡</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="text-sm text-muted-foreground hover:text-foreground">
            ◀
          </button>
          <span className="font-medium">
            {year}年{month}月
          </span>
          <button onClick={nextMonth} className="text-sm text-muted-foreground hover:text-foreground">
            ▶
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {weekdays.map((w) => (
            <div key={w} className="text-muted-foreground py-1">
              {w}
            </div>
          ))}
          {days.map((day, i) => (
            <div
              key={i}
              className={`py-1 text-sm rounded ${
                day.date === null
                  ? ""
                  : day.isCheckin
                  ? "bg-green-100 text-green-700 font-bold rounded-full"
                  : "text-muted-foreground"
              }`}
            >
              {day.date !== null ? day.date : ""}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          本月打卡 {checkinCount} 天
        </p>
      </CardContent>
    </Card>
  )
}
