'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Hotel, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { boardingApi, branchApi } from '@/lib/api'
import type { Pet, Branch } from '@/lib/types'

interface BoardingBookModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pets: Pet[]
  onSuccess?: () => void
}

const sizeLabel: Record<string, string> = {
  Small: 'Small — cats, small dogs',
  Medium: 'Medium — medium dogs',
  Large: 'Large — large breeds',
}

export function BoardingBookModal({ open, onOpenChange, pets, onSuccess }: BoardingBookModalProps) {
  const [branches, setBranches] = useState<Branch[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [selectedPet, setSelectedPet] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [feedingInstructions, setFeedingInstructions] = useState('')
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    branchApi.list().then(setBranches).catch(console.error)
  }, [open])

  useEffect(() => {
    if (!selectedBranch || !checkIn || !checkOut) { setUnits([]); setSelectedUnit(''); return }
    setLoadingUnits(true)
    boardingApi.list(selectedBranch, true, checkIn, checkOut)
      .then((us) => { setUnits(us); setSelectedUnit('') })
      .catch(console.error)
      .finally(() => setLoadingUnits(false))
  }, [selectedBranch, checkIn, checkOut])

  const handleSubmit = async () => {
    if (!selectedPet || !selectedUnit || !checkIn || !checkOut) return
    setSaving(true)
    setError('')
    try {
      await boardingApi.book({
        boarding_unit_id: Number(selectedUnit),
        pet_id: Number(selectedPet),
        check_in_date: checkIn,
        check_out_date: checkOut,
        feeding_instructions: feedingInstructions.trim() || undefined,
      })
      setSelectedPet(''); setSelectedBranch(''); setSelectedUnit('')
      setCheckIn(''); setCheckOut(''); setFeedingInstructions('')
      onOpenChange(false)
      onSuccess?.()
    } catch (e: any) {
      setError(e.message || 'Failed to book unit')
    } finally {
      setSaving(false)
    }
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hotel className="w-5 h-5 text-primary" />
            Book a Pet Hotel Stay
          </DialogTitle>
          <DialogDescription>
            Reserve a boarding unit for your pet while you're away
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Pet */}
          <div className="space-y-2">
            <Label>Your Pet</Label>
            <Select value={selectedPet} onValueChange={setSelectedPet}>
              <SelectTrigger><SelectValue placeholder="Select pet" /></SelectTrigger>
              <SelectContent>
                {pets.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} ({p.breed})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Branch */}
          <div className="space-y-2">
            <Label>Branch</Label>
            <Select value={selectedBranch} onValueChange={(v) => { setSelectedBranch(v); setSelectedUnit('') }}>
              <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates — pick first so we can show correct available units */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Check-in Date</Label>
              <Input type="date" min={today} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Check-out Date</Label>
              <Input type="date" min={checkIn || today} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </div>
          </div>

          {/* Available units — loads once branch + both dates are selected */}
          {selectedBranch && checkIn && checkOut && (
            <div className="space-y-2">
              <Label>Available Units</Label>
              {loadingUnits ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading units...
                </div>
              ) : units.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No available units at this branch for those dates</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {units.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUnit(String(u.id))}
                      className={cn(
                        'p-3 rounded-lg border text-center transition-colors',
                        selectedUnit === String(u.id)
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      )}
                    >
                      <p className="font-medium text-sm">{u.size}</p>
                      <p className="text-xs text-muted-foreground">Unit #{u.id}</p>
                      {selectedUnit === String(u.id) && (
                        <Badge className="mt-1 bg-primary/10 text-primary border-0 text-xs">Selected</Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Feeding instructions */}
          <div className="space-y-2">
            <Label>Feeding Instructions <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea
              placeholder="e.g. 2x daily, dry food only, no treats..."
              value={feedingInstructions}
              onChange={(e) => setFeedingInstructions(e.target.value)}
              rows={2}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedPet || !selectedUnit || !checkIn || !checkOut || saving}
          >
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Booking...</> : 'Confirm Booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
