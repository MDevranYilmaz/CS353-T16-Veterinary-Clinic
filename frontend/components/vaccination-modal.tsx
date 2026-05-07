'use client'

import { useState, useEffect } from 'react'
import { vaccinationApi, vaccinationPlanApi } from '@/lib/api'
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
import { Syringe, Loader2, AlertTriangle, Info } from 'lucide-react'

interface VaccinationPlan {
  pet_vaccination_plan_id: number
  vaccine_barcode: string
  vaccine_name?: string
  vac_type?: string
  repeat_every_months?: number
  notes?: string
}

interface VaccinationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  petId: string
  petName: string
  onSuccess?: () => void
}

export function VaccinationModal({
  open,
  onOpenChange,
  petId,
  petName,
  onSuccess,
}: VaccinationModalProps) {
  const today = new Date().toISOString().slice(0, 10)
  const [plans, setPlans] = useState<VaccinationPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [vacDate, setVacDate] = useState(today)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  // Fetch pet's vaccination plans when modal opens
  useEffect(() => {
    if (!open || !petId) return

    const fetchPlans = async () => {
      setLoading(true)
      try {
        const schedule = await vaccinationPlanApi.getPetSchedule(petId)
        setPlans(schedule || [])
      } catch (e) {
        console.error('[VaccinationModal] Failed to fetch vaccination plans:', e)
        setPlans([])
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [open, petId])

  const selectedPlan = plans.find((p) => p.pet_vaccination_plan_id === Number(selectedPlanId))

  const handleClose = () => {
    if (saving) return
    setSelectedPlanId('')
    setVacDate(today)
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    if (!selectedPlanId || !petId) return
    setSaving(true)
    try {
      await vaccinationApi.record({
        vac_date: vacDate,
        pet_id: Number(petId),
        pet_vaccination_plan_id: Number(selectedPlanId),
      })
      setSelectedPlanId('')
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
          {/* Vaccination Plan */}
          <div className="space-y-2">
            <Label>Vaccination Plan</Label>
            {loading ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-muted/40 bg-muted/5 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading plans...
              </div>
            ) : plans.length === 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-warning/40 bg-warning/5 text-sm text-warning-foreground">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                No vaccination plans defined for this pet. Please create a plan first.
              </div>
            ) : (
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.pet_vaccination_plan_id} value={String(p.pet_vaccination_plan_id)}>
                      <div className="flex items-center gap-2">
                        <Syringe className="w-4 h-4 text-muted-foreground" />
                        <span>{p.vaccine_name || 'Vaccine'}</span>
                        {p.vac_type && (
                          <span className="text-xs text-muted-foreground">
                            ({p.vac_type})
                          </span>
                        )}
                        {p.repeat_every_months && (
                          <span className="text-xs text-muted-foreground">
                            • every {p.repeat_every_months}mo
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Plan Details */}
          {selectedPlan && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-info/40 bg-info/5 text-sm">
              <Info className="w-4 h-4 shrink-0 text-info mt-0.5" />
              <div>
                <div className="font-medium text-info-foreground">Plan Details:</div>
                {selectedPlan.repeat_every_months && (
                  <div className="text-info-foreground/80">
                    Next due {selectedPlan.repeat_every_months} months after administration
                  </div>
                )}
                {selectedPlan.notes && (
                  <div className="text-info-foreground/80 text-xs mt-1">{selectedPlan.notes}</div>
                )}
              </div>
            </div>
          )}

          {/* Date administered */}
          <div className="space-y-2">
            <Label>Date Administered</Label>
            <Input
              type="date"
              value={vacDate}
              max={today}
              onChange={(e) => setVacDate(e.target.value)}
              disabled={loading || plans.length === 0}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedPlanId || plans.length === 0 || saving || loading}
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
