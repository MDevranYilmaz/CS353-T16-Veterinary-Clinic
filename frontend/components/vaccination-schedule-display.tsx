'use client'

import { useState, useEffect } from 'react'
import { vaccinationPlanApi } from '@/lib/api'
import { PetVaccinationScheduleItem } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'

const statusColors: Record<string, { bg: string; text: string; badge: string }> = {
  Administered: { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100' },
  Overdue: { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100' },
  'Due Soon': { bg: 'bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-100' },
  Upcoming: { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100' },
  'Not Applicable': { bg: 'bg-gray-50', text: 'text-gray-700', badge: 'bg-gray-100' },
}

interface VaccinationScheduleDisplayProps {
  petId: number | string
}

export function VaccinationScheduleDisplay({ petId }: VaccinationScheduleDisplayProps) {
  const [schedule, setSchedule] = useState<PetVaccinationScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSchedule()
  }, [petId])

  const loadSchedule = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await vaccinationPlanApi.getPetSchedule(petId)
      setSchedule(data || [])
    } catch (err) {
      setError('Failed to load vaccination schedule')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive bg-destructive/10">
        <CardContent className="pt-6">{error}</CardContent>
      </Card>
    )
  }

  if (schedule.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          No vaccination schedule found for this pet
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vaccination Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2 font-semibold">Vaccine</th>
                <th className="text-left py-2 px-2 font-semibold">Type</th>
                <th className="text-left py-2 px-2 font-semibold">Recommended Age</th>
                <th className="text-left py-2 px-2 font-semibold">Last Given</th>
                <th className="text-left py-2 px-2 font-semibold">Next Due</th>
                <th className="text-left py-2 px-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((item, idx) => {
                const colors = statusColors[item.vaccination_status] || statusColors['Upcoming']
                return (
                  <tr key={idx} className={`border-b ${colors.bg} hover:opacity-75 transition`}>
                    <td className="py-3 px-2 font-medium">{item.vaccine_name}</td>
                    <td className="py-3 px-2">
                      <Badge variant="outline">{item.vac_type}</Badge>
                    </td>
                    <td className="py-3 px-2 text-xs">
                      {item.age_weeks} weeks
                      {item.sequence_number && ` (Dose ${item.sequence_number})`}
                    </td>
                    <td className="py-3 px-2">
                      {item.last_admin_date
                        ? format(new Date(item.last_admin_date), 'MMM dd, yyyy')
                        : '—'}
                    </td>
                    <td className="py-3 px-2">
                      {item.next_due_date
                        ? format(new Date(item.next_due_date), 'MMM dd, yyyy')
                        : '—'}
                    </td>
                    <td className="py-3 px-2">
                      <Badge className={colors.badge} variant="secondary">
                        {item.vaccination_status}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {schedule.some((item) => item.notes) && (
          <div className="mt-4 pt-4 border-t space-y-2">
            <h4 className="font-semibold">Notes</h4>
            {schedule
              .filter((item) => item.notes)
              .map((item, idx) => (
                <div key={idx} className="text-sm text-muted-foreground">
                  <span className="font-medium">{item.vaccine_name}:</span> {item.notes}
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
