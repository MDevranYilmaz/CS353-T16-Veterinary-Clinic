'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { veterinarians, branches } from '@/lib/mock-data'
import {
  Search,
  MapPin,
  Star,
  Calendar,
  Filter,
  Stethoscope,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface VetFinderProps {
  onBookAppointment: (vetId: string) => void
}

export function VetFinder({ onBookAppointment }: VetFinderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [branchFilter, setBranchFilter] = useState<string>('all')
  const [specializationFilter, setSpecializationFilter] = useState<string>('all')

  const specializations = [...new Set(veterinarians.map((v) => v.specialization))]

  const filteredVets = veterinarians.filter((vet) => {
    const matchesSearch =
      vet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vet.specialization.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesBranch = branchFilter === 'all' || vet.branchId === branchFilter
    const matchesSpec =
      specializationFilter === 'all' || vet.specialization === specializationFilter
    return matchesSearch && matchesBranch && matchesSpec
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Find a Veterinarian</h1>
        <p className="text-muted-foreground">
          Browse our qualified veterinarians across all branches
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="w-48">
                  <MapPin className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                <SelectTrigger className="w-48">
                  <Stethoscope className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Specializations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specializations</SelectItem>
                  {specializations.map((spec) => (
                    <SelectItem key={spec} value={spec}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVets.map((vet) => (
          <Card key={vet.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-32 bg-gradient-to-br from-primary/20 to-accent/20 relative">
              <div className="absolute -bottom-10 left-6">
                <Avatar className="w-20 h-20 border-4 border-card">
                  <AvatarImage src={vet.avatar} alt={vet.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {vet.name.split(' ').map((n) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="absolute top-3 right-3">
                <Badge
                  variant={vet.available ? 'default' : 'secondary'}
                  className={cn(
                    vet.available && 'bg-primary/90 text-primary-foreground'
                  )}
                >
                  {vet.available ? 'Available' : 'Busy'}
                </Badge>
              </div>
            </div>
            <CardContent className="pt-12 pb-6 px-6">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{vet.name}</h3>
                  <p className="text-muted-foreground">{vet.specialization}</p>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-warning text-warning" />
                    <span className="font-medium">{vet.rating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{vet.branchName}</span>
                  </div>
                </div>

                <Button
                  className="w-full gap-2"
                  disabled={!vet.available}
                  onClick={() => onBookAppointment(vet.id)}
                >
                  <Calendar className="w-4 h-4" />
                  Book Appointment
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVets.length === 0 && (
        <div className="text-center py-12">
          <Stethoscope className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No veterinarians found</h3>
          <p className="text-muted-foreground">Try adjusting your search filters</p>
        </div>
      )}
    </div>
  )
}
