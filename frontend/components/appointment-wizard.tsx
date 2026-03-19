'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  pets,
  veterinarians,
  branches,
} from '@/lib/mock-data'
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
  User,
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

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
]

export function AppointmentWizard({ onComplete, onCancel }: AppointmentWizardProps) {
  const [step, setStep] = useState(1)
  const [selectedPet, setSelectedPet] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [selectedVet, setSelectedVet] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [notes, setNotes] = useState('')

  const ownerPets = pets.filter((p) => p.ownerId === 'o1')
  const filteredVets = selectedBranch
    ? veterinarians.filter((v) => v.branchId === selectedBranch)
    : veterinarians

  const canProceed = () => {
    switch (step) {
      case 1:
        return selectedPet && selectedType
      case 2:
        return selectedBranch && selectedVet
      case 3:
        return selectedDate && selectedTime
      case 4:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (step < 4 && canProceed()) {
      setStep(step + 1)
    } else if (step === 4) {
      // Submit appointment
      console.log('[v0] Appointment created:', {
        petId: selectedPet,
        type: selectedType,
        branchId: selectedBranch,
        vetId: selectedVet,
        date: selectedDate,
        time: selectedTime,
        notes,
      })
      onComplete()
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const selectedPetData = ownerPets.find((p) => p.id === selectedPet)
  const selectedVetData = veterinarians.find((v) => v.id === selectedVet)
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
                s < step
                  ? 'bg-primary text-primary-foreground'
                  : s === step
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {s < step ? <Check className="w-5 h-5" /> : s}
            </div>
            {s < 4 && (
              <div
                className={cn(
                  'w-16 md:w-24 h-1 mx-2',
                  s < step ? 'bg-primary' : 'bg-muted'
                )}
              />
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
                <div className="grid grid-cols-2 gap-3">
                  {ownerPets.map((pet) => {
                    const Icon = pet.species === 'dog' ? Dog : Cat
                    return (
                      <button
                        key={pet.id}
                        onClick={() => setSelectedPet(pet.id)}
                        className={cn(
                          'flex items-center gap-3 p-4 rounded-lg border text-left transition-colors',
                          selectedPet === pet.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        )}
                      >
                        <Avatar className="w-12 h-12 rounded-xl">
                          <AvatarImage src={pet.imageUrl} alt={pet.name} className="object-cover" />
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
                        selectedType === type.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{type.label}</p>
                        {selectedType === type.id && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
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
                <div className="space-y-3">
                  {filteredVets.map((vet) => (
                    <button
                      key={vet.id}
                      onClick={() => setSelectedVet(vet.id)}
                      disabled={!vet.available}
                      className={cn(
                        'flex items-center gap-4 w-full p-4 rounded-lg border text-left transition-colors',
                        selectedVet === vet.id
                          ? 'border-primary bg-primary/5'
                          : vet.available
                          ? 'hover:bg-muted/50'
                          : 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={vet.avatar} alt={vet.name} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {vet.name.split(' ').map((n) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{vet.name}</p>
                        <p className="text-sm text-muted-foreground">{vet.specialization}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Star className="w-3 h-3 fill-warning text-warning" />
                          <span className="text-xs">{vet.rating}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{vet.branchName}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={vet.available ? 'default' : 'secondary'}
                          className={cn(vet.available && 'bg-primary/10 text-primary border-0')}
                        >
                          {vet.available ? 'Available' : 'Unavailable'}
                        </Badge>
                        {selectedVet === vet.id && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
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
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((time) => (
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
                          <AvatarImage src={selectedPetData.imageUrl} alt={selectedPetData.name} className="object-cover" />
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
                          <AvatarImage src={selectedVetData.avatar} alt={selectedVetData.name} />
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
                    <div className="flex items-center gap-4">
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
        <Button variant="outline" onClick={step === 1 ? onCancel : handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {step === 1 ? 'Cancel' : 'Back'}
        </Button>
        <Button onClick={handleNext} disabled={!canProceed()}>
          {step === 4 ? 'Confirm Booking' : 'Continue'}
          {step < 4 && <ArrowRight className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </div>
  )
}
