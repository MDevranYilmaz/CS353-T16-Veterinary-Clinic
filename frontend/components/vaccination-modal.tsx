'use client'

import { useState } from 'react'
import { vaccinationApi } from '@/lib/api'
import type { Medicine } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Syringe, Loader2, AlertTriangle } from 'lucide-react'

interface VaccinationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  petId: string
  petName: string
  vaccines: Medicine[]
  onSuccess?: () => void
}

export function VaccinationModal({
  open,
  onOpenChange,
  petId,
  petName,
  vaccines,
  onSuccess,
}: VaccinationModalProps) {
  const today = new Date().toISOString().slice(0, 10)
  const [selectedVaccine, setSelectedVaccine] = useState('')
  const [vacDate, setVacDate] = useState(today)
  const [nextDue, setNextDue] = useState('')
  const [saving, setSaving] = useState(false)

  const vaccineOptions = vaccines.filter((m) => m.category === 'vaccine')

  const handleClose = () => {
    if (saving) return
    setSelectedVaccine('')
    setVacDate(today)
    setNextDue('')
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    if (!selectedVaccine || !petId) return
    setSaving(true)
    try {
      await vaccinationApi.record({
        vac_date: vacDate,
        pet_id: Number(petId),
        barcode_no: selectedVaccine,
        next_due_date: nextDue || undefined,
      })
      setSelectedVaccine('')
      setNextDue('')
      onSuccess?.()
      onOpenChange(false)
    } catch (e) {
      console.error('[VaccinationModal] record error:', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Syringe className="w-5 h-5 text-primary" />
            Record Vaccination
          </DialogTitle>
          <DialogDescription>
            Administer and record a vaccination for <strong>{petName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Vaccine */}
          <div className="space-y-2">
            <Label>Vaccine</Label>
            {vaccineOptions.length === 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-warning/40 bg-warning/5 text-sm text-warning-foreground">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                No vaccines in stock for this branch.
              </div>
            ) : (
              <Select value={selectedVaccine} onValueChange={setSelectedVaccine}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vaccine" />
                </SelectTrigger>
                <SelectContent>
                  {vaccineOptions.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      <div className="flex items-center gap-2">
                        <Syringe className="w-4 h-4 text-muted-foreground" />
                        <span>{v.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({v.currentStock} in stock)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Date administered */}
          <div className="space-y-2">
            <Label>Date Administered</Label>
            <Input
              type="date"
              value={vacDate}
              max={today}
              onChange={(e) => setVacDate(e.target.value)}
            />
          </div>

          {/* Next due date */}
          <div className="space-y-2">
            <Label>
              Next Due Date
              <span className="ml-1 text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Input
              type="date"
              value={nextDue}
              min={today}
              onChange={(e) => setNextDue(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to auto-calculate from vaccination protocol.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedVaccine || vaccineOptions.length === 0 || saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Recording...
              </>
            ) : (
              <>
                <Syringe className="w-4 h-4 mr-2" />
                Record Vaccination
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
