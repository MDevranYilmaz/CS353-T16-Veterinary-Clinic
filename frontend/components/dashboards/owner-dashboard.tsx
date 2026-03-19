'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PetCard } from '@/components/pet-card'
import {
  pets,
  appointments,
  veterinarians,
  dashboardStats,
} from '@/lib/mock-data'
import {
  Calendar,
  Clock,
  PawPrint,
  Syringe,
  FileText,
  Star,
  MapPin,
  ArrowRight,
  Heart,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface OwnerDashboardProps {
  onNavigate: (view: string) => void
}

export function OwnerDashboard({ onNavigate }: OwnerDashboardProps) {
  const ownerPets = pets.filter((p) => p.ownerId === 'o1')
  const upcomingAppointments = appointments.filter(
    (a) => a.ownerId === 'o1' && a.status === 'scheduled'
  ).slice(0, 3)

  const stats = dashboardStats.owner

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-primary p-8 text-primary-foreground">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Welcome back, Sarah!</h1>
          <p className="text-primary-foreground/80 text-lg max-w-xl">
            Your pets are waiting for their next adventure. Keep them healthy and happy with regular checkups.
          </p>
          <div className="flex gap-3 mt-6">
            <Button
              size="lg"
              variant="secondary"
              className="gap-2"
              onClick={() => onNavigate('appointments')}
            >
              <Calendar className="w-5 h-5" />
              Book Appointment
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10"
              onClick={() => onNavigate('find-vet')}
            >
              Find a Vet
            </Button>
          </div>
        </div>
        {/* Decorative pet silhouettes */}
        <div className="absolute right-4 bottom-0 opacity-20">
          <Heart className="w-48 h-48" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                <PawPrint className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalPets}</p>
                <p className="text-sm text-muted-foreground">My Pets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.upcomingAppointments}</p>
                <p className="text-sm text-muted-foreground">Appointments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-warning/10">
                <Syringe className="w-5 h-5 text-warning-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.overdueVaccinations}</p>
                <p className="text-sm text-muted-foreground">Vaccinations Due</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingInvoices}</p>
                <p className="text-sm text-muted-foreground">Pending Bills</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Pets Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">My Pets</h2>
            <p className="text-sm text-muted-foreground">Manage your furry family members</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => onNavigate('my-pets')}>
            View All
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ownerPets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              onViewDetails={() => onNavigate('my-pets')}
              onBookAppointment={() => onNavigate('appointments')}
              onViewRecords={() => onNavigate('my-pets')}
            />
          ))}
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('appointments')}>
                View all
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{apt.petName}</p>
                      <Badge variant="outline" className="text-xs capitalize">
                        {apt.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{apt.vetName}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {apt.date} at {apt.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {apt.branchName}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No upcoming appointments</p>
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => onNavigate('appointments')}
                >
                  Book one now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Featured Veterinarians */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Top Veterinarians</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('find-vet')}>
                Browse all
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {veterinarians.slice(0, 3).map((vet) => (
              <div
                key={vet.id}
                className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onNavigate('find-vet')}
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={vet.avatar} alt={vet.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {vet.name.split(' ').map((n) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{vet.name}</p>
                  <p className="text-sm text-muted-foreground">{vet.specialization}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="w-3 h-3 fill-warning text-warning" />
                      <span>{vet.rating}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{vet.branchName}</span>
                  </div>
                </div>
                <Badge
                  variant={vet.available ? 'default' : 'secondary'}
                  className={cn(vet.available && 'bg-primary/10 text-primary border-0')}
                >
                  {vet.available ? 'Available' : 'Busy'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
