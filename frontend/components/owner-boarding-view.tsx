'use client'

import { useState, useEffect } from 'react'
import { boardingApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Hotel, MapPin, Calendar, UtensilsCrossed, Loader2 } from 'lucide-react'
import { BoardingBookModal } from '@/components/boarding-book-modal'
import type { Pet } from '@/lib/types'

interface OwnerBoardingViewProps {
  pets: Pet[]
  boardingModal: boolean
  setBoardingModal: (v: boolean) => void
}

export function OwnerBoardingView({ pets, boardingModal, setBoardingModal }: OwnerBoardingViewProps) {
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    boardingApi.myReservations()
      .then(setReservations)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pet Hotel</h1>
          <p className="text-muted-foreground">Book a comfortable stay for your pet while you're away</p>
        </div>
        <Button onClick={() => setBoardingModal(true)}>
          <Hotel className="w-4 h-4 mr-2" />Book a Stay
        </Button>
      </div>

      {/* Current reservations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Hotel className="w-5 h-5 text-primary" />
            Your Reservations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Hotel className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No active reservations</p>
              <p className="text-sm mt-1">Book a stay for your pet using the button above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reservations.map((r) => (
                <div key={r.id} className="p-4 rounded-lg border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{r.pet_name}</p>
                      <Badge variant="outline" className="text-xs mt-1 bg-amber-50 text-amber-700 border-amber-200">
                        {r.size} Unit
                      </Badge>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                      Active Stay
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span>{r.branch_name}</span>
                    </div>
                    {r.check_in_date && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span>{r.check_in_date} → {r.check_out_date}</span>
                      </div>
                    )}
                  </div>
                  {r.feeding_instructions && (
                    <div className="flex items-start gap-2 text-sm bg-muted/40 rounded-md p-2">
                      <UtensilsCrossed className="w-4 h-4 shrink-0 text-muted-foreground mt-0.5" />
                      <span className="text-muted-foreground">{r.feeding_instructions}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <BoardingBookModal
        open={boardingModal}
        onOpenChange={setBoardingModal}
        pets={pets}
        onSuccess={() => { setBoardingModal(false); load() }}
      />
    </div>
  )
}
