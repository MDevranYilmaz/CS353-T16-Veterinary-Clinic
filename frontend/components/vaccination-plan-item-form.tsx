'use client'

import { useState, useEffect } from 'react'
import { vaccinationPlanApi, inventoryApi } from '@/lib/api'
import { Medicine } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface VaccinationPlanItemFormProps {
  planId: number
  isOpen: boolean
  onClose: () => void
  onItemAdded: () => void
}

export function VaccinationPlanItemForm({
  planId,
  isOpen,
  onClose,
  onItemAdded,
}: VaccinationPlanItemFormProps) {
  const [vaccines, setVaccines] = useState<Medicine[]>([])
  const [selectedVaccine, setSelectedVaccine] = useState('')
  const [ageWeeks, setAgeWeeks] = useState('')
  const [sequenceNumber, setSequenceNumber] = useState('')
  const [repeatMonths, setRepeatMonths] = useState('')
  const [genderApplicable, setGenderApplicable] = useState<'M' | 'F' | 'All'>('All')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadVaccines()
    }
  }, [isOpen])

  const loadVaccines = async () => {
    try {
      setLoading(true)
      setError('')
      const medicines = await inventoryApi.listAllMedicines()
      const vaccinesList = medicines.filter((m) => m.category === 'vaccine')
      setVaccines(vaccinesList)
    } catch (err) {
      setError('Failed to load vaccines')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVaccine || !ageWeeks) {
      setError('Vaccine and age (weeks) are required')
      return
    }

    setSaving(true)
    setError('')
    try {
      await vaccinationPlanApi.addItem(planId, {
        vaccine_barcode: selectedVaccine,
        age_weeks: Number(ageWeeks),
        sequence_number: sequenceNumber ? Number(sequenceNumber) : undefined,
        repeat_every_months: repeatMonths ? Number(repeatMonths) : undefined,
        gender_applicable:
          genderApplicable !== 'All'
            ? (genderApplicable as 'M' | 'F')
            : undefined,
        notes: notes.trim() || undefined,
      })
      onItemAdded()
      resetForm()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add vaccine')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setSelectedVaccine('')
    setAgeWeeks('')
    setSequenceNumber('')
    setRepeatMonths('')
    setGenderApplicable('All')
    setNotes('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Vaccine to Plan</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="vaccine">Vaccine *</Label>
                <select
                  id="vaccine"
                  value={selectedVaccine}
                  onChange={(e) => setSelectedVaccine(e.target.value)}
                  disabled={saving}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="">Select vaccine...</option>
                  {vaccines.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="age-weeks">Age (weeks) *</Label>
                  <Input
                    id="age-weeks"
                    type="number"
                    min="0"
                    value={ageWeeks}
                    onChange={(e) => setAgeWeeks(e.target.value)}
                    placeholder="e.g., 6"
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sequence">Dose #</Label>
                  <Input
                    id="sequence"
                    type="number"
                    min="1"
                    value={sequenceNumber}
                    onChange={(e) => setSequenceNumber(e.target.value)}
                    placeholder="e.g., 1"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="repeat">Repeat every (months)</Label>
                  <Input
                    id="repeat"
                    type="number"
                    min="0"
                    value={repeatMonths}
                    onChange={(e) => setRepeatMonths(e.target.value)}
                    placeholder="e.g., 12"
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Applicable to</Label>
                  <select
                    id="gender"
                    value={genderApplicable}
                    onChange={(e) =>
                      setGenderApplicable(e.target.value as 'M' | 'F' | 'All')
                    }
                    disabled={saving}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="All">All</option>
                    <option value="M">Male Only</option>
                    <option value="F">Female Only</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special notes about this vaccine..."
                  rows={2}
                  disabled={saving}
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || loading}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Vaccine
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
