'use client'

import { useState, useEffect } from 'react'
import { vaccinationPlanApi } from '@/lib/api'
import { ApplicablePlan } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Check, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

interface ApplyVaccinationPlanModalProps {
  petId: number | string
  petName?: string
  isOpen: boolean
  onClose: () => void
  onApplied: () => void
}

export function ApplyVaccinationPlanModal({
  petId,
  petName,
  isOpen,
  onClose,
  onApplied,
}: ApplyVaccinationPlanModalProps) {
  const [plans, setPlans] = useState<ApplicablePlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadPlans()
    }
  }, [isOpen, petId])

  const loadPlans = async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess(false)
      const data = await vaccinationPlanApi.getApplicablePlans(petId)
      setPlans(data || [])
      if (data && data.length > 0) {
        setSelectedPlanId(data[0].plan_id)
      }
    } catch (err) {
      setError('Failed to load applicable plans')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!selectedPlanId) {
      setError('Please select a plan')
      return
    }

    setApplying(true)
    setError('')
    try {
      await vaccinationPlanApi.applyPlan(petId, selectedPlanId)
      setSuccess(true)
      setTimeout(() => {
        onApplied()
        handleClose()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply plan')
      console.error(err)
    } finally {
      setApplying(false)
    }
  }

  const handleClose = () => {
    setSuccess(false)
    setError('')
    setSelectedPlanId(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply Vaccination Plan</DialogTitle>
          <DialogDescription>
            {petName && `Select a vaccination plan for ${petName}`}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <div className="rounded-full bg-green-100 p-3">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold">Plan Applied Successfully</h3>
              <p className="text-sm text-muted-foreground">
                The vaccination plan has been applied to the pet.
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

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No applicable plans found for this pet's species/breed
              </div>
            ) : (
              <div className="space-y-3">
                {plans.map((plan) => (
                  <div
                    key={plan.plan_id}
                    onClick={() => setSelectedPlanId(plan.plan_id)}
                    className={`p-4 border rounded-lg cursor-pointer transition ${
                      selectedPlanId === plan.plan_id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-sm">{plan.plan_name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {plan.vaccine_count} vaccines
                          {plan.breed && ` • Breed: ${plan.breed}`}
                        </p>
                      </div>
                      {selectedPlanId === plan.plan_id && (
                        <div className="rounded-full bg-blue-500 p-1">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!success && (
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={applying}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              disabled={applying || loading || !selectedPlanId}
            >
              {applying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                'Apply Plan'
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
