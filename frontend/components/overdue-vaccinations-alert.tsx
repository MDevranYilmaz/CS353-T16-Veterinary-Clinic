'use client'

import { useState, useEffect } from 'react'
import { vaccinationPlanApi } from '@/lib/api'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle } from 'lucide-react'
import { differenceInDays, parseISO } from 'date-fns'

interface OverdueVaccination {
  vaccine_name: string
  next_due_date: string
}

interface OverdueVaccinationsAlertProps {
  petId: number | string
  onViewSchedule?: () => void
  onScheduleNow?: () => void
}

export function OverdueVaccinationsAlert({
  petId,
  onViewSchedule,
  onScheduleNow,
}: OverdueVaccinationsAlertProps) {
  const [overdue, setOverdue] = useState<OverdueVaccination[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOverdue()
  }, [petId])

  const loadOverdue = async () => {
    try {
      setLoading(true)
      const data = await vaccinationPlanApi.getOverdue(petId)
      setOverdue(data || [])
    } catch (err) {
      console.error('Failed to load overdue vaccinations', err)
      setOverdue([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  if (overdue.length === 0) {
    return null
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        {overdue.length} Overdue Vaccination{overdue.length !== 1 ? 's' : ''}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-2">
          {overdue.map((vac, idx) => {
            const daysOverdue = Math.abs(
              differenceInDays(parseISO(vac.next_due_date), new Date())
            )
            return (
              <div key={idx} className="text-sm">
                • <span className="font-medium">{vac.vaccine_name}</span> -{' '}
                <span>{daysOverdue} days overdue</span>
              </div>
            )
          })}

          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={onViewSchedule}
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              View Schedule
            </Button>
            <Button
              size="sm"
              onClick={onScheduleNow}
              className="bg-red-600 hover:bg-red-700"
            >
              Schedule Now
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}
