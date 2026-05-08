'use client'

import { useState, useEffect } from 'react'
import { vaccinationPlanApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Save, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

const species = ['Dog', 'Cat', 'Rabbit', 'Bird', 'Guinea Pig', 'Hamster', 'Other']

interface VaccinationPlanFormProps {
  planId?: number
  onSuccess: () => void
}

export function VaccinationPlanForm({ planId, onSuccess }: VaccinationPlanFormProps) {
  const [planName, setPlanName] = useState('')
  const [selectedSpecies, setSelectedSpecies] = useState('')
  const [breed, setBreed] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(!!planId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (planId) {
      loadPlan()
    }
  }, [planId])

  const loadPlan = async () => {
    try {
      const result = await vaccinationPlanApi.get(planId!)
      const plan = result.plan || result
      setPlanName(plan.plan_name)
      setSelectedSpecies(plan.species)
      setBreed(plan.breed || '')
      setDescription(plan.description || '')
    } catch (err) {
      setError('Failed to load plan')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!planName.trim() || !selectedSpecies) {
      setError('Plan name and species are required')
      return
    }

    setSaving(true)
    setError('')
    try {
      if (planId) {
        await vaccinationPlanApi.update(planId, {
          plan_name: planName.trim(),
          description: description.trim() || undefined,
        })
      } else {
        await vaccinationPlanApi.create({
          plan_name: planName.trim(),
          species: selectedSpecies,
          breed: breed.trim() || undefined,
          description: description.trim() || undefined,
        })
      }
      onSuccess()
      setPlanName('')
      setSelectedSpecies('')
      setBreed('')
      setDescription('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save plan')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{planId ? 'Edit Vaccination Plan' : 'Create New Vaccination Plan'}</CardTitle>
        <CardDescription>
          {planId ? 'Update plan details' : 'Define vaccines for a species and breed'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Plan Name *</Label>
              <Input
                id="plan-name"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="e.g., Standard Dog Vaccination Plan"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="species">Species *</Label>
              <select
                id="species"
                value={selectedSpecies}
                onChange={(e) => setSelectedSpecies(e.target.value)}
                disabled={saving || !!planId}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">Select species...</option>
                {species.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="breed">Breed (Optional)</Label>
              <Input
                id="breed"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="e.g., Labrador, Mixed"
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes about this vaccination plan..."
              rows={3}
              disabled={saving}
            />
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {planId ? 'Update Plan' : 'Create Plan'}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
