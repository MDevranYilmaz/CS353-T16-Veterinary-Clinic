'use client'

import { useState, useEffect } from 'react'
import type { Pet, MedicalRecord } from '@/lib/types'
import { medicalRecordApi, petApi, prescriptionApi } from '@/lib/api'
import { appointmentApi, referralApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  FileText,
  Stethoscope,
  Search,
  Calendar,
  AlertTriangle,
  Plus,
  Loader2,
  ArrowLeft,
} from 'lucide-react'

interface MedicalRecordsProps {
  pets: Pet[]
  records: MedicalRecord[]
  userRole: 'owner' | 'vet'
  initialPetId?: string
  onRecordAdded?: () => void
  showBackButton?: boolean
  onBack?: () => void
}

interface AddRecordForm {
  diagnosis: string
  treatments: string
  notes: string
}

export function MedicalRecords({ pets, records, userRole, initialPetId, onRecordAdded, showBackButton, onBack }: MedicalRecordsProps) {
  const [selectedPetId, setSelectedPetId] = useState<string>(initialPetId ?? pets[0]?.id ?? '')
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [vaccinations, setVaccinations] = useState<any[]>([])
  const [appointmentsList, setAppointmentsList] = useState<any[]>([])

  const formatDateTime = (value?: string) => {
    if (!value) return '—'
    const parsed = Date.parse(value)
    if (Number.isNaN(parsed)) return value
    return new Date(parsed).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Update selected pet if initialPetId or pets list changes
  useEffect(() => {
    if (initialPetId) setSelectedPetId(initialPetId)
    else if (!selectedPetId && pets[0]?.id) setSelectedPetId(pets[0].id)
  }, [initialPetId, pets])
  const [searchTerm, setSearchTerm] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState<AddRecordForm>({ diagnosis: '', treatments: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const selectedPet = pets.find((p) => p.id === selectedPetId)
  const petRecords = records.filter((r) => r.petId === selectedPetId)

  const { user } = useAuth()

  // When selected pet changes, fetch prescriptions and vaccinations
  useEffect(() => {
    if (!selectedPetId) return
    let mounted = true
    ;(async () => {
      try {
        const pres = await petApi.prescriptions(selectedPetId)
        const detailedPres = await Promise.all(
          pres.map(async (item: any) => {
            const prescriptionId = item.prescription_id || item.id
            if (!prescriptionId) return item
            try {
              return await prescriptionApi.get(prescriptionId)
            } catch {
              return item
            }
          })
        )
        const vax = await petApi.vaccinations(selectedPetId)

        // For vets: backend does not support filtering appointments by pet_id directly.
        // Fetch today's appointments for the current vet and filter by pet.
        let appts: any[] = []
        if (user && user.role === 'vet') {
          const today = new Date().toISOString().slice(0, 10)
          const vetAppts = await appointmentApi.listByVet(String(user.userId), today)
          appts = (vetAppts || [])
            .filter((a: any) => String(a.petId) === String(selectedPetId))
            .map((a: any) => ({ ...a, vetName: a.vetName || user.fullName }))

          // Also include referrals where this vet is sender or receiver for this pet
          try {
            const refs = await referralApi.list({ vet_id: String(user.userId), pet_id: String(selectedPetId) })
            // mark referrals so UI can display them if desired
            const mappedRefs = (refs || []).map((r: any) => ({
              id: `ref-${r.id}`,
              type: 'referral',
              date: r.date || '',
              time: '',
              petName: r.petName,
              vetName: String(r.fromVetId) === String(user.userId) ? r.toVetName : r.fromVetName,
              status: r.status,
              reason: r.reason,
              ...r,
            }))
            appts = [...appts, ...mappedRefs]
          } catch (e) {
            console.warn('[MedicalRecords] failed to load referrals', e)
          }
        } else {
          // Owner or other roles: fall back to listing appointments by pet (if backend supports)
          try {
            appts = await appointmentApi.listByPet(selectedPetId)
          } catch (e) {
            console.warn('[MedicalRecords] listByPet failed', e)
            appts = []
          }
        }

        if (!mounted) return
        setPrescriptions(detailedPres)
        setVaccinations(vax)
        setAppointmentsList(appts)
      } catch (e) {
        console.error('[MedicalRecords] fetch extra data error:', e)
        setPrescriptions([])
        setVaccinations([])
        setAppointmentsList([])
      }
    })()
    return () => { mounted = false }
  }, [selectedPetId])

  const filteredRecords = petRecords.filter((record) => {
    if (!searchTerm) return true
    const q = searchTerm.toLowerCase()
    return (
      record.diagnosis.toLowerCase().includes(q) ||
      record.treatment.toLowerCase().includes(q) ||
      record.vetName.toLowerCase().includes(q)
    )
  })

  const handleAddRecord = async () => {
    if (!selectedPetId || !form.diagnosis.trim() || !form.treatments.trim()) return
    setSaving(true)
    try {
      const now = new Date()
      await medicalRecordApi.create({
        pet_id: Number(selectedPetId),
        date_time: `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 8)}`,
        diagnosis: form.diagnosis.trim(),
        treatments: form.treatments.trim(),
        notes: form.notes.trim() || undefined,
      })
      setForm({ diagnosis: '', treatments: '', notes: '' })
      setAddOpen(false)
      onRecordAdded?.()
    } catch (e) {
      console.error('[MedicalRecords] addRecord error:', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {showBackButton ? (
          <Button variant="ghost" onClick={onBack} size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Patients
          </Button>
        ) : (
          <Select value={selectedPetId} onValueChange={setSelectedPetId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a pet" />
            </SelectTrigger>
            <SelectContent>
              {pets.map((pet) => (
                <SelectItem key={pet.id} value={pet.id}>
                  <div className="flex items-center gap-2">
                    <span>{pet.name}</span>
                    <span className="text-muted-foreground text-xs capitalize">({pet.species})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {userRole === 'vet' && selectedPetId && (
          <Button onClick={() => setAddOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Record
          </Button>
        )}
      </div>

      {selectedPet && (
        <div className="space-y-4">
          {/* Pet summary banner */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-4 px-5">
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Pet</p>
                  <p className="font-semibold">{selectedPet.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Species / Breed</p>
                  <p className="font-medium capitalize">
                    {selectedPet.species}
                    {selectedPet.breed ? ` — ${selectedPet.breed}` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Age</p>
                  <p className="font-medium">{selectedPet.age} yr</p>
                </div>
                {selectedPet.allergies.length > 0 ? (
                  <div>
                    <p className="text-muted-foreground text-xs flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-destructive" />
                      Allergies
                    </p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {selectedPet.allergies.map((a) => (
                        <Badge key={a} variant="destructive" className="text-xs px-1.5 py-0">
                          {a}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-muted-foreground text-xs flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-destructive" />
                      Allergies
                    </p>
                    <p className="text-sm text-muted-foreground">None</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Tabbed content: Records / Prescriptions / Vaccinations */}
          <Tabs defaultValue="records">
            <TabsList className="mb-4 w-fit">
              <TabsTrigger value="records">Records</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
              <TabsTrigger value="vaccinations">Vaccinations</TabsTrigger>
              <TabsTrigger value="vaccination-schedule">Vaccination Schedule</TabsTrigger>
            </TabsList>

            <TabsContent value="records">
              <ScrollArea className="h-[420px] pr-2">
            {filteredRecords.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-14">
                  <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">
                    {searchTerm ? 'No records match your search.' : 'No medical records on file.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Accordion type="single" collapsible className="space-y-2">
                {filteredRecords.map((record) => (
                  <AccordionItem
                    key={record.id}
                    value={record.id}
                    className="border rounded-lg px-4 data-[state=open]:border-primary/30"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-4 text-left w-full">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 shrink-0">
                          <Stethoscope className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{record.diagnosis}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {record.date
                                ? new Date(record.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : '—'}
                            </span>
                            {record.vetName && (
                              <span>Dr. {record.vetName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pb-4 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Treatment
                        </p>
                        <p className="text-sm">{record.treatment || '—'}</p>
                      </div>
                      {record.notes && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                            Notes
                          </p>
                          <p className="text-sm text-muted-foreground">{record.notes}</p>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
            </ScrollArea>
            </TabsContent>

            <TabsContent value="appointments">
              <div className="space-y-2">
                {appointmentsList.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">No appointments found for this pet.</CardContent>
                  </Card>
                ) : (
                  appointmentsList.map((apt: any) => (
                    <Card key={apt.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold">{apt.date} {apt.time || ''}</p>
                            <p className="text-xs text-muted-foreground">
                              {apt.type === 'referral' ? 'Referral to' : apt.type} — {apt.vetName || '—'}
                            </p>
                          </div>
                          <Badge variant={apt.type === 'referral' ? 'secondary' : 'default'} className="text-xs">
                            {apt.type === 'referral' ? apt.status : (apt.status || apt.appointment_status || 'scheduled')}
                          </Badge>
                        </div>
                        {apt.reason && <p className="text-sm text-muted-foreground mt-2">{apt.reason}</p>}
                        {apt.notes && <p className="text-sm text-muted-foreground mt-3">{apt.notes}</p>}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="prescriptions">
              <div className="space-y-2">
                {prescriptions.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">No prescriptions found.</CardContent>
                  </Card>
                ) : (
                  prescriptions.map((pr) => (
                    <Card key={pr.prescription_id || pr.id}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold">Prescription #{pr.prescription_id || pr.id}</p>
                            <p className="text-xs text-muted-foreground">{formatDateTime(pr.date_time)}</p>
                          </div>
                          {pr.vet_name && <Badge variant="secondary">Dr. {pr.vet_name}</Badge>}
                        </div>

                        <div className="grid gap-2 text-sm sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pet</p>
                            <p>{pr.pet_name || selectedPet?.name || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Expires</p>
                            <p>{pr.expiration_date || '—'}</p>
                          </div>
                        </div>

                        {pr.medicines?.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Medicines</p>
                            <div className="space-y-2">
                              {pr.medicines.map((m: any, i: number) => (
                                <div key={m.medicine_id || m.barcode_no || i} className="rounded-md border p-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="font-medium">{m.med_name || m.medicine_name || m.barcode_no}</p>
                                      <p className="text-xs text-muted-foreground">{m.med_type || m.category || 'medicine'}</p>
                                    </div>
                                    <Badge variant="outline">Qty {m.dosage ?? m.quantity ?? 1}</Badge>
                                  </div>
                                  <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                                    <p>Frequency: {m.frequency ?? '—'}</p>
                                    <p>Unit cost: {m.unit_cost ? `$${m.unit_cost}` : '—'}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No medicines listed.</p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="vaccinations">
              <div className="space-y-2">
                {vaccinations.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">No vaccinations found.</CardContent>
                  </Card>
                ) : (
                  vaccinations.map((v: any) => (
                    <Card key={v.vac_id || v.id}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold">{v.vaccine_name || v.vaccineName || v.vaccineId}</p>
                            <p className="text-xs text-muted-foreground">Given: {formatDateTime(v.vac_date || v.date_time || v.dueDate)}</p>
                          </div>
                          {v.vaccination_status && <Badge variant="secondary">{v.vaccination_status}</Badge>}
                        </div>

                        <div className="grid gap-2 text-sm sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next due</p>
                            <p>{v.next_due_date || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vet</p>
                            <p>{v.vet_name ? `Dr. ${v.vet_name}` : '—'}</p>
                          </div>
                        </div>

                        <div className="grid gap-2 text-sm sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</p>
                            <p>{v.vac_type || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pet breed</p>
                            <p>{v.breed || '—'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="vaccination-schedule" className="space-y-4">
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Vaccination schedule management is being simplified to pet-specific records.
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Add Record Dialog (vet only) */}
      <Dialog open={addOpen} onOpenChange={(o) => { if (!saving) setAddOpen(o) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Medical Record</DialogTitle>
            <DialogDescription>
              Create a new record for <strong>{selectedPet?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>
                Diagnosis <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. Upper respiratory infection"
                value={form.diagnosis}
                onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Treatment <span className="text-destructive">*</span>
              </Label>
              <Textarea
                placeholder="Describe the treatment provided..."
                value={form.treatments}
                onChange={(e) => setForm({ ...form, treatments: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Textarea
                placeholder="Additional observations or follow-up instructions..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleAddRecord}
              disabled={!form.diagnosis.trim() || !form.treatments.trim() || saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Record'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
