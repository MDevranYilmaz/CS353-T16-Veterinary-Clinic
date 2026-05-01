'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { petApi, branchApi, vetApi, appointmentApi } from '@/lib/api'
import type { Pet, Branch, Veterinarian } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Check,
  Clock,
  Dog,
  Cat,
  MapPin,
  Star,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppointmentWizardProps {
  onComplete: () => void
  onCancel: () => void
}

const appointmentTypes = [
  { id: 'checkup', label: 'General Checkup', description: 'Routine health examination' },
  { id: 'vaccination', label: 'Vaccination', description: 'Scheduled immunizations' },
  { id: 'surgery', label: 'Surgery', description: 'Surgical procedures' },
  { id: 'emergency', label: 'Emergency', description: 'Urgent care needed' },
  { id: 'followup', label: 'Follow-up', description: 'Post-treatment checkup' },
]

const fallbackSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
]

export function AppointmentWizard({ onComplete, onCancel }: AppointmentWizardProps) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [selectedPet, setSelectedPet] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [selectedVet, setSelectedVet] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [ownerPets, setOwnerPets] = useState<Pet[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [vets, setVets] = useState<Veterinarian[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>(fallbackSlots)
  const [loadingPets, setLoadingPets] = useState(false)
  const [loadingVets, setLoadingVets] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)

  useEffect(() => {
    if (!user) return
    setLoadingPets(true)
    Promise.all([
      petApi.list(user.userId),
      branchApi.list(),
    ]).then(([pets, branchList]) => {
      setOwnerPets(pets)
      setBranches(branchList)
    }).catch(console.error).finally(() => setLoadingPets(false))
  }, [user])

  useEffect(() => {
    if (!selectedBranch) return
    setLoadingVets(true)
    setSelectedVet('')
    vetApi.list({ branch_id: selectedBranch })
      .then(setVets)
      .catch(console.error)
      .finally(() => setLoadingVets(false))
  }, [selectedBranch])

  useEffect(() => {
    if (!selectedVet || !selectedDate) return
    const dateStr = selectedDate.toISOString().slice(0, 10)
    setLoadingSlots(true)
    setSelectedTime('')
    vetApi.availableSlots(selectedVet, dateStr)
      .then((slots) => setAvailableSlots(slots.length > 0 ? slots : fallbackSlots))
      .catch(() => setAvailableSlots(fallbackSlots))
      .finally(() => setLoadingSlots(false))
  }, [selectedVet, selectedDate])

  const canProceed = () => {
    switch (step) {
      case 1: return selectedPet && selectedType
      case 2: return selectedBranch && selectedVet
      case 3: return selectedDate && selectedTime
      case 4: return true
      default: return false
    }
  }

  const handleNext = async () => {
    if (step < 4 && canProceed()) {
      setStep(step + 1)
    } else if (step === 4) {
      if (!selectedDate) return
      setSubmitting(true)
      try {
        const dateStr = selectedDate.toISOString().slice(0, 10)
        await appointmentApi.book({
          date_time: `${dateStr} ${selectedTime}:00`,
          pet_id: Number(selectedPet),
          vet_id: Number(selectedVet),
        })
        onComplete()
      } catch (e) {
        console.error('[AppointmentWizard] booking error:', e)
      } finally {
        setSubmitting(false)
      }
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const selectedPetData = ownerPets.find((p) => p.id === selectedPet)
  const selectedVetData = vets.find((v) => v.id === selectedVet)
  const selectedBranchData = branches.find((b) => b.id === selectedBranch)
  const selectedTypeData = appointmentTypes.find((t) => t.id === selectedType)

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between px-4">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full font-medium transition-colors',
                s <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}
            >
              {s < step ? <Check className="w-5 h-5" /> : s}
            </div>
            {s < 4 && (
              <div className={cn('w-16 md:w-24 h-1 mx-2', s < step ? 'bg-primary' : 'bg-muted')} />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && 'Select Pet & Appointment Type'}
            {step === 2 && 'Choose Location & Veterinarian'}
            {step === 3 && 'Pick Date & Time'}
            {step === 4 && 'Review & Confirm'}
          </CardTitle>
          <CardDescription>
            {step === 1 && 'Who needs care and what type of visit?'}
            {step === 2 && 'Select your preferred clinic and doctor'}
            {step === 3 && 'Choose a convenient appointment slot'}
            {step === 4 && 'Review your appointment details'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Pet & Type Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Select Pet</Label>
                {loadingPets ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : ownerPets.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No pets found. Add a pet first.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {ownerPets.map((pet) => {
                      const Icon = pet.species === 'dog' ? Dog : Cat
                      return (
                        <button
                          key={pet.id}
                          onClick={() => setSelectedPet(pet.id)}
                          className={cn(
                            'flex items-center gap-3 p-4 rounded-lg border text-left transition-colors',
                            selectedPet === pet.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                          )}
                        >
                          <Avatar className="w-12 h-12 rounded-xl">
                            <AvatarFallback className="rounded-xl bg-muted">
                              <Icon className="w-6 h-6 text-muted-foreground" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{pet.name}</p>
                            <p className="text-sm text-muted-foreground">{pet.breed}</p>
                          </div>
                          {selectedPet === pet.id && (
                            <Check className="w-5 h-5 text-primary ml-auto" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label>Appointment Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {appointmentTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={cn(
                        'flex flex-col p-4 rounded-lg border text-left transition-colors',
                        selectedType === type.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{type.label}</p>
                        {selectedType === type.id && <Check className="w-5 h-5 text-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location & Vet Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Select Branch</Label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a clinic location" />
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

              <div className="space-y-3">
                <Label>Select Veterinarian</Label>
                {!selectedBranch ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Select a branch first to see available veterinarians.
                  </p>
                ) : loadingVets ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : vets.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No veterinarians available at this branch.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {vets.map((vet) => (
                      <button
                        key={vet.id}
                        onClick={() => setSelectedVet(vet.id)}
                        className={cn(
                          'flex items-center gap-4 w-full p-4 rounded-lg border text-left transition-colors',
                          selectedVet === vet.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                        )}
                      >
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {vet.name.split(' ').map((n) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{vet.name}</p>
                          <p className="text-sm text-muted-foreground">{vet.specialization}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Star className="w-3 h-3 fill-warning text-warning" />
                            <span className="text-xs">{vet.rating ? vet.rating.toFixed(1) : '–'}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{vet.branchName}</span>
                          </div>
                        </div>
                        {selectedVet === vet.id && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Date & Time Selection */}
          {step === 3 && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label>Select Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className="rounded-lg border p-3"
                />
              </div>

              <div className="space-y-3">
                <Label>Select Time</Label>
                {loadingSlots ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={cn(
                          'flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors',
                          selectedTime === time
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'hover:bg-muted/50'
                        )}
                      >
                        <Clock className="w-4 h-4" />
                        {time}
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-2 mt-4">
                  <Label>Additional Notes (Optional)</Label>
                  <Textarea
                    placeholder="Any specific concerns or information..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-2">Pet</p>
                    {selectedPetData && (
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 rounded-lg">
                          <AvatarFallback className="rounded-lg bg-muted">
                            {selectedPetData.species === 'dog' ? (
                              <Dog className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <Cat className="w-5 h-5 text-muted-foreground" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{selectedPetData.name}</p>
                          <p className="text-sm text-muted-foreground">{selectedPetData.breed}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-2">Appointment Type</p>
                    {selectedTypeData && (
                      <div>
                        <p className="font-medium">{selectedTypeData.label}</p>
                        <p className="text-sm text-muted-foreground">{selectedTypeData.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-2">Veterinarian</p>
                    {selectedVetData && (
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {selectedVetData.name.split(' ').map((n) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{selectedVetData.name}</p>
                          <p className="text-sm text-muted-foreground">{selectedVetData.specialization}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-2">Date & Time</p>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-primary" />
                        <span className="font-medium">
                          {selectedDate?.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="font-medium">{selectedTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-2">Location</p>
                    {selectedBranchData && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <div>
                          <p className="font-medium">{selectedBranchData.name}</p>
                          <p className="text-sm text-muted-foreground">{selectedBranchData.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {notes && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm">{notes}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={step === 1 ? onCancel : handleBack} disabled={submitting}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {step === 1 ? 'Cancel' : 'Back'}
        </Button>
        <Button onClick={handleNext} disabled={!canProceed() || submitting}>
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Booking...
            </>
          ) : step === 4 ? (
            'Confirm Booking'
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
