'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PetCard } from '@/components/pet-card'
import { PrescriptionModal } from '@/components/prescription-modal'
import {
  appointments,
  pets,
  referrals,
  medicalRecords,
  vaccinationSchedules,
  medicines,
  dashboardStats,
} from '@/lib/mock-data'
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  ClipboardList,
  ArrowLeftRight,
  Syringe,
  Dog,
  Cat,
  FileEdit,
  Pill,
  Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface VetDashboardProps {
  onNavigate: (view: string) => void
}

export function VetDashboard({ onNavigate }: VetDashboardProps) {
  const [prescriptionModal, setPrescriptionModal] = useState<{ open: boolean; petName: string }>({
    open: false,
    petName: '',
  })

  const todayAppointments = appointments.filter((a) => a.vetId === 'v1')
  const pendingReferrals = referrals.filter((r) => r.toVetId === 'v1' && r.status === 'pending')
  const overdueVaccinations = vaccinationSchedules.filter((v) => v.status === 'overdue')
  const stats = dashboardStats.vet

  const getSpeciesIcon = (species: string) => {
    return species === 'dog' ? Dog : Cat
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-accent/10 text-accent border-0'
      case 'in-progress':
        return 'bg-warning/10 text-warning-foreground border-0'
      case 'completed':
        return 'bg-primary/10 text-primary border-0'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Good Morning, Dr. Wilson</h1>
          <p className="text-muted-foreground">
            You have {stats.todayAppointments} appointments scheduled for today
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onNavigate('schedule')}>
            <Calendar className="w-4 h-4 mr-2" />
            View Schedule
          </Button>
          <Button onClick={() => onNavigate('patients')}>
            <ClipboardList className="w-4 h-4 mr-2" />
            Patient Records
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.todayAppointments}</p>
                <p className="text-sm text-muted-foreground">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10">
                <Stethoscope className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.patientsThisWeek}</p>
                <p className="text-sm text-muted-foreground">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-warning/10">
                <ArrowLeftRight className="w-5 h-5 text-warning-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingReferrals}</p>
                <p className="text-sm text-muted-foreground">Referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-light">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedToday}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
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
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="space-y-3">
                {todayAppointments.map((apt) => {
                  const pet = pets.find((p) => p.id === apt.petId)
                  const SpeciesIcon = getSpeciesIcon(apt.petSpecies)
                  const hasAlerts = pet && (pet.allergies.length > 0 || pet.medicalAlerts.length > 0)

                  return (
                    <div
                      key={apt.id}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-lg border transition-colors',
                        apt.status === 'in-progress' && 'border-warning bg-warning/5',
                        apt.status === 'completed' && 'opacity-60'
                      )}
                    >
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted">
                        <SpeciesIcon className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{apt.petName}</p>
                          {hasAlerts && (
                            <AlertTriangle className="w-4 h-4 text-destructive" />
                          )}
                          <Badge className={getStatusColor(apt.status)} variant="outline">
                            {apt.status.replace('-', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{apt.ownerName}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {apt.time}
                          </span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {apt.type}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => onNavigate('records')}
                        >
                          <Eye className="w-4 h-4" />
                          Records
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1"
                          onClick={() =>
                            setPrescriptionModal({ open: true, petName: apt.petName })
                          }
                        >
                          <Pill className="w-4 h-4" />
                          Prescribe
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </TabsContent>
              <TabsContent value="scheduled" className="space-y-3">
                {todayAppointments
                  .filter((a) => a.status === 'scheduled')
                  .map((apt) => (
                    <div key={apt.id} className="flex items-center gap-4 p-4 rounded-lg border">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted">
                        {apt.petSpecies === 'dog' ? (
                          <Dog className="w-6 h-6 text-muted-foreground" />
                        ) : (
                          <Cat className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{apt.petName}</p>
                        <p className="text-sm text-muted-foreground">{apt.time} - {apt.type}</p>
                      </div>
                      <Badge className={getStatusColor(apt.status)} variant="outline">
                        Scheduled
                      </Badge>
                    </div>
                  ))}
              </TabsContent>
              <TabsContent value="in-progress" className="space-y-3">
                {todayAppointments
                  .filter((a) => a.status === 'in-progress')
                  .map((apt) => (
                    <div key={apt.id} className="flex items-center gap-4 p-4 rounded-lg border border-warning bg-warning/5">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-warning/20">
                        {apt.petSpecies === 'dog' ? (
                          <Dog className="w-6 h-6 text-warning-foreground" />
                        ) : (
                          <Cat className="w-6 h-6 text-warning-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{apt.petName}</p>
                        <p className="text-sm text-muted-foreground">{apt.time} - {apt.type}</p>
                      </div>
                      <Badge className={getStatusColor(apt.status)} variant="outline">
                        In Progress
                      </Badge>
                    </div>
                  ))}
              </TabsContent>
              <TabsContent value="completed" className="space-y-3">
                <p className="text-sm text-muted-foreground text-center py-8">
                  No completed appointments yet today
                </p>
              </TabsContent>
            </Tabs>
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
                      <Badge variant="outline" className="text-xs">Pending</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{ref.reason}</p>
                    <p className="text-xs text-muted-foreground">From: {ref.fromVetName}</p>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">Accept</Button>
                      <Button size="sm" variant="outline" className="flex-1">Decline</Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No pending referrals
                </p>
              )}
            </CardContent>
          </Card>

          {/* Overdue Vaccinations */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Overdue Vaccinations</CardTitle>
                {overdueVaccinations.length > 0 && (
                  <Badge variant="destructive">{overdueVaccinations.length}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {overdueVaccinations.map((vax) => (
                <div
                  key={vax.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5"
                >
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
        onSave={(prescriptions) => {
          console.log('[v0] Prescriptions saved:', prescriptions)
        }}
      />
    </div>
  )
}
