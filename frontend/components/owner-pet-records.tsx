'use client'

import { useState, useEffect } from 'react'
import { petApi } from '@/lib/api'
import type { Pet, MedicalRecord } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { AppointmentWizard } from '@/components/appointment-wizard'
import { ArrowLeft, Loader2, FileText, Calendar, Syringe } from 'lucide-react'

interface OwnerPetRecordsProps {
  pet: Pet | null
  onBack: () => void
  onBookAppointment: () => void
}

export function OwnerPetRecords({ pet, onBack, onBookAppointment }: OwnerPetRecordsProps) {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [vaccinations, setVaccinations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [vacWizard, setVacWizard] = useState<{ open: boolean; vaccineName: string; vetId: string; branchId: string } | null>(null)

  useEffect(() => {
    if (!pet) return
    setLoading(true)
    Promise.all([
      petApi.medicalHistory(pet.id),
      petApi.vaccinations(pet.id),
    ])
      .then(([recs, vax]) => {
        setRecords(recs)
        setVaccinations(Array.isArray(vax) ? vax : vax?.data ?? [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [pet?.id])

  if (!pet) return null

  const today = new Date()
  const in30Days = new Date(today.getTime() + 30 * 86400000)
  const upcomingVax = vaccinations.filter((v: any) => {
    if (!v.next_due_date) return false
    const due = new Date(v.next_due_date)
    return due >= today && due <= in30Days
  })

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

      {upcomingVax.length > 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Syringe className="w-5 h-5 text-warning-foreground" />
              Upcoming Vaccinations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingVax.map((v: any) => {
              const daysLeft = Math.ceil((new Date(v.next_due_date).getTime() - today.getTime()) / 86400000)
              return (
                <div key={v.vac_id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                  <div>
                    <p className="font-medium">{v.vaccine_name || v.vac_type}</p>
                    <p className="text-sm text-muted-foreground">Due: {v.next_due_date} · {daysLeft} day{daysLeft !== 1 ? 's' : ''} left</p>
                    {v.vet_name && <p className="text-xs text-muted-foreground">Last given by Dr. {v.vet_name}</p>}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setVacWizard({
                      open: true,
                      vaccineName: v.vaccine_name || v.vac_type || 'Vaccination',
                      vetId: String(v.vet_id),
                      branchId: String(v.branch_id),
                    })}
                  >
                    <Syringe className="w-3.5 h-3.5 mr-1" />
                    Book Vaccination
                  </Button>
                </div>
              )
            })}
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

      <Dialog open={!!vacWizard?.open} onOpenChange={(open) => !open && setVacWizard(null)}>
        <DialogContent className="sm:max-w-4xl w-[95vw] max-h-[92vh] overflow-y-auto p-6">
          {vacWizard && (
            <AppointmentWizard
              key={`vac-${vacWizard.vaccineName}`}
              initialPetId={pet.id}
              initialBranchId={vacWizard.branchId}
              initialVetId={vacWizard.vetId}
              lockedNotes={vacWizard.vaccineName}
              onComplete={() => setVacWizard(null)}
              onCancel={() => setVacWizard(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
