'use client'

import { useState } from 'react'
import type { Medicine, Prescription } from '@/lib/types'
import { prescriptionApi } from '@/lib/api'
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
import { Badge } from '@/components/ui/badge'
import { Pill, Plus, Syringe, Trash2, AlertTriangle, Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface PrescriptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  medicines: Medicine[]
  petName: string
  petId: string
  vetId: string
  onSave: () => void
}

const freqMap: Record<string, number> = {
  'once daily': 1,
  'twice daily': 2,
  'three times daily': 3,
  'every 8 hours': 3,
  'every 12 hours': 2,
  'as needed': 1,
}

function parseDosage(s: string): number {
  const n = parseFloat(s)
  return isNaN(n) ? 1 : n
}

export function PrescriptionModal({
  open,
  onOpenChange,
  medicines,
  petName,
  petId,
  onSave,
}: PrescriptionModalProps) {
  const [prescriptions, setPrescriptions] = useState<Omit<Prescription, 'id'>[]>([])
  const [selectedMedicine, setSelectedMedicine] = useState<string>('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('')
  const [duration, setDuration] = useState('')
  const [quantity, setQuantity] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const availableMedicines = medicines.filter(
    (m) => m.category === 'medicine' || m.category === 'supplement'
  )

  const handleAddPrescription = () => {
    const medicine = medicines.find((m) => m.id === selectedMedicine)
    if (!medicine || !dosage || !frequency || !duration || !quantity) return

    setPrescriptions([
      ...prescriptions,
      {
        medicineId: medicine.id,
        medicineName: medicine.name,
        dosage,
        frequency,
        duration,
        quantity: parseInt(quantity),
      },
    ])
    setSelectedMedicine('')
    setDosage('')
    setFrequency('')
    setDuration('')
    setQuantity('')
  }

  const handleRemovePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!petId || prescriptions.length === 0) return
    setSaving(true)
    setSaveError('')
    try {
      const now = new Date()
      const dateTime = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 8)}`
      const expDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)

      await prescriptionApi.create({
        pet_id: Number(petId),
        date_time: dateTime,
        expiration_date: expDate,
        medicines: prescriptions.map((rx) => ({
          barcode_no: rx.medicineId,
          dosage: parseDosage(rx.dosage),
          frequency: freqMap[rx.frequency] ?? 1,
          duration: rx.duration,
          quantity: rx.quantity,
        })),
      })
      setPrescriptions([])
      onSave()
      onOpenChange(false)
    } catch (e: any) {
      setSaveError(e?.message || 'Failed to save prescription. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getStockWarning = (medicineId: string, requestedQty: number) => {
    const medicine = medicines.find((m) => m.id === medicineId)
    if (!medicine) return null
    if (requestedQty > medicine.currentStock) {
      return `Only ${medicine.currentStock} in stock`
    }
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Prescription</DialogTitle>
          <DialogDescription>Add medications for {petName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Add medication form */}
          <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
            <h4 className="font-medium text-sm">Add Medication</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Medication</Label>
                <Select value={selectedMedicine} onValueChange={setSelectedMedicine}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select medication" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMedicines.map((medicine) => (
                      <SelectItem key={medicine.id} value={medicine.id}>
                        <div className="flex items-center gap-2">
                          {medicine.category === 'medicine' ? (
                            <Pill className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Syringe className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span>{medicine.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({medicine.currentStock} in stock)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Dosage</Label>
                <Input
                  placeholder="e.g., 1 tablet"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                />
              </div>

              <div>
                <Label>Frequency</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once daily">Once daily</SelectItem>
                    <SelectItem value="twice daily">Twice daily</SelectItem>
                    <SelectItem value="three times daily">Three times daily</SelectItem>
                    <SelectItem value="every 8 hours">Every 8 hours</SelectItem>
                    <SelectItem value="every 12 hours">Every 12 hours</SelectItem>
                    <SelectItem value="as needed">As needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3 days">3 days</SelectItem>
                    <SelectItem value="5 days">5 days</SelectItem>
                    <SelectItem value="7 days">7 days</SelectItem>
                    <SelectItem value="10 days">10 days</SelectItem>
                    <SelectItem value="14 days">14 days</SelectItem>
                    <SelectItem value="30 days">30 days</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Total quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleAddPrescription}
              disabled={!selectedMedicine || !dosage || !frequency || !duration || !quantity}
              className="w-full gap-2"
            >
              <Plus className="w-4 h-4" />
              Add to Prescription
            </Button>
          </div>

          {/* Prescription list */}
          {prescriptions.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Prescription Items</h4>
              <div className="space-y-2">
                {prescriptions.map((rx, index) => {
                  const stockWarning = getStockWarning(rx.medicineId, rx.quantity)
                  return (
                    <div
                      key={index}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg border',
                        stockWarning && 'border-warning bg-warning/5'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                          <Pill className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{rx.medicineName}</p>
                          <p className="text-sm text-muted-foreground">
                            {rx.dosage} • {rx.frequency} • {rx.duration}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <Badge variant="outline">Qty: {rx.quantity}</Badge>
                          {stockWarning && (
                            <p className="text-xs text-warning-foreground flex items-center gap-1 mt-1">
                              <AlertTriangle className="w-3 h-3" />
                              {stockWarning}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemovePrescription(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {saveError && (
          <Alert variant="destructive" className="mx-0">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={prescriptions.length === 0 || saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Prescription'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
