'use client'

import { useState, useEffect } from 'react'
import { vaccinationPlanApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Calendar, ChevronRight } from 'lucide-react'
import { differenceInDays, parseISO } from 'date-fns'

interface UpcomingVaccination {
  vaccine_name: string
  next_due_date: string
}

interface UpcomingVaccinationsCardProps {
  petId: number | string
  onBookAppointment?: () => void
}

export function UpcomingVaccinationsCard({
  petId,
  onBookAppointment,
}: UpcomingVaccinationsCardProps) {
  const [upcoming, setUpcoming] = useState<UpcomingVaccination[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUpcoming()
  }, [petId])

  const loadUpcoming = async () => {
    try {
      setLoading(true)
      const data = await vaccinationPlanApi.getUpcoming(petId, 30)
      setUpcoming(
        (data || [])
          .sort(
            (a, b) =>
              differenceInDays(parseISO(a.next_due_date), parseISO(b.next_due_date))
          )
          .slice(0, 5)
      )
    } catch (err) {
      console.error('Failed to load upcoming vaccinations', err)
      setUpcoming([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (upcoming.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Upcoming Vaccinations</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          All vaccinations are up to date!
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Upcoming Vaccinations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcoming.map((vac, idx) => {
          const daysUntilDue = differenceInDays(parseISO(vac.next_due_date), new Date())
          const isUrgent = daysUntilDue <= 7

          return (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-sm">{vac.vaccine_name}</p>
                <p className="text-xs text-muted-foreground">
                  {daysUntilDue} days until due
                </p>
              </div>
              {isUrgent && (
                <Badge className="bg-red-100 text-red-700" variant="secondary">
                  Urgent
                </Badge>
              )}
            </div>
          )
        })}

        <Button
          onClick={onBookAppointment}
          className="w-full mt-2"
          variant="default"
          size="sm"
        >
          <Calendar className="mr-2 h-4 w-4" />
          Book Vaccination Appointment
          <ChevronRight className="ml-auto h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
