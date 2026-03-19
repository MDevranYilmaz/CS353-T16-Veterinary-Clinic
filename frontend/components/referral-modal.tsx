'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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
import { veterinarians, branches, pets } from '@/lib/mock-data'
import { ArrowLeftRight, MapPin, Star, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReferralModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentVetId: string
  onSubmit: (referral: {
    toVetId: string
    petId: string
    reason: string
  }) => void
}

export function ReferralModal({ open, onOpenChange, currentVetId, onSubmit }: ReferralModalProps) {
  const [selectedPet, setSelectedPet] = useState<string>('')
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [selectedVet, setSelectedVet] = useState<string>('')
  const [reason, setReason] = useState('')

  const availableVets = veterinarians.filter(
    (v) =>
      v.id !== currentVetId &&
      v.available &&
      (selectedBranch === '' || v.branchId === selectedBranch)
  )

  const handleSubmit = () => {
    if (selectedPet && selectedVet && reason) {
      onSubmit({
        toVetId: selectedVet,
        petId: selectedPet,
        reason,
      })
      // Reset form
      setSelectedPet('')
      setSelectedBranch('')
      setSelectedVet('')
      setReason('')
      onOpenChange(false)
    }
  }

  const selectedVetData = veterinarians.find((v) => v.id === selectedVet)

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
          {/* Select Patient */}
          <div className="space-y-2">
            <Label>Patient</Label>
            <Select value={selectedPet} onValueChange={setSelectedPet}>
              <SelectTrigger>
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {pets.map((pet) => (
                  <SelectItem key={pet.id} value={pet.id}>
                    <div className="flex items-center gap-2">
                      <span>{pet.name}</span>
                      <span className="text-muted-foreground">
                        ({pet.breed} - {pet.ownerName})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Select Branch */}
          <div className="space-y-2">
            <Label>Destination Branch</Label>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger>
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{branch.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Select Specialist */}
          <div className="space-y-2">
            <Label>Specialist</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableVets.length > 0 ? (
                availableVets.map((vet) => (
                  <button
                    key={vet.id}
                    onClick={() => setSelectedVet(vet.id)}
                    className={cn(
                      'flex items-center gap-3 w-full p-3 rounded-lg border text-left transition-colors',
                      selectedVet === vet.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    )}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={vet.avatar} alt={vet.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {vet.name.split(' ').map((n) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{vet.name}</p>
                      <p className="text-xs text-muted-foreground">{vet.specialization}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Star className="w-3 h-3 fill-warning text-warning" />
                        <span className="text-xs">{vet.rating}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{vet.branchName}</span>
                      </div>
                    </div>
                    {selectedVet === vet.id && (
                      <Badge className="bg-primary/10 text-primary border-0">Selected</Badge>
                    )}
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No specialists available at this branch
                </p>
              )}
            </div>
          </div>

          {/* Reason for Referral */}
          <div className="space-y-2">
            <Label>Reason for Referral</Label>
            <Textarea
              placeholder="Describe the reason for this referral..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Selected Specialist Preview */}
          {selectedVetData && (
            <div className="p-3 rounded-lg bg-muted/50 space-y-1">
              <p className="text-xs text-muted-foreground">Referring to:</p>
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={selectedVetData.avatar} alt={selectedVetData.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {selectedVetData.name.split(' ').map((n) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{selectedVetData.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedVetData.specialization} at {selectedVetData.branchName}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedPet || !selectedVet || !reason}
          >
            Create Referral
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
