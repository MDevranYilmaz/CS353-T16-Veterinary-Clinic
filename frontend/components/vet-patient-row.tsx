"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertTriangle, PawPrint, Syringe } from 'lucide-react'
import type { Pet } from '@/lib/types'

interface VetPatientRowProps {
  pet: Pet
  onViewRecords?: (petId: string) => void
}

export function VetPatientRow({ pet, onViewRecords }: VetPatientRowProps) {
  const hasAlerts = (pet.medicalAlerts?.length || 0) > 0

  return (
    <Card className="p-0">
      <CardContent className="flex items-center gap-4 p-4">
        <Avatar className="w-12 h-12">
          {pet.imageUrl ? (
            <AvatarImage src={pet.imageUrl} alt={pet.name} />
          ) : (
            <AvatarFallback>{pet.name?.slice(0,2)}</AvatarFallback>
          )}
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="font-medium truncate">{pet.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{pet.breed || pet.species}</p>
            {hasAlerts && <Badge variant="destructive" className="text-xs">Alerts</Badge>}
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
            <span>{pet.age} yr</span>
            <span>{pet.weight ?? '—'} kg</span>
            {pet.lastVisit && <span>Last: {pet.lastVisit}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => onViewRecords?.(pet.id)}>
            <Syringe className="w-4 h-4 mr-2" /> Records
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
