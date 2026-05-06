'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ArrowLeftRight, Loader2, MapPin, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { vetApi, branchApi, referralApi } from '@/lib/api'
import type { Veterinarian, Branch, Pet } from '@/lib/types'

interface ReferralModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentVetId: string
  pets: Pet[]           // pass the vet's current patients
  onSubmit?: () => void // callback after success
}

export function ReferralModal({
  open, onOpenChange, currentVetId, pets, onSubmit,
}: ReferralModalProps) {
  const [branches, setBranches] = useState<Branch[]>([])
  const [vets, setVets] = useState<Veterinarian[]>([])
  const [selectedPet, setSelectedPet] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedVet, setSelectedVet] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Load branches on open
  useEffect(() => {
    if (!open) return
    branchApi.list().then(setBranches).catch(console.error)
  }, [open])

  // Load vets when branch is selected
  useEffect(() => {
    if (!selectedBranch) { setVets([]); return }
    setLoading(true)
    vetApi.list({ branch_id: selectedBranch })
      .then((data) => setVets(data.filter((v) => v.id !== currentVetId)))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedBranch, currentVetId])

  const handleSubmit = async () => {
    if (!selectedPet || !selectedVet || !reason.trim()) return
    setSaving(true)
    setError('')
    try {
      await referralApi.create({
        pet_id: Number(selectedPet),
        receiver_vet_id: Number(selectedVet),
        reason: reason.trim(),
        referral_date: new Date().toISOString().slice(0, 10),
      })
      // Reset
      setSelectedPet(''); setSelectedBranch('')
      setSelectedVet(''); setReason('')
      onOpenChange(false)
      onSubmit?.()
      window.dispatchEvent(new Event('referrals:updated'))
    } catch (e: any) {
      setError(e.message || 'Failed to create referral')
    } finally {
      setSaving(false)
    }
  }

  const selectedVetData = vets.find((v) => v.id === selectedVet)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
            Create Referral
          </DialogTitle>
          <DialogDescription>
            Refer a patient to a specialist at another branch
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Patient */}
          <div className="space-y-2">
            <Label>Patient</Label>
            <Select value={selectedPet} onValueChange={setSelectedPet}>
              <SelectTrigger>
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {pets.map((pet) => (
                  <SelectItem key={pet.id} value={pet.id}>
                    {pet.name} ({pet.breed})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Branch */}
          <div className="space-y-2">
            <Label>Destination Branch</Label>
            <Select value={selectedBranch} onValueChange={(v) => { setSelectedBranch(v); setSelectedVet('') }}>
              <SelectTrigger>
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      {b.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Specialist */}
          {selectedBranch && (
            <div className="space-y-2">
              <Label>Specialist</Label>
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading vets...
                </div>
              ) : vets.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No specialists at this branch</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {vets.map((vet) => (
                    <button
                      key={vet.id}
                      onClick={() => setSelectedVet(vet.id)}
                      className={cn(
                        'flex items-center gap-3 w-full p-3 rounded-lg border text-left transition-colors',
                        selectedVet === vet.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      )}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {vet.name.split(' ').map((n) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{vet.name}</p>
                        <p className="text-xs text-muted-foreground">{vet.specialization}</p>
                        {vet.rating > 0 && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Star className="w-3 h-3 fill-warning text-warning" />
                            <span className="text-xs">{vet.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      {selectedVet === vet.id && (
                        <Badge className="bg-primary/10 text-primary border-0">Selected</Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason for Referral</Label>
            <Textarea
              placeholder="Describe the reason for this referral..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedPet || !selectedVet || !reason.trim() || saving}
          >
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create Referral'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
