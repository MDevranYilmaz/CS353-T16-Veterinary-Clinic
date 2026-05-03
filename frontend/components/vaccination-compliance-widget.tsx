'use client'

import { useState, useEffect } from 'react'
import { vaccinationPlanApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface VaccinationComplianceWidgetProps {
  petId: number | string
}

export function VaccinationComplianceWidget({ petId }: VaccinationComplianceWidgetProps) {
  const [schedule, setSchedule] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [compliance, setCompliance] = useState(0)

  useEffect(() => {
    loadSchedule()
  }, [petId])

  const loadSchedule = async () => {
    try {
      setLoading(true)
      const data = await vaccinationPlanApi.getPetSchedule(petId)
      setSchedule(data || [])

      if (data && data.length > 0) {
        const administered = data.filter(
          (v) => v.vaccination_status === 'Administered'
        ).length
        const compliancePercent = Math.round((administered / data.length) * 100)
        setCompliance(compliancePercent)
      }
    } catch (err) {
      console.error('Failed to load vaccination schedule', err)
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

  const administered = schedule.filter(
    (v) => v.vaccination_status === 'Administered'
  ).length
  const total = schedule.length

  const getComplianceColor = () => {
    if (compliance >= 80) return 'bg-green-500'
    if (compliance >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Vaccination Compliance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">{compliance}%</span>
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getComplianceColor()} transition-all`}
              style={{ width: `${compliance}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {administered} of {total} vaccines administered
        </p>
      </CardContent>
    </Card>
  )
}
