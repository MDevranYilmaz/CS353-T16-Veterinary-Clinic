'use client'

import type { Pet } from '@/lib/types'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertTriangle,
  Calendar,
  Dog,
  Cat,
  Bird,
  Rabbit,
  MoreHorizontal,
  Syringe,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface PetCardProps {
  pet: Pet
  onViewDetails?: () => void
  onBookAppointment?: () => void
  onViewRecords?: () => void
  compact?: boolean
}

const speciesIcons: Record<string, React.ElementType> = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
  rabbit: Rabbit,
  other: Dog,
}

export function PetCard({ pet, onViewDetails, onBookAppointment, onViewRecords, compact }: PetCardProps) {
  const SpeciesIcon = speciesIcons[pet.species] || Dog
  const hasAlerts = pet.allergies.length > 0 || pet.medicalAlerts.length > 0

  const getVaccinationBadge = () => {
    switch (pet.vaccinationStatus) {
      case 'up-to-date':
        return <Badge className="bg-primary/10 text-primary border-0">Up to date</Badge>
      case 'due-soon':
        return <Badge className="bg-warning/10 text-warning-foreground border-0">Due soon</Badge>
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>
    }
  }

  if (compact) {
    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={onViewDetails}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 rounded-xl">
              <AvatarImage src={pet.imageUrl} alt={pet.name} className="object-cover" />
              <AvatarFallback className="rounded-xl bg-muted">
                <SpeciesIcon className="w-6 h-6 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{pet.name}</h3>
                {hasAlerts && <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />}
              </div>
              <p className="text-sm text-muted-foreground">{pet.breed}</p>
            </div>
            {getVaccinationBadge()}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        <div className="relative h-40 bg-muted">
          {pet.imageUrl ? (
            <img
              src={pet.imageUrl}
              alt={pet.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <SpeciesIcon className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
          <div className="absolute top-3 right-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="w-8 h-8 bg-card/90 backdrop-blur-sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onViewDetails}>View Details</DropdownMenuItem>
                <DropdownMenuItem onClick={onViewRecords}>Medical Records</DropdownMenuItem>
                <DropdownMenuItem onClick={onBookAppointment}>Book Appointment</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {hasAlerts && (
            <div className="absolute top-3 left-3">
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="w-3 h-3" />
                Medical Alert
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg">{pet.name}</h3>
              <p className="text-sm text-muted-foreground">{pet.breed}</p>
            </div>
            {getVaccinationBadge()}
          </div>

          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{pet.age} years old</span>
            <span>{pet.weight} kg</span>
          </div>

          {/* Allergies & Alerts */}
          {(pet.allergies.length > 0 || pet.medicalAlerts.length > 0) && (
            <div className="space-y-2 pt-2 border-t">
              {pet.allergies.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-destructive mb-1">Allergies</p>
                  <div className="flex flex-wrap gap-1">
                    {pet.allergies.map((allergy, i) => (
                      <Badge key={i} variant="outline" className="text-xs border-destructive/30 text-destructive">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {pet.medicalAlerts.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-warning-foreground mb-1">Medical Notes</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {pet.medicalAlerts.map((alert, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-warning-foreground">•</span>
                        {alert}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button size="sm" className="flex-1 gap-1.5" onClick={onBookAppointment}>
              <Calendar className="w-4 h-4" />
              Book Visit
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={onViewRecords}>
              <Syringe className="w-4 h-4" />
              Records
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
