'use client'

import { useState } from 'react'
import type { Pet, MedicalRecord } from '@/lib/types'
import { medicalRecordApi } from '@/lib/api'
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
} from 'lucide-react'

interface MedicalRecordsProps {
  pets: Pet[]
  records: MedicalRecord[]
  userRole: 'owner' | 'vet'
  onRecordAdded?: () => void
}

interface AddRecordForm {
  diagnosis: string
  treatments: string
  notes: string
}

export function MedicalRecords({ pets, records, userRole, onRecordAdded }: MedicalRecordsProps) {
  const [selectedPetId, setSelectedPetId] = useState<string>(pets[0]?.id || '')
  const [searchTerm, setSearchTerm] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState<AddRecordForm>({ diagnosis: '', treatments: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const selectedPet = pets.find((p) => p.id === selectedPetId)
  const petRecords = records.filter((r) => r.petId === selectedPetId)

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
                {selectedPet.allergies.length > 0 && (
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

          {/* Records list */}
          <ScrollArea className="h-[480px] pr-2">
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
