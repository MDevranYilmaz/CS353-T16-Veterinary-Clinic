'use client'

import { useState } from 'react'
import { VaccinationPlan } from '@/lib/types'
import { VaccinationPlanForm } from './vaccination-plan-form'
import { VaccinationPlanList } from './vaccination-plan-list'
import { VaccinationPlanItemForm } from './vaccination-plan-item-form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function VaccinationPlansTab() {
  const [selectedPlan, setSelectedPlan] = useState<VaccinationPlan | null>(null)
  const [itemFormOpen, setItemFormOpen] = useState(false)
  const [selectedPlanIdForItem, setSelectedPlanIdForItem] = useState<number | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handlePlanSuccess = () => {
    setSelectedPlan(null)
    setRefreshKey((prev) => prev + 1)
  }

  const handleAddItem = (planId: number) => {
    setSelectedPlanIdForItem(planId)
    setItemFormOpen(true)
  }

  const handleItemAdded = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="manage" className="w-full">
        <TabsList>
          <TabsTrigger value="manage">Manage Plans</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="space-y-4">
          <VaccinationPlanList
            key={refreshKey}
            onPlanSelect={setSelectedPlan}
            onRefresh={() => setRefreshKey((prev) => prev + 1)}
            onAddItem={handleAddItem}
          />

          {selectedPlan && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle>Edit Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <VaccinationPlanForm
                  planId={selectedPlan.plan_id}
                  onSuccess={handlePlanSuccess}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="create">
          <VaccinationPlanForm onSuccess={handlePlanSuccess} />
        </TabsContent>
      </Tabs>

      {selectedPlanIdForItem && (
        <VaccinationPlanItemForm
          planId={selectedPlanIdForItem}
          isOpen={itemFormOpen}
          onClose={() => setItemFormOpen(false)}
          onItemAdded={handleItemAdded}
        />
      )}
    </div>
  )
}
