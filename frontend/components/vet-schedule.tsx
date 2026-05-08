'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { appointmentApi } from '@/lib/api'
import type { Appointment } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Dog,
  Cat,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function toDateStr(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-accent/10 text-accent border-0',
  'in-progress': 'bg-warning/10 text-warning-foreground border-0',
  completed: 'bg-primary/10 text-primary border-0',
  cancelled: 'bg-muted text-muted-foreground border-0',
}

export function VetSchedule({ onViewRecords }: { onViewRecords?: (petId: string) => void } = {}) {
  const { user } = useAuth()
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()))
  const [schedule, setSchedule] = useState<Record<string, Appointment[]>>({})
  const [loading, setLoading] = useState(false)

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  useEffect(() => {
    if (!user) return
    setLoading(true)
    const dateStrs = weekDates.map(toDateStr)
    Promise.all(dateStrs.map((date) => appointmentApi.listByVet(user.userId, date)))
      .then((results) => {
        const sched: Record<string, Appointment[]> = {}
        dateStrs.forEach((date, i) => {
          sched[date] = results[i]
        })
        setSchedule(sched)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user, weekStart])

  // Reload schedule (used by event listener)
  const reloadSchedule = async () => {
    if (!user) return
    setLoading(true)
    try {
      const dateStrs = weekDates.map(toDateStr)
      const results = await Promise.all(dateStrs.map((date) => appointmentApi.listByVet(user.userId, date)))
      const sched: Record<string, Appointment[]> = {}
      dateStrs.forEach((date, i) => {
        sched[date] = results[i]
      })
      setSchedule(sched)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handler = () => reloadSchedule()
    window.addEventListener('appointments:updated', handler)
    return () => window.removeEventListener('appointments:updated', handler)
  }, [user, weekStart])

  const prevWeek = () => {
    const prev = new Date(weekStart)
    prev.setDate(prev.getDate() - 7)
    setWeekStart(prev)
  }

  const nextWeek = () => {
    const next = new Date(weekStart)
    next.setDate(next.getDate() + 7)
    setWeekStart(next)
  }

  const weekEnd = weekDates[6]
  const weekLabel = `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  const totalThisWeek = Object.values(schedule).reduce((sum, arr) => sum + arr.length, 0)
  const todayStr = toDateStr(new Date())

  return (
    <div className="space-y-6">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Schedule</h1>
          <p className="text-muted-foreground text-sm">
            {totalThisWeek} appointment{totalThisWeek !== 1 ? 's' : ''} this week
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevWeek} disabled={loading}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-muted/30 text-sm font-medium">
            <Calendar className="w-4 h-4 text-primary" />
            {weekLabel}
          </div>
          <Button variant="outline" size="icon" onClick={nextWeek} disabled={loading}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {weekDates.map((date, i) => {
            const dateStr = toDateStr(date)
            const dayAppts = schedule[dateStr] ?? []
            const isToday = dateStr === todayStr
            const isPast = date < new Date(todayStr)

            return (
              <Card
                key={dateStr}
                className={cn(
                  'transition-colors',
                  isToday && 'border-primary/40 bg-primary/5',
                  isPast && !isToday && 'opacity-70'
                )}
              >
                <CardHeader className="py-3 px-5">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn('font-semibold', isToday && 'text-primary')}>
                        {DAY_NAMES[i]}
                      </span>
                      <span className="text-muted-foreground font-normal">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      {isToday && (
                        <Badge className="bg-primary/10 text-primary border-0 text-xs">Today</Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {dayAppts.length} appt{dayAppts.length !== 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                </CardHeader>

                {dayAppts.length > 0 && (
                  <CardContent className="pt-0 pb-4 px-5 space-y-2">
                    {dayAppts
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((apt) => (
                        <div
                          key={apt.id}
                          onClick={() => onViewRecords?.(apt.petId)}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-lg border cursor-pointer',
                            apt.status === 'completed' && 'opacity-60',
                            apt.status === 'cancelled' && 'opacity-40 line-through-text',
                          )}
                        >
                          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted shrink-0">
                            {apt.petSpecies === 'dog' ? (
                              <Dog className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <Cat className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{apt.petName}</span>
                              <Badge
                                className={cn('text-xs capitalize shrink-0', statusColors[apt.status])}
                              >
                                {apt.status.replace('-', ' ')}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {apt.time}
                              </span>
                              <span>{apt.ownerName}</span>
                              <Badge variant="outline" className="text-xs capitalize py-0">
                                {apt.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
