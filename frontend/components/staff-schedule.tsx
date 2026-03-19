"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  User,
  Calendar,
  Building2,
} from "lucide-react"
import type { Staff, Clinic } from "@/lib/types"

interface StaffScheduleProps {
  staff: Staff[]
  clinics: Clinic[]
}

const timeSlots = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
]

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export function StaffSchedule({ staff, clinics }: StaffScheduleProps) {
  const [selectedClinic, setSelectedClinic] = useState<string>("all")
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - now.getDay() + 1)
    return monday
  })
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)

  const filteredStaff = selectedClinic === "all"
    ? staff
    : staff.filter((s) => s.clinicId === selectedClinic)

  const getWeekDates = () => {
    return days.map((_, index) => {
      const date = new Date(currentWeekStart)
      date.setDate(currentWeekStart.getDate() + index)
      return date
    })
  }

  const weekDates = getWeekDates()

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
    setCurrentWeekStart(newDate)
  }

  const formatDateHeader = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const isWorkingDay = (staffMember: Staff, dayIndex: number) => {
    // Simplified: Most work Mon-Fri, some work weekends
    const workDays = staffMember.role === "receptionist"
      ? [0, 1, 2, 3, 4] // Mon-Fri
      : staffMember.role === "vet"
      ? [0, 1, 2, 3, 4, 5] // Mon-Sat
      : [0, 1, 2, 3, 4] // Mon-Fri
    return workDays.includes(dayIndex)
  }

  const getShiftTime = (staffMember: Staff) => {
    if (staffMember.role === "vet") {
      return "9:00 AM - 5:00 PM"
    } else if (staffMember.role === "tech") {
      return "8:00 AM - 4:00 PM"
    }
    return "8:00 AM - 6:00 PM"
  }

  const getRoleBadge = (role: Staff["role"]) => {
    switch (role) {
      case "vet":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Veterinarian</Badge>
      case "tech":
        return <Badge className="bg-accent/10 text-accent-foreground border-accent/20">Vet Tech</Badge>
      case "receptionist":
        return <Badge variant="outline">Receptionist</Badge>
      case "manager":
        return <Badge className="bg-warning/10 text-warning-foreground border-warning/20">Manager</Badge>
      default:
        return <Badge variant="secondary">{role}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedClinic} onValueChange={setSelectedClinic}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by clinic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clinics</SelectItem>
              {clinics.map((clinic) => (
                <SelectItem key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateWeek("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[200px] text-center">
            <p className="font-medium">
              {formatDateHeader(weekDates[0])} - {formatDateHeader(weekDates[6])}
            </p>
            <p className="text-sm text-muted-foreground">
              {weekDates[0].getFullYear()}
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={() => navigateWeek("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Shift
        </Button>
      </div>

      {/* Schedule Grid */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <div className="min-w-[900px]">
              {/* Header Row */}
              <div className="grid grid-cols-8 border-b">
                <div className="p-4 font-medium bg-muted/50">Staff</div>
                {days.map((day, index) => (
                  <div
                    key={day}
                    className="p-4 text-center border-l bg-muted/50"
                  >
                    <p className="font-medium">{day}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateHeader(weekDates[index])}
                    </p>
                  </div>
                ))}
              </div>

              {/* Staff Rows */}
              {filteredStaff.map((member) => (
                <div key={member.id} className="grid grid-cols-8 border-b last:border-0">
                  <div
                    className="p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedStaff(member)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                    </div>
                  </div>
                  {days.map((_, dayIndex) => (
                    <div
                      key={dayIndex}
                      className="p-2 border-l flex items-center justify-center"
                    >
                      {isWorkingDay(member, dayIndex) ? (
                        <div className="w-full p-2 rounded-md bg-primary/10 text-center">
                          <p className="text-xs font-medium text-primary">
                            {getShiftTime(member).split(" - ")[0]}
                          </p>
                          <p className="text-xs text-primary/70">
                            {getShiftTime(member).split(" - ")[1]}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">Off</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Staff Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Staff</p>
                <p className="text-2xl font-bold">{filteredStaff.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                <Clock className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Veterinarians</p>
                <p className="text-2xl font-bold">
                  {filteredStaff.filter((s) => s.role === "vet").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                <Building2 className="h-5 w-5 text-warning-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clinics</p>
                <p className="text-2xl font-bold">
                  {selectedClinic === "all"
                    ? clinics.length
                    : 1}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Detail Modal */}
      <Dialog open={selectedStaff !== null} onOpenChange={() => setSelectedStaff(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Staff Details</DialogTitle>
            <DialogDescription>View and manage staff information</DialogDescription>
          </DialogHeader>
          {selectedStaff && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedStaff.avatar} alt={selectedStaff.name} />
                  <AvatarFallback className="text-xl">
                    {selectedStaff.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedStaff.name}</h3>
                  {getRoleBadge(selectedStaff.role)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedStaff.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedStaff.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Clinic</p>
                  <p className="font-medium">
                    {clinics.find((c) => c.id === selectedStaff.clinicId)?.name || "Unassigned"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Schedule</p>
                  <p className="font-medium">{getShiftTime(selectedStaff)}</p>
                </div>
              </div>

              {selectedStaff.specializations && selectedStaff.specializations.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Specializations</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedStaff.specializations.map((spec, idx) => (
                      <Badge key={idx} variant="outline">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline">Edit Profile</Button>
                <Button>
                  <Calendar className="h-4 w-4 mr-2" />
                  Manage Schedule
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
