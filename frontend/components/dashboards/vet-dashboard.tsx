'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { appointmentApi, referralApi, vaccinationApi, inventoryApi, evaluationApi } from '@/lib/api'
import type { Appointment, Referral, VaccinationSchedule, Medicine } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PrescriptionModal } from '@/components/prescription-modal'
import { VaccinationModal } from '@/components/vaccination-modal'
import {
  Calendar, Clock, CheckCircle2, Stethoscope,
  ClipboardList, ArrowLeftRight, Syringe, Dog, Cat, Pill, Eye, Loader2, XCircle, Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface VetDashboardProps {
  onNavigate: (view: string) => void
  scheduleOnly?: boolean
  patientsOnly?: boolean
  recordsOnly?: boolean
  vaccinationsOnly?: boolean
  referralsOnly?: boolean
}

export function VetDashboard({
  onNavigate,
  scheduleOnly, patientsOnly, recordsOnly, vaccinationsOnly, referralsOnly,
}: VetDashboardProps) {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [overdueVax, setOverdueVax] = useState<VaccinationSchedule[]>([])
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)

  const [vetRating, setVetRating] = useState<{ avg_rating: number; total: number } | null>(null)

  useEffect(() => {
    if (!user?.userId) return
    evaluationApi.forVet(user.userId)
      .then((data: any) => setVetRating(data?.rating ?? null))
      .catch(console.error)
  }, [user])

  const [prescriptionModal, setPrescriptionModal] = useState<{
    open: boolean; petName: string; petId: string
  }>({ open: false, petName: '', petId: '' })

  const [vaccinationModal, setVaccinationModal] = useState<{
    open: boolean; petName: string; petId: string
  }>({ open: false, petName: '', petId: '' })

  const today = new Date().toISOString().slice(0, 10)

  const loadData = () => {
    if (!user) return
    setLoading(true)
    Promise.all([
      appointmentApi.listByVet(user.userId, today),
      referralApi.list({ vet_id: String(user.userId) }),
      vaccinationApi.overdue(user.branchId ?? undefined),
      user.branchId ? inventoryApi.listByBranch(user.branchId) : Promise.resolve([]),
    ]).then(([appts, refs, vax, meds]) => {
      setAppointments(appts)
      setReferrals(refs)
      setOverdueVax(vax)
      setMedicines(meds)
    }).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [user])

  useEffect(() => {
    const handler = () => {
      try {
        loadData()
      } catch (e) {
        console.error('[VetDashboard] reload on event error:', e)
      }
    }
    window.addEventListener('appointments:updated', handler)
    window.addEventListener('referrals:updated', handler)
    return () => {
      window.removeEventListener('appointments:updated', handler)
      window.removeEventListener('referrals:updated', handler)
    }
  }, [user])

  const handleStatusUpdate = async (id: string, status: 'Completed' | 'Cancelled') => {
    try {
      await appointmentApi.updateStatus(id, status)
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: status.toLowerCase() as Appointment['status'] } : a
        )
      )
    } catch (e) {
      console.error('[VetDashboard] status update error:', e)
    }
  }

  const pendingReferrals = referrals.filter(
    (r) => r.status === 'pending' && r.toVetId === String(user?.userId)
  )

  const handleReferralAction = async (id: string, action: 'Accepted' | 'Rejected') => {
    try {
      await referralApi.updateStatus(id, action)
      setReferrals((prev) =>
        prev.map((r) => r.id === id ? { ...r, status: action === 'Accepted' ? 'accepted' : 'pending' } : r)
      )
    } catch (e) {
      console.error('[VetDashboard] referral action error:', e)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-accent/10 text-accent border-0'
      case 'in-progress': return 'bg-warning/10 text-warning-foreground border-0'
      case 'completed': return 'bg-primary/10 text-primary border-0'
      case 'cancelled': return 'bg-muted text-muted-foreground border-0'
      default: return ''
    }
  }

  const getReferralStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'pending':  return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200'
      default:         return 'bg-muted text-muted-foreground'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // ── Sub-views ──────────────────────────────────────────────────────────────

  if (vaccinationsOnly) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Overdue Vaccinations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {overdueVax.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No overdue vaccinations</p>
          ) : overdueVax.map((vax) => (
            <div key={vax.id} className="flex items-center gap-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10">
                <Syringe className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{vax.petName}</p>
                <p className="text-xs text-muted-foreground">{vax.vaccineName}</p>
                <p className="text-xs text-destructive">Due: {vax.dueDate}</p>
              </div>
              <Button
                size="sm"
                onClick={() => setVaccinationModal({ open: true, petName: vax.petName, petId: vax.petId })}
              >
                <Syringe className="w-3 h-3 mr-1" />Vaccinate
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (referralsOnly) {
    return (
      <Card>
        <CardContent className="p-6">
          {referrals.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No referrals found.</p>
          ) : (
            <div className="space-y-3">
              {referrals.map((ref) => (
                <div key={ref.id} className="p-3 rounded-lg border space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{ref.petName}</p>
                    <Badge variant="outline" className={cn('text-xs capitalize', getReferralStatusStyle(ref.status))}>{ref.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{ref.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    {ref.fromVetId === String(user?.userId)
                      ? `To: ${ref.toVetName}`
                      : `From: ${ref.fromVetName}`}
                  </p>
                  {ref.status === 'pending' && ref.toVetId === String(user?.userId) && (
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => handleReferralAction(ref.id, 'Accepted')}>
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleReferralAction(ref.id, 'Rejected')}>
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // ── Full Dashboard ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Good Morning, {user?.fullName}</h1>
          <p className="text-muted-foreground">
            You have {appointments.filter((a) => a.status === 'scheduled').length} appointments scheduled for today
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onNavigate('schedule')}>
            <Calendar className="w-4 h-4 mr-2" />View Schedule
          </Button>
          <Button onClick={() => onNavigate('patients')}>
            <ClipboardList className="w-4 h-4 mr-2" />Patient Records
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {vetRating && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-warning text-warning" />
                <div>
                  <p className="text-2xl font-bold">{Number(vetRating.avg_rating).toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">{vetRating.total} reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {[
          { icon: Calendar, value: appointments.length, label: 'Today', color: 'bg-primary/10 text-primary' },
          { icon: Stethoscope, value: appointments.filter((a) => a.status === 'scheduled').length, label: 'Upcoming', color: 'bg-accent/10 text-accent' },
          { icon: ArrowLeftRight, value: pendingReferrals.length, label: 'Referrals', color: 'bg-warning/10 text-warning-foreground' },
          { icon: CheckCircle2, value: appointments.filter((a) => a.status === 'completed').length, label: 'Completed', color: 'bg-primary/10 text-primary' },
        ].map(({ icon: Icon, value, label, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('flex items-center justify-center w-10 h-10 rounded-xl', color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Today's Schedule</CardTitle>
                <CardDescription>Your appointments for today</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('schedule')}>
                Full schedule
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No appointments today.</p>
            ) : (
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>

                {(['all', 'scheduled', 'completed'] as const).map((tab) => (
                  <TabsContent key={tab} value={tab} className="space-y-3">
                    {appointments
                      .filter((a) => tab === 'all' || a.status === tab)
                      .map((apt) => (
                        <div key={apt.id} className={cn(
                          'flex items-start gap-4 p-4 rounded-lg border transition-colors',
                          apt.status === 'in-progress' && 'border-warning bg-warning/5',
                          apt.status === 'completed' && 'opacity-60',
                          apt.status === 'cancelled' && 'opacity-40',
                        )}>
                          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted shrink-0">
                            {apt.petSpecies === 'dog'
                              ? <Dog className="w-6 h-6 text-muted-foreground" />
                              : <Cat className="w-6 h-6 text-muted-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{apt.petName}</p>
                              <Badge className={getStatusColor(apt.status)} variant="outline">
                                {apt.status.replace('-', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{apt.ownerName}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />{apt.time}
                              </span>
                              <Badge variant="outline" className="text-xs capitalize">{apt.type}</Badge>
                            </div>
                            {/* Action buttons */}
                            {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 h-7 text-xs"
                                  onClick={() => onNavigate('patients')}
                                >
                                  <Eye className="w-3 h-3" />Records
                                </Button>
                                <Button
                                  size="sm"
                                  className="gap-1 h-7 text-xs"
                                  onClick={() => setPrescriptionModal({
                                    open: true, petName: apt.petName, petId: apt.petId,
                                  })}
                                >
                                  <Pill className="w-3 h-3" />Prescribe
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 h-7 text-xs border-primary/30 text-primary hover:bg-primary/5"
                                  onClick={() => setVaccinationModal({
                                    open: true, petName: apt.petName, petId: apt.petId,
                                  })}
                                >
                                  <Syringe className="w-3 h-3" />Vaccinate
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 h-7 text-xs border-primary text-primary hover:bg-primary/5"
                                  onClick={() => handleStatusUpdate(apt.id, 'Completed')}
                                >
                                  <CheckCircle2 className="w-3 h-3" />Complete
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/5"
                                  onClick={() => handleStatusUpdate(apt.id, 'Cancelled')}
                                >
                                  <XCircle className="w-3 h-3" />Cancel
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pending Referrals */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Pending Referrals</CardTitle>
                <Badge variant="outline">{pendingReferrals.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingReferrals.length > 0 ? (
                pendingReferrals.map((ref) => (
                  <div key={ref.id} className="p-3 rounded-lg border space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{ref.petName}</p>
                      <Badge variant="outline" className={cn('text-xs', getReferralStatusStyle('pending'))}>Pending</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{ref.reason}</p>
                    <p className="text-xs text-muted-foreground">From: {ref.fromVetName}</p>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => handleReferralAction(ref.id, 'Accepted')}>
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleReferralAction(ref.id, 'Rejected')}>
                        Decline
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No pending referrals</p>
              )}
            </CardContent>
          </Card>

          {/* Overdue Vaccinations */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Overdue Vaccinations</CardTitle>
                {overdueVax.length > 0 && (
                  <Badge variant="destructive">{overdueVax.length}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {overdueVax.slice(0, 3).map((vax) => (
                <div key={vax.id} className="flex items-center gap-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10">
                    <Syringe className="w-5 h-5 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{vax.petName}</p>
                    <p className="text-xs text-muted-foreground">{vax.vaccineName}</p>
                    <p className="text-xs text-destructive">Due: {vax.dueDate}</p>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onNavigate('vaccinations')}
              >
                View All Vaccinations
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Prescription Modal */}
      <PrescriptionModal
        open={prescriptionModal.open}
        onOpenChange={(open) => setPrescriptionModal({ ...prescriptionModal, open })}
        medicines={medicines}
        petName={prescriptionModal.petName}
        petId={prescriptionModal.petId}
        vetId={String(user?.userId ?? '')}
        onSave={() => setPrescriptionModal({ open: false, petName: '', petId: '' })}
      />

      {/* Vaccination Modal */}
      <VaccinationModal
        open={vaccinationModal.open}
        onOpenChange={(open) => setVaccinationModal({ ...vaccinationModal, open })}
        petId={vaccinationModal.petId}
        petName={vaccinationModal.petName}
        vaccines={medicines}
        onSuccess={loadData}
      />
    </div>
  )
}
