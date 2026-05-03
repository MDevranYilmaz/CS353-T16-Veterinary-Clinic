'use client'

import { useState, useEffect } from 'react'
import { vaccinationPlanApi } from '@/lib/api'
import { VaccinationPlan, VaccinationPlanItem } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Trash2, Edit2, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { useState as useExpandedState } from 'react'

const species = ['Dog', 'Cat', 'Rabbit', 'Bird', 'Guinea Pig', 'Hamster', 'Other']

interface VaccinationPlanListProps {
  onPlanSelect?: (plan: VaccinationPlan) => void
  onRefresh?: () => void
  onAddItem?: (planId: number) => void
}

export function VaccinationPlanList({ onPlanSelect, onRefresh, onAddItem }: VaccinationPlanListProps) {
  const [selectedSpecies, setSelectedSpecies] = useState('')
  const [plans, setPlans] = useState<VaccinationPlan[]>([])
  const [planItems, setPlanItems] = useState<Record<number, VaccinationPlanItem[]>>({})
  const [expandedPlan, setExpandedPlan] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPlans()
  }, [selectedSpecies])

  const loadPlans = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await vaccinationPlanApi.list(selectedSpecies || undefined)
      setPlans(data || [])
      setPlanItems({})
    } catch (err) {
      setError('Failed to load plans')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadPlanItems = async (planId: number) => {
    if (planItems[planId]) {
      setExpandedPlan(expandedPlan === planId ? null : planId)
      return
    }

    try {
      const plan = await vaccinationPlanApi.get(planId)
      setPlanItems((prev) => ({
        ...prev,
        [planId]: plan.items || [],
      }))
      setExpandedPlan(planId)
    } catch (err) {
      setError('Failed to load plan items')
      console.error(err)
    }
  }

  const handleDelete = async (planId: number) => {
    if (!confirm('Are you sure you want to delete this plan?')) return

    setDeleting(planId)
    try {
      await vaccinationPlanApi.delete(planId)
      setPlans((prev) => prev.filter((p) => p.plan_id !== planId))
      if (expandedPlan === planId) setExpandedPlan(null)
      onRefresh?.()
    } catch (err) {
      setError('Failed to delete plan')
      console.error(err)
    } finally {
      setDeleting(null)
    }
  }

  const handleRemoveItem = async (itemId: number, planId: number) => {
    if (!confirm('Remove this vaccine from the plan?')) return

    try {
      await vaccinationPlanApi.removeItem(itemId)
      setPlanItems((prev) => ({
        ...prev,
        [planId]: prev[planId].filter((item) => item.item_id !== itemId),
      }))
    } catch (err) {
      setError('Failed to remove item')
      console.error(err)
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
    <div className="space-y-4">
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Vaccination Plans</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {['All', ...species].map((s) => (
              <Button
                key={s}
                variant={selectedSpecies === (s === 'All' ? '' : s) ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSpecies(s === 'All' ? '' : s)}
              >
                {s}
              </Button>
            ))}
          </div>

          {plans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No plans found</div>
          ) : (
            <div className="space-y-2">
              {plans.map((plan) => (
                <div key={plan.plan_id} className="border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition">
                    <div className="flex-1">
                      <h3 className="font-semibold">{plan.plan_name}</h3>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary">{plan.species}</Badge>
                        {plan.breed && <Badge variant="outline">{plan.breed}</Badge>}
                        <Badge variant="outline">
                          {planItems[plan.plan_id]?.length || 0} vaccines
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadPlanItems(plan.plan_id)}
                      >
                        {expandedPlan === plan.plan_id ? <ChevronUp /> : <ChevronDown />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPlanSelect?.(plan)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(plan.plan_id)}
                        disabled={deleting === plan.plan_id}
                      >
                        {deleting === plan.plan_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {expandedPlan === plan.plan_id && (
                    <div className="border-t bg-muted/50 p-4 space-y-2">
                      {planItems[plan.plan_id]?.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No vaccines in this plan</div>
                      ) : (
                        <div className="space-y-2">
                          {planItems[plan.plan_id]?.map((item) => (
                            <div key={item.item_id} className="flex items-between justify-between bg-background p-2 rounded border">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{item.med_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  At {item.age_weeks} weeks
                                  {item.sequence_number && ` · Dose ${item.sequence_number}`}
                                  {item.repeat_every_months && ` · Every ${item.repeat_every_months} months`}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(item.item_id, plan.plan_id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => onAddItem?.(plan.plan_id)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Vaccine
                      </Button>
                    </div>
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
