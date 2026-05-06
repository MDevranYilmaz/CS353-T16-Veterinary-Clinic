'use client'

import { useState, useEffect } from 'react'
import { boardingApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2, Wrench, LogOut, Hotel, Calendar, UtensilsCrossed, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BoardingTableProps {
  branchId: string | number
}

const statusStyle: Record<string, string> = {
  available:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  occupied:    'bg-amber-50 text-amber-700 border-amber-200',
  maintenance: 'bg-red-50 text-red-700 border-red-200',
}

export function BoardingTable({ branchId }: BoardingTableProps) {
  const [units, setUnits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmCheckout, setConfirmCheckout] = useState<any | null>(null)
  const [confirmMaintenance, setConfirmMaintenance] = useState<any | null>(null)

  const load = () => {
    setLoading(true)
    boardingApi.list(branchId, false)
      .then(setUnits)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [branchId])

  const handleCheckout = async (unit: any) => {
    setActionLoading(String(unit.id))
    setConfirmCheckout(null)
    try {
      await boardingApi.checkout(unit.id)
      load()
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(null)
    }
  }

  const handleMaintenance = async (unit: any) => {
    setActionLoading(String(unit.id))
    setConfirmMaintenance(null)
    const goingIntoMaintenance = unit.status !== 'maintenance'
    try {
      await boardingApi.toggleMaintenance(unit.id, goingIntoMaintenance)
      load()
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(null)
    }
  }

  const summary = {
    available:   units.filter((u) => u.status === 'available').length,
    occupied:    units.filter((u) => u.status === 'occupied').length,
    maintenance: units.filter((u) => u.status === 'maintenance').length,
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Available', count: summary.available, style: 'text-emerald-700' },
          { label: 'Occupied', count: summary.occupied, style: 'text-amber-700' },
          { label: 'Maintenance', count: summary.maintenance, style: 'text-red-700' },
        ].map(({ label, count, style }) => (
          <Card key={label}>
            <CardContent className="pt-6 text-center">
              <p className={cn('text-3xl font-bold', style)}>{count}</p>
              <p className="text-sm text-muted-foreground mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Units list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Hotel className="w-5 h-5 text-primary" />
            Boarding Units
          </CardTitle>
        </CardHeader>
        <CardContent>
          {units.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No boarding units at this branch.</p>
          ) : (
            <div className="space-y-3">
              {units.map((unit) => (
                <div key={unit.id} className={cn(
                  'p-4 rounded-lg border space-y-3',
                  unit.status === 'occupied' && 'border-amber-200 bg-amber-50/30',
                  unit.status === 'maintenance' && 'border-red-200 bg-red-50/30',
                )}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-muted flex flex-col items-center justify-center shrink-0">
                        <p className="font-bold text-sm">#{unit.id}</p>
                        <p className="text-xs text-muted-foreground">{unit.size}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn('text-xs capitalize', statusStyle[unit.status])}>
                            {unit.status}
                          </Badge>
                        </div>
                        {unit.pet_name && (
                          <p className="font-medium text-sm mt-1">{unit.pet_name}</p>
                        )}
                        {unit.owner_name && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3" />{unit.owner_name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 shrink-0">
                      {unit.status === 'occupied' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          disabled={actionLoading === String(unit.id)}
                          onClick={() => setConfirmCheckout(unit)}
                        >
                          {actionLoading === String(unit.id)
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <><LogOut className="w-3 h-3 mr-1" />Check Out</>}
                        </Button>
                      )}
                      {unit.status === 'available' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-amber-200 text-amber-700 hover:bg-amber-50"
                          disabled={actionLoading === String(unit.id)}
                          onClick={() => setConfirmMaintenance(unit)}
                        >
                          {actionLoading === String(unit.id)
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <><Wrench className="w-3 h-3 mr-1" />Mark Maintenance</>}
                        </Button>
                      )}
                      {unit.status === 'maintenance' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          disabled={actionLoading === String(unit.id)}
                          onClick={() => setConfirmMaintenance(unit)}
                        >
                          {actionLoading === String(unit.id)
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <><Wrench className="w-3 h-3 mr-1" />Mark Available</>}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Details row */}
                  {(unit.check_in_date || unit.feeding_instructions) && (
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-1 border-t">
                      {unit.check_in_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {unit.check_in_date} → {unit.check_out_date}
                        </span>
                      )}
                      {unit.feeding_instructions && (
                        <span className="flex items-center gap-1">
                          <UtensilsCrossed className="w-3.5 h-3.5" />
                          {unit.feeding_instructions}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Check out confirmation */}
      <AlertDialog open={!!confirmCheckout} onOpenChange={(o) => !o && setConfirmCheckout(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Check out {confirmCheckout?.pet_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will free up Unit #{confirmCheckout?.id} ({confirmCheckout?.size}) and mark it as available.
              The pet's stay record will be cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleCheckout(confirmCheckout)}>
              Confirm Check Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Maintenance confirmation */}
      <AlertDialog open={!!confirmMaintenance} onOpenChange={(o) => !o && setConfirmMaintenance(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmMaintenance?.status === 'maintenance' ? 'Mark unit as available?' : 'Mark unit for maintenance?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmMaintenance?.status === 'maintenance'
                ? `Unit #${confirmMaintenance?.id} will be made available for booking again.`
                : `Unit #${confirmMaintenance?.id} (${confirmMaintenance?.size}) will be taken out of service and cannot be booked until maintenance is complete.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleMaintenance(confirmMaintenance)}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
