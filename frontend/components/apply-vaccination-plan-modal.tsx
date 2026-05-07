'use client'

import { useState } from 'react'
import { vaccinationPlanApi } from '@/lib/api'
import type { Medicine } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Check, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AddVaccinationScheduleModalProps {
  petId: number | string
  petName?: string
  isOpen: boolean
  onClose: () => void
  vaccines: Medicine[]
  onAdded: () => void
}

export function AddVaccinationScheduleModal({
  petId,
  petName,
  isOpen,
  onClose,
  vaccines,
  onAdded,
}: AddVaccinationScheduleModalProps) {
  const [selectedVaccine, setSelectedVaccine] = useState('')
  const [ageWeeks, setAgeWeeks] = useState('0')
  const [repeatMonths, setRepeatMonths] = useState('')
  const [notes, setNotes] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const vaccineOptions = vaccines.filter((m) => m.category === 'vaccine')

  const handleAdd = async () => {
    if (!selectedVaccine || !ageWeeks) {
      setError('Please select a vaccine and age weeks')
      return
    }

    setAdding(true)
    setError('')
    try {
      await vaccinationPlanApi.applyPlan(petId, selectedVaccine, {
        age_weeks: parseInt(ageWeeks),
        repeat_every_months: repeatMonths ? parseInt(repeatMonths) : null,
        notes: notes || null,
      })
      setSuccess(true)
      setTimeout(() => {
        onAdded()
        handleClose()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to schedule')
      console.error(err)
    } finally {
      setAdding(false)
    }
  }

  const handleClose = () => {
    setSuccess(false)
    setError('')
    setSelectedVaccine('')
    setAgeWeeks('0')
    setRepeatMonths('')
    setNotes('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Vaccination Schedule</DialogTitle>
          <DialogDescription>
            Define a vaccine schedule for {petName}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <div className="rounded-full bg-green-100 p-3">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold">Added to Schedule</h3>
              <p className="text-sm text-muted-foreground">
                Vaccine has been added to the pet's vaccination schedule.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>
                Vaccine <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedVaccine} onValueChange={setSelectedVaccine}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a vaccine" />
                </SelectTrigger>
                <SelectContent>
                  {vaccineOptions.map((vaccine) => (
                    <SelectItem key={vaccine.id} value={vaccine.id}>
                      {vaccine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Age (weeks) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 8 weeks"
                value={ageWeeks}
                onChange={(e) => setAgeWeeks(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Repeat every (months)</Label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 12 for annual booster"
                value={repeatMonths}
                onChange={(e) => setRepeatMonths(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Special notes about this vaccine..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        )}

        {!success && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={adding}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={adding || !selectedVaccine}>
              {adding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add to Schedule'
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
