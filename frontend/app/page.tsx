'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { LoginScreen } from '@/components/login-screen'
import { Sidebar } from '@/components/sidebar'
import { OwnerDashboard } from '@/components/dashboards/owner-dashboard'
import { VetDashboard } from '@/components/dashboards/vet-dashboard'
import { ManagerDashboard } from '@/components/dashboards/manager-dashboard'
import { AppointmentWizard } from '@/components/appointment-wizard'
import { VetFinder } from '@/components/vet-finder'
import { PetCard } from '@/components/pet-card'
import { VetPatientRow } from '@/components/vet-patient-row'
import { AddPetForm } from '@/components/add-pet-form'
import { MedicalRecords } from '@/components/medical-records'
import { EvaluationModal } from '@/components/evaluation-modal'
import { VetSchedule } from '@/components/vet-schedule'
import { InventoryTable } from '@/components/inventory-table'
import { ReferralModal } from '@/components/referral-modal'
import {
  OverdueVaccinationsChart,
  StockConsumptionChart,
  RevenueDistributionChart,
  AppointmentTrendsChart,
} from '@/components/analytics-charts'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Calendar,
  Clock,
  Dog,
  Cat,
  Syringe,
  ArrowLeft,
  ArrowLeftRight,
  Plus,
  LogOut,
  User,
  Loader2,
  Star,
} from 'lucide-react'
import { petApi, appointmentApi, billingApi, referralApi } from '@/lib/api'
import type { Pet, Appointment, Invoice, MedicalRecord } from '@/lib/types'

export default function VetClinicApp() {
  const { user, isLoggedIn, isLoading, logout } = useAuth()
  const [currentView, setCurrentView] = useState('dashboard')
  const [showAppointmentWizard, setShowAppointmentWizard] = useState(false)
  const [referralModal, setReferralModal] = useState(false)
  const [evalModal, setEvalModal] = useState<{ open: boolean; vetId: string; vetName: string }>({
    open: false, vetId: '', vetName: '',
  })

  // Owner data
  const [ownerPets, setOwnerPets] = useState<Pet[]>([])
  const [ownerAppointments, setOwnerAppointments] = useState<Appointment[]>([])
  const [ownerBills, setOwnerBills] = useState<Invoice[]>([])
  const [dataLoading, setDataLoading] = useState(false)

  // Vet: records view data
  const [vetPets, setVetPets] = useState<Pet[]>([])
  const [vetRecords, setVetRecords] = useState<MedicalRecord[]>([])
  const [recordsLoading, setRecordsLoading] = useState(false)

  // Fetch owner data
  useEffect(() => {
    if (!user || user.role !== 'owner') return
    setDataLoading(true)
    Promise.all([
      petApi.list(user.userId),
      appointmentApi.listByOwner(user.userId),
      billingApi.listByOwner(user.userId),
    ]).then(([pets, appts, bills]) => {
      setOwnerPets(pets)
      setOwnerAppointments(appts)
      setOwnerBills(bills)
    }).catch(console.error).finally(() => setDataLoading(false))
  }, [user])

  const reloadOwnerPets = async () => {
    if (!user) return
    try {
      const pets = await petApi.list(user.userId)
      setOwnerPets(pets)
    } catch (e) {
      console.error(e)
    }
  }

  const reloadOwnerAppointments = async () => {
    if (!user) return
    try {
      const appts = await appointmentApi.listByOwner(user.userId)
      setOwnerAppointments(appts)
    } catch (e) {
      console.error(e)
    }
  }

  // Fetch vet patients eagerly on login so referral modal has the list
  useEffect(() => {
    if (!user || user.role !== 'vet') return
    appointmentApi.listByVet(user.userId)
      .then(async (appts) => {
        const petIds = [...new Set(appts.map((a) => a.petId))]
        const petsData = await Promise.all(petIds.map((id) => petApi.get(id)))
        setVetPets(petsData)
      })
      .catch(console.error)
  }, [user])

  // Fetch vet patients & records when navigating to Patients view
  useEffect(() => {
    if (!user || user.role !== 'vet' || currentView !== 'patients') return
    setRecordsLoading(true)
    appointmentApi.listByVet(user.userId)
      .then(async (appts) => {
        const petIds = [...new Set(appts.map((a) => a.petId))]
        const petsData = await Promise.all(petIds.map((id) => petApi.get(id)))
        const records = (
          await Promise.all(petsData.map((p) => petApi.medicalHistory(p.id)))
        ).flat()
        setVetPets(petsData)
        setVetRecords(records)
      })
      .catch(console.error)
      .finally(() => setRecordsLoading(false))
  }, [user, currentView])

  const [initialRecordPetId, setInitialRecordPetId] = useState<string | null>(null)

  const handleViewChange = (view: string, petId?: string) => {
    setCurrentView(view)
    setShowAppointmentWizard(false)
    if (view === 'patients') setInitialRecordPetId(petId ?? null)
  }

  const handleLogout = () => {
    logout()
    setCurrentView('dashboard')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isLoggedIn || !user) {
    return <LoginScreen />
  }

  const initials = user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)

  const renderContent = () => {
    // Appointment booking wizard
    if (showAppointmentWizard) {
      return (
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" className="mb-4" onClick={() => setShowAppointmentWizard(false)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <AppointmentWizard
            onComplete={() => {
              setShowAppointmentWizard(false)
              setCurrentView('appointments')
              // refresh appointments so new booking appears immediately
              reloadOwnerAppointments()
              // notify other parts of the app (e.g., vet schedule) to refresh
              try {
                window.dispatchEvent(new CustomEvent('appointments:updated'))
              } catch (e) {
                // ignore in non-browser environments
              }
            }}
            onCancel={() => setShowAppointmentWizard(false)}
          />
        </div>
      )
    }

    // ── Owner views ──────────────────────────────────────────────────────────
    if (user.role === 'owner') {
      switch (currentView) {
        case 'dashboard':
          return (
            <OwnerDashboard
              pets={ownerPets}
              appointments={ownerAppointments}
              loading={dataLoading}
              onNavigate={(view) => {
                if (view === 'appointments') setShowAppointmentWizard(true)
                else handleViewChange(view)
              }}
            />
          )

        case 'my-pets':
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">My Pets</h1>
                  <p className="text-muted-foreground">Manage your furry family members</p>
                </div>
                <Button onClick={() => handleViewChange('add-pet')}>
                  <Plus className="w-4 h-4 mr-2" />Add Pet
                </Button>
              </div>
              {dataLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : ownerPets.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Dog className="w-12 h-12 text-muted-foreground/30 mb-3" />
                    <p className="font-medium">No pets yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Add your first pet to get started.</p>
                    <Button className="mt-4" onClick={() => handleViewChange('add-pet')}>
                      <Plus className="w-4 h-4 mr-2" />Add Pet
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ownerPets.map((pet) => (
                    <PetCard
                      key={pet.id}
                      pet={pet}
                      onViewDetails={() => {}}
                      onBookAppointment={() => setShowAppointmentWizard(true)}
                      onViewRecords={() => {}}
                    />
                  ))}
                </div>
              )}
            </div>
          )

        case 'add-pet':
          return (
            <AddPetForm
              onSuccess={() => {
                reloadOwnerPets()
                handleViewChange('my-pets')
              }}
              onCancel={() => handleViewChange('my-pets')}
            />
          )

        case 'appointments':
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Appointments</h1>
                  <p className="text-muted-foreground">Manage your upcoming visits</p>
                </div>
                <Button onClick={() => setShowAppointmentWizard(true)}>
                  <Plus className="w-4 h-4 mr-2" />Book Appointment
                </Button>
              </div>
              <Card>
                <CardContent className="p-6 space-y-4">
                  {dataLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : ownerAppointments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No appointments found.</p>
                  ) : (
                    ownerAppointments.map((apt) => (
                      <div key={apt.id} className="flex items-center gap-4 p-4 rounded-lg border">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                          {apt.petSpecies === 'dog'
                            ? <Dog className="w-6 h-6 text-primary" />
                            : <Cat className="w-6 h-6 text-primary" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{apt.petName}</p>
                            <Badge variant="outline" className="text-xs capitalize">{apt.type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{apt.vetName}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />{apt.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />{apt.time}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            apt.status === 'scheduled' ? 'bg-accent/10 text-accent border-0' :
                            apt.status === 'completed' ? 'bg-primary/10 text-primary border-0' : ''
                          }>{apt.status}</Badge>
                          {apt.status === 'completed' && apt.vetId && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 h-7 text-xs"
                              onClick={() => setEvalModal({
                                open: true,
                                vetId: apt.vetId,
                                vetName: apt.vetName,
                              })}
                            >
                              <Star className="w-3 h-3" />Rate
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )

        case 'find-vet':
          return <VetFinder onBookAppointment={() => setShowAppointmentWizard(true)} />

        case 'invoices':
          return (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">My Invoices</h1>
                <p className="text-muted-foreground">View and manage your billing</p>
              </div>
              <Card>
                <CardContent className="p-6 space-y-4">
                  {dataLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : ownerBills.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No invoices found.</p>
                  ) : (
                    ownerBills.map((bill) => (
                      <div key={bill.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                          <p className="font-medium">{bill.petName}</p>
                          <p className="text-sm text-muted-foreground">{bill.date}</p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <p className="font-bold">${bill.total.toFixed(2)}</p>
                          <Badge
                            variant={bill.status === 'paid' ? 'default' : 'destructive'}
                            className={bill.status === 'paid' ? 'bg-primary/10 text-primary border-0' : ''}
                          >
                            {bill.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )

        default:
          return (
            <OwnerDashboard
              pets={ownerPets}
              appointments={ownerAppointments}
              loading={dataLoading}
              onNavigate={handleViewChange}
            />
          )
      }
    }

    // ── Vet views ────────────────────────────────────────────────────────────
    if (user.role === 'vet') {
      switch (currentView) {
        case 'dashboard':
          return <VetDashboard onNavigate={handleViewChange} />

        case 'schedule':
          return <VetSchedule onViewRecords={(petId) => handleViewChange('patients', petId)} />

        case 'patients':
          return (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Patients</h1>
              {recordsLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : vetPets.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Syringe className="w-12 h-12 text-muted-foreground/30 mb-3" />
                    <p className="font-medium">No patients found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Records appear for pets you have treated or scheduled with.
                    </p>
                  </CardContent>
                </Card>
              ) : initialRecordPetId ? (
                <div className="space-y-4">
                  <MedicalRecords
                    pets={vetPets}
                    records={vetRecords}
                    userRole="vet"
                    initialPetId={initialRecordPetId ?? undefined}
                    onRecordAdded={() => handleViewChange('patients')}
                    showBackButton
                    onBack={() => setInitialRecordPetId(null)}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {vetPets.map((pet) => (
                    <VetPatientRow key={pet.id} pet={pet} onViewRecords={(id) => handleViewChange('patients', id)} />
                  ))}
                </div>
              )}
            </div>
          )

        case 'vaccinations':
          return (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Vaccination Planner</h1>
              <div className="grid lg:grid-cols-2 gap-6">
                <VetDashboard onNavigate={handleViewChange} vaccinationsOnly />
                <OverdueVaccinationsChart />
              </div>
            </div>
          )

        case 'referrals':
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Referrals</h1>
                <Button onClick={() => setReferralModal(true)}>
                  <ArrowLeftRight className="w-4 h-4 mr-2" />Create Referral
                </Button>
              </div>
              <VetDashboard onNavigate={handleViewChange} referralsOnly />
              <ReferralModal
                open={referralModal}
                onOpenChange={setReferralModal}
                currentVetId={String(user.userId)}
                pets={vetPets}
                onSubmit={() => {
                  // The modal handles API call now
                }}
              />
            </div>
          )

        default:
          return <VetDashboard onNavigate={handleViewChange} />
      }
    }

    // ── Manager views ────────────────────────────────────────────────────────
    if (user.role === 'manager') {
      switch (currentView) {
        case 'dashboard':
          return <ManagerDashboard onNavigate={handleViewChange} />

        case 'inventory':
          return (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Inventory Management</h1>
              <ManagerDashboard onNavigate={handleViewChange} inventoryOnly />
            </div>
          )

        case 'billing':
          return (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Billing & Invoices</h1>
              <ManagerDashboard onNavigate={handleViewChange} billingOnly />
            </div>
          )

        case 'reports':
          return (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Reports & Analytics</h1>
              <div className="grid lg:grid-cols-2 gap-6">
                <AppointmentTrendsChart />
                <RevenueDistributionChart />
                <OverdueVaccinationsChart />
                <StockConsumptionChart />
              </div>
            </div>
          )

        default:
          return <ManagerDashboard onNavigate={handleViewChange} />
      }
    }

    return null
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        currentRole={user.role}
        currentView={currentView}
        onViewChange={handleViewChange}
        userName={user.fullName}
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {user.role === 'owner' ? 'Pet Owner' : user.role === 'vet' ? 'Veterinarian' : 'Manager'}
              </Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-auto py-1.5">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:block">{user.fullName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>
                  <User className="w-4 h-4 mr-2" />
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="p-6 lg:p-8">{renderContent()}</div>
      </main>

      {/* Evaluation Modal (owner: rate a vet after completed appointment) */}
      <EvaluationModal
        open={evalModal.open}
        onOpenChange={(open) => setEvalModal({ ...evalModal, open })}
        vetId={evalModal.vetId}
        vetName={evalModal.vetName}
      />
    </div>
  )
}
