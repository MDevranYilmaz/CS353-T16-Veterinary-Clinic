'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { petApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Dog, Cat, Bird, Loader2, PawPrint } from 'lucide-react'
import { cn } from '@/lib/utils'

const speciesOptions = [
  { value: 'dog', label: 'Dog', Icon: Dog },
  { value: 'cat', label: 'Cat', Icon: Cat },
  { value: 'bird', label: 'Bird', Icon: Bird },
  { value: 'rabbit', label: 'Rabbit', Icon: PawPrint },
  { value: 'other', label: 'Other', Icon: PawPrint },
]

interface AddPetFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function AddPetForm({ onSuccess, onCancel }: AddPetFormProps) {
  const { user } = useAuth()
  const [species, setSpecies] = useState('')
  const [name, setName] = useState('')
  const [breed, setBreed] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [allergies, setAllergies] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !name.trim()) return
    setSaving(true)
    setError('')
    try {
      await petApi.create({
        name: name.trim(),
        owner_id: Number(user.userId),
        breed: breed.trim() || undefined,
        birth_date: birthDate || undefined,
        allergies: allergies.trim() || undefined,
      })
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to add pet. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Button variant="ghost" onClick={onCancel} className="-ml-2">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to My Pets
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Add New Pet</CardTitle>
          <CardDescription>Register a new pet to your profile</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Species */}
            <div className="space-y-2">
              <Label>Species</Label>
              <div className="grid grid-cols-5 gap-2">
                {speciesOptions.map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSpecies(value)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-colors',
                      species === value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'hover:bg-muted/50 text-muted-foreground'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="pet-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pet-name"
                placeholder="e.g. Buddy"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Breed */}
            <div className="space-y-2">
              <Label htmlFor="pet-breed">Breed</Label>
              <Input
                id="pet-breed"
                placeholder="e.g. Golden Retriever"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
              />
            </div>

            {/* Birth Date */}
            <div className="space-y-2">
              <Label htmlFor="pet-dob">Date of Birth</Label>
              <Input
                id="pet-dob"
                type="date"
                value={birthDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>

            {/* Allergies */}
            <div className="space-y-2">
              <Label htmlFor="pet-allergies">Known Allergies</Label>
              <Textarea
                id="pet-allergies"
                placeholder="e.g. Chicken, Penicillin  (comma-separated)"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                rows={2}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={saving}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim() || saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Pet'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
