'use client'

import { useState, useEffect } from 'react'
import { boardingApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Wrench, LogOut, Hotel } from 'lucide-react'
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

  const load = () => {
    setLoading(true)
    boardingApi.list(branchId, false)
      .then(setUnits)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [branchId])

  const handleCheckout = async (id: string) => {
    setActionLoading(id)
    try {
      await boardingApi.checkout(id)
      load()
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(null)
    }
  }

  const handleMaintenance = async (id: string, currentStatus: string) => {
    setActionLoading(id)
    const goingIntoMaintenance = currentStatus !== 'maintenance'
    try {
      await boardingApi.toggleMaintenance(id, goingIntoMaintenance)
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

      {/* Units table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Hotel className="w-5 h-5 text-primary" />
            Boarding Units
          </CardTitle>
        </CardHeader>
        <CardContent>
          {units.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No boarding units found for this branch.</p>
          ) : (
            <div className="space-y-3">
              {units.map((unit) => (
                <div key={unit.id} className="flex items-center gap-4 p-4 rounded-lg border">
                  {/* Unit info */}
                  <div className="w-20 text-center shrink-0">
                    <p className="font-bold text-lg">#{unit.id}</p>
                    <p className="text-xs text-muted-foreground">{unit.size}</p>
                  </div>

                  {/* Status + pet */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={cn('text-xs capitalize', statusStyle[unit.status])}>
                        {unit.status}
                      </Badge>
                      {unit.petName && (
                        <span className="text-sm font-medium">{unit.petName}</span>
                      )}
                    </div>
                    {unit.checkInDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {unit.checkInDate} → {unit.checkOutDate}
                      </p>
                    )}
                    {unit.feedingInstructions && (
                      <p className="text-xs text-muted-foreground mt-0.5 italic truncate max-w-xs">
                        {unit.feedingInstructions}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    {unit.status === 'occupied' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        disabled={actionLoading === String(unit.id)}
                        onClick={() => handleCheckout(String(unit.id))}
                      >
                        {actionLoading === String(unit.id)
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <><LogOut className="w-3 h-3 mr-1" />Check Out</>}
                      </Button>
                    )}
                    {unit.status !== 'occupied' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className={cn(
                          unit.status === 'maintenance'
                            ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            : 'border-amber-200 text-amber-700 hover:bg-amber-50'
                        )}
                        disabled={actionLoading === String(unit.id)}
                        onClick={() => handleMaintenance(String(unit.id), unit.status)}
                      >
                        {actionLoading === String(unit.id)
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : unit.status === 'maintenance'
                            ? <><Wrench className="w-3 h-3 mr-1" />Remove Maintenance</>
                            : <><Wrench className="w-3 h-3 mr-1" />Maintenance</>}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
