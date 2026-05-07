'use client'

import { useState, useEffect } from 'react'
import { petApi } from '@/lib/api'
import type { Pet, MedicalRecord } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, FileText, Calendar, Syringe } from 'lucide-react'

interface OwnerPetRecordsProps {
  pet: Pet | null
  onBack: () => void
  onBookAppointment: () => void
}

export function OwnerPetRecords({ pet, onBack, onBookAppointment }: OwnerPetRecordsProps) {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!pet) return
    setLoading(true)
    petApi.medicalHistory(pet.id)
      .then(setRecords)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [pet?.id])

  if (!pet) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />Back to My Pets
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{pet.name}</h1>
          <p className="text-muted-foreground">{pet.breed} · {pet.age} years old</p>
        </div>
        <Button onClick={onBookAppointment}>
          <Calendar className="w-4 h-4 mr-2" />Book Appointment
        </Button>
      </div>

      {pet.allergies.length > 0 && (
        <Card className="border-destructive/30">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm font-medium text-destructive mb-2">Allergies</p>
            <div className="flex flex-wrap gap-1">
              {pet.allergies.map((a, i) => (
                <Badge key={i} variant="outline" className="text-xs border-destructive/30 text-destructive">{a}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-primary" />
            Medical History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Syringe className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No medical records yet</p>
              <p className="text-sm mt-1">Records will appear here after vet visits</p>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((r) => (
                <div key={r.id} className="p-4 rounded-lg border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{r.diagnosis}</span>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />{r.date}
                    </span>
                  </div>
                  {r.treatment && (
                    <p className="text-sm text-muted-foreground">Treatment: {r.treatment}</p>
                  )}
                  {r.notes && (
                    <p className="text-sm text-muted-foreground">Notes: {r.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
