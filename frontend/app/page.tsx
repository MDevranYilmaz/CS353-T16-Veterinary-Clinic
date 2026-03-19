'use client'

import { useState } from 'react'
import type { UserRole } from '@/lib/types'
import { Sidebar } from '@/components/sidebar'
import { OwnerDashboard } from '@/components/dashboards/owner-dashboard'
import { VetDashboard } from '@/components/dashboards/vet-dashboard'
import { ManagerDashboard } from '@/components/dashboards/manager-dashboard'
import { AppointmentWizard } from '@/components/appointment-wizard'
import { VetFinder } from '@/components/vet-finder'
import { PetCard } from '@/components/pet-card'
import { InventoryTable } from '@/components/inventory-table'
import { ReferralModal } from '@/components/referral-modal'
import {
  OverdueVaccinationsChart,
  StockConsumptionChart,
  RevenueDistributionChart,
  AppointmentTrendsChart,
} from '@/components/analytics-charts'
import { pets, medicines, users, appointments, vaccinationSchedules, medicalRecords } from '@/lib/mock-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calendar,
  Clock,
  Dog,
  Cat,
  Syringe,
  ArrowLeft,
  ArrowLeftRight,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Plus,
} from 'lucide-react'
import type { Medicine } from '@/lib/types'

// Role configuration for demo
const roleUsers: Record<UserRole, { name: string; avatar?: string }> = {
  owner: { name: 'Sarah Johnson' },
  vet: { name: 'Dr. Emily Wilson' },
  manager: { name: 'Lisa Thompson' },
}

export default function VetClinicApp() {
  const [currentRole, setCurrentRole] = useState<UserRole>('owner')
  const [currentView, setCurrentView] = useState('dashboard')
  const [showAppointmentWizard, setShowAppointmentWizard] = useState(false)
  const [referralModal, setReferralModal] = useState(false)
  const [inventory, setInventory] = useState<Medicine[]>(medicines)

  const handleViewChange = (view: string) => {
    setCurrentView(view)
    setShowAppointmentWizard(false)
  }

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role)
    setCurrentView('dashboard')
    setShowAppointmentWizard(false)
  }

  const handleAddStock = (itemId: string, quantity: number) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, currentStock: item.currentStock + quantity }
          : item
      )
    )
  }

  const handleRemoveStock = (itemId: string, quantity: number) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, currentStock: Math.max(0, item.currentStock - quantity) }
          : item
      )
    )
  }

  // Render content based on current role and view
  const renderContent = () => {
    // Appointment booking wizard
    if (showAppointmentWizard) {
      return (
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => setShowAppointmentWizard(false)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <AppointmentWizard
            onComplete={() => {
              setShowAppointmentWizard(false)
              setCurrentView('appointments')
            }}
            onCancel={() => setShowAppointmentWizard(false)}
          />
        </div>
      )
    }

    // Owner views
    if (currentRole === 'owner') {
      switch (currentView) {
        case 'dashboard':
          return (
            <OwnerDashboard
              onNavigate={(view) => {
                if (view === 'appointments') {
                  setShowAppointmentWizard(true)
                } else {
                  handleViewChange(view)
                }
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
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Pet
                </Button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pets.filter((p) => p.ownerId === 'o1').map((pet) => (
                  <PetCard
                    key={pet.id}
                    pet={pet}
                    onViewDetails={() => {}}
                    onBookAppointment={() => setShowAppointmentWizard(true)}
                    onViewRecords={() => {}}
                  />
                ))}
              </div>
            </div>
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
                  <Plus className="w-4 h-4 mr-2" />
                  Book Appointment
                </Button>
              </div>
              <Card>
                <CardContent className="p-6 space-y-4">
                  {appointments
                    .filter((a) => a.ownerId === 'o1')
                    .map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-center gap-4 p-4 rounded-lg border"
                      >
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                          {apt.petSpecies === 'dog' ? (
                            <Dog className="w-6 h-6 text-primary" />
                          ) : (
                            <Cat className="w-6 h-6 text-primary" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{apt.petName}</p>
                            <Badge variant="outline" className="text-xs capitalize">
                              {apt.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{apt.vetName}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {apt.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {apt.time}
                            </span>
                          </div>
                        </div>
                        <Badge
                          className={
                            apt.status === 'scheduled'
                              ? 'bg-accent/10 text-accent border-0'
                              : apt.status === 'completed'
                              ? 'bg-primary/10 text-primary border-0'
                              : ''
                          }
                        >
                          {apt.status}
                        </Badge>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          )
        case 'find-vet':
          return (
            <VetFinder
              onBookAppointment={() => setShowAppointmentWizard(true)}
            />
          )
        case 'invoices':
          return (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">My Invoices</h1>
                <p className="text-muted-foreground">View and manage your billing</p>
              </div>
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground text-center py-8">
                    Invoice management coming soon...
                  </p>
                </CardContent>
              </Card>
            </div>
          )
        default:
          return <OwnerDashboard onNavigate={handleViewChange} />
      }
    }

    // Vet views
    if (currentRole === 'vet') {
      switch (currentView) {
        case 'dashboard':
          return <VetDashboard onNavigate={handleViewChange} />
        case 'schedule':
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">My Schedule</h1>
                  <p className="text-muted-foreground">Your appointments for today</p>
                </div>
              </div>
              <Card>
                <CardContent className="p-6 space-y-4">
                  {appointments
                    .filter((a) => a.vetId === 'v1')
                    .map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-center gap-4 p-4 rounded-lg border"
                      >
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted">
                          {apt.petSpecies === 'dog' ? (
                            <Dog className="w-6 h-6 text-muted-foreground" />
                          ) : (
                            <Cat className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{apt.petName}</p>
                          <p className="text-sm text-muted-foreground">{apt.ownerName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{apt.time}</span>
                            <Badge variant="outline" className="text-xs capitalize">
                              {apt.type}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            View Records
                          </Button>
                          <Button size="sm">Start Visit</Button>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          )
        case 'patients':
          return (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Patients</h1>
                <p className="text-muted-foreground">All registered patients</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pets.map((pet) => (
                  <PetCard key={pet.id} pet={pet} compact />
                ))}
              </div>
            </div>
          )
        case 'records':
          return (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Medical Records</h1>
                <p className="text-muted-foreground">Patient medical history</p>
              </div>
              <Card>
                <CardContent className="p-6 space-y-4">
                  {medicalRecords.map((record) => (
                    <div key={record.id} className="p-4 rounded-lg border space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{record.petName}</p>
                          <p className="text-sm text-muted-foreground">{record.date}</p>
                        </div>
                        <Badge variant="outline">{record.vetName}</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Diagnosis</p>
                        <p className="text-sm text-muted-foreground">{record.diagnosis}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Treatment</p>
                        <p className="text-sm text-muted-foreground">{record.treatment}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )
        case 'vaccinations':
          return (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Vaccination Planner</h1>
                <p className="text-muted-foreground">Manage vaccination schedules</p>
              </div>
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Overdue Vaccinations</CardTitle>
                    <CardDescription>Pets with overdue vaccines</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {vaccinationSchedules
                      .filter((v) => v.status === 'overdue')
                      .map((vax) => (
                        <div
                          key={vax.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5"
                        >
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10">
                            <Syringe className="w-5 h-5 text-destructive" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{vax.petName}</p>
                            <p className="text-xs text-muted-foreground">{vax.vaccineName}</p>
                            <p className="text-xs text-destructive">Due: {vax.dueDate}</p>
                          </div>
                          <Button size="sm">Schedule</Button>
                        </div>
                      ))}
                  </CardContent>
                </Card>
                <OverdueVaccinationsChart />
              </div>
            </div>
          )
        case 'referrals':
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Referrals</h1>
                  <p className="text-muted-foreground">Patient referrals to specialists</p>
                </div>
                <Button onClick={() => setReferralModal(true)}>
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  Create Referral
                </Button>
              </div>
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground text-center py-8">
                    No referrals to display. Create one to refer patients to specialists.
                  </p>
                </CardContent>
              </Card>
              <ReferralModal
                open={referralModal}
                onOpenChange={setReferralModal}
                currentVetId="v1"
                onSubmit={(referral) => {
                  console.log('[v0] Referral created:', referral)
                }}
              />
            </div>
          )
        default:
          return <VetDashboard onNavigate={handleViewChange} />
      }
    }

    // Manager views
    if (currentRole === 'manager') {
      switch (currentView) {
        case 'dashboard':
          return <ManagerDashboard onNavigate={handleViewChange} />
        case 'inventory':
          return (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Inventory Management</h1>
                <p className="text-muted-foreground">Manage medicines and supplies</p>
              </div>
              <InventoryTable
                items={inventory}
                onAddStock={handleAddStock}
                onRemoveStock={handleRemoveStock}
              />
            </div>
          )
        case 'billing':
          return (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Billing & Invoices</h1>
                <p className="text-muted-foreground">Manage clinic billing</p>
              </div>
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground text-center py-8">
                    Access billing from the dashboard Overview tab.
                  </p>
                </CardContent>
              </Card>
            </div>
          )
        case 'reports':
          return (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Reports & Analytics</h1>
                <p className="text-muted-foreground">Clinic performance metrics</p>
              </div>
              <div className="grid lg:grid-cols-2 gap-6">
                <AppointmentTrendsChart />
                <RevenueDistributionChart />
                <OverdueVaccinationsChart />
                <StockConsumptionChart />
              </div>
            </div>
          )
        case 'appointments':
          return (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">All Appointments</h1>
                <p className="text-muted-foreground">Manage clinic appointments</p>
              </div>
              <Card>
                <CardContent className="p-6 space-y-4">
                  {appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center gap-4 p-4 rounded-lg border"
                    >
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted">
                        {apt.petSpecies === 'dog' ? (
                          <Dog className="w-6 h-6 text-muted-foreground" />
                        ) : (
                          <Cat className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{apt.petName}</p>
                          <span className="text-muted-foreground">-</span>
                          <span className="text-sm text-muted-foreground">{apt.ownerName}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{apt.vetName}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>{apt.date}</span>
                          <span>{apt.time}</span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {apt.type}
                          </Badge>
                        </div>
                      </div>
                      <Badge
                        variant={apt.status === 'in-progress' ? 'default' : 'outline'}
                        className={
                          apt.status === 'in-progress'
                            ? 'bg-warning/10 text-warning-foreground border-0'
                            : ''
                        }
                      >
                        {apt.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )
        case 'staff':
          return (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Staff Management</h1>
                <p className="text-muted-foreground">Manage clinic staff</p>
              </div>
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground text-center py-8">
                    Staff management coming soon...
                  </p>
                </CardContent>
              </Card>
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
      {/* Sidebar */}
      <Sidebar
        currentRole={currentRole}
        currentView={currentView}
        onViewChange={handleViewChange}
        userName={roleUsers[currentRole].name}
        userAvatar={roleUsers[currentRole].avatar}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Role Switcher Header */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">View as:</span>
              <Select value={currentRole} onValueChange={(v) => handleRoleChange(v as UserRole)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Pet Owner</SelectItem>
                  <SelectItem value="vet">Veterinarian</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              Demo Mode - Switch roles to explore different views
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 lg:p-8">{renderContent()}</div>
      </main>
    </div>
  )
}
