"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  FileText,
  Syringe,
  Stethoscope,
  Pill,
  Search,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react"
import type { Pet, MedicalRecord } from "@/lib/types"

interface MedicalRecordsProps {
  pets: Pet[]
  records: MedicalRecord[]
  userRole: "owner" | "vet"
}

export function MedicalRecords({ pets, records, userRole }: MedicalRecordsProps) {
  const [selectedPetId, setSelectedPetId] = useState<string>(pets[0]?.id || "")
  const [searchTerm, setSearchTerm] = useState("")
  const [recordTypeFilter, setRecordTypeFilter] = useState<string>("all")

  const selectedPet = pets.find((p) => p.id === selectedPetId)
  const petRecords = records.filter((r) => r.petId === selectedPetId)

  const filteredRecords = petRecords.filter((record) => {
    const matchesSearch =
      record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.treatment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.vetName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = recordTypeFilter === "all" || record.type === recordTypeFilter
    return matchesSearch && matchesType
  })

  const getRecordIcon = (type: MedicalRecord["type"]) => {
    switch (type) {
      case "vaccination":
        return <Syringe className="h-4 w-4" />
      case "checkup":
        return <Stethoscope className="h-4 w-4" />
      case "surgery":
        return <FileText className="h-4 w-4" />
      case "emergency":
        return <AlertTriangle className="h-4 w-4" />
      case "followup":
        return <Clock className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getRecordBadge = (type: MedicalRecord["type"]) => {
    switch (type) {
      case "vaccination":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Vaccination</Badge>
      case "checkup":
        return <Badge className="bg-accent/10 text-accent-foreground border-accent/20">Checkup</Badge>
      case "surgery":
        return <Badge className="bg-warning/10 text-warning-foreground border-warning/20">Surgery</Badge>
      case "emergency":
        return <Badge variant="destructive">Emergency</Badge>
      case "followup":
        return <Badge variant="outline">Follow-up</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  const upcomingVaccinations = selectedPet?.vaccinations.filter(
    (v) => new Date(v.nextDue) > new Date()
  ) || []

  const overdueVaccinations = selectedPet?.vaccinations.filter(
    (v) => new Date(v.nextDue) < new Date()
  ) || []

  return (
    <div className="space-y-6">
      {/* Pet Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Select value={selectedPetId} onValueChange={setSelectedPetId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select a pet" />
          </SelectTrigger>
          <SelectContent>
            {pets.map((pet) => (
              <SelectItem key={pet.id} value={pet.id}>
                <div className="flex items-center gap-2">
                  <span>{pet.name}</span>
                  <span className="text-muted-foreground text-xs">({pet.species})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedPet && (
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Microchip: </span>
              <span className="font-mono">{selectedPet.microchipId || "Not registered"}</span>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Records
            </Button>
          </div>
        )}
      </div>

      {selectedPet && (
        <Tabs defaultValue="records" className="space-y-4">
          <TabsList>
            <TabsTrigger value="records">Medical History</TabsTrigger>
            <TabsTrigger value="vaccinations">Vaccinations</TabsTrigger>
            <TabsTrigger value="allergies">Allergies & Conditions</TabsTrigger>
          </TabsList>

          <TabsContent value="records" className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={recordTypeFilter} onValueChange={setRecordTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="vaccination">Vaccination</SelectItem>
                  <SelectItem value="checkup">Checkup</SelectItem>
                  <SelectItem value="surgery">Surgery</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="h-[500px] pr-4">
              {filteredRecords.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No medical records found</p>
                  </CardContent>
                </Card>
              ) : (
                <Accordion type="single" collapsible className="space-y-2">
                  {filteredRecords.map((record) => (
                    <AccordionItem
                      key={record.id}
                      value={record.id}
                      className="border rounded-lg px-4"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-4 text-left">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            {getRecordIcon(record.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{record.diagnosis}</span>
                              {getRecordBadge(record.type)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(record.date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                              <span>Dr. {record.vetName}</span>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <h4 className="font-medium mb-2">Treatment</h4>
                            <p className="text-sm text-muted-foreground">
                              {record.treatment}
                            </p>
                          </div>
                          {record.notes && (
                            <div>
                              <h4 className="font-medium mb-2">Notes</h4>
                              <p className="text-sm text-muted-foreground">
                                {record.notes}
                              </p>
                            </div>
                          )}
                          {record.prescriptions && record.prescriptions.length > 0 && (
                            <div className="md:col-span-2">
                              <h4 className="font-medium mb-2">Prescriptions</h4>
                              <div className="flex flex-wrap gap-2">
                                {record.prescriptions.map((rx, idx) => (
                                  <Badge key={idx} variant="outline" className="flex items-center gap-1">
                                    <Pill className="h-3 w-3" />
                                    {rx}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {record.followUpDate && (
                            <div>
                              <h4 className="font-medium mb-2">Follow-up Scheduled</h4>
                              <Badge className="bg-accent/10 text-accent-foreground">
                                {new Date(record.followUpDate).toLocaleDateString("en-US", {
                                  weekday: "long",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          {userRole === "vet" && (
                            <Button size="sm">Edit Record</Button>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="vaccinations" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {overdueVaccinations.length > 0 && (
                <Card className="border-destructive/50 bg-destructive/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      Overdue Vaccinations
                    </CardTitle>
                    <CardDescription>
                      These vaccinations need immediate attention
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {overdueVaccinations.map((vax, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-lg bg-background"
                        >
                          <div className="flex items-center gap-3">
                            <Syringe className="h-4 w-4 text-destructive" />
                            <div>
                              <p className="font-medium">{vax.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Due: {new Date(vax.nextDue).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Button size="sm" variant="destructive">
                            Schedule
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Upcoming Vaccinations
                  </CardTitle>
                  <CardDescription>
                    Scheduled and upcoming vaccinations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingVaccinations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <CheckCircle className="h-10 w-10 text-primary mb-2" />
                      <p className="text-muted-foreground">All vaccinations are up to date!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingVaccinations.map((vax, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <Syringe className="h-4 w-4 text-primary" />
                            <div>
                              <p className="font-medium">{vax.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Due: {new Date(vax.nextDue).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">
                            {Math.ceil(
                              (new Date(vax.nextDue).getTime() - Date.now()) /
                                (1000 * 60 * 60 * 24)
                            )}{" "}
                            days
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Vaccination History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedPet.vaccinations.map((vax, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Syringe className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{vax.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Administered: {new Date(vax.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Next Due</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(vax.nextDue).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="allergies" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Known Allergies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPet.allergies.length === 0 ? (
                    <p className="text-muted-foreground">No known allergies</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedPet.allergies.map((allergy, idx) => (
                        <Badge key={idx} variant="destructive">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-warning-foreground" />
                    Medical Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPet.medicalConditions.length === 0 ? (
                    <p className="text-muted-foreground">No medical conditions on record</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedPet.medicalConditions.map((condition, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                          <p className="font-medium">{condition}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Pet Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Species</p>
                    <p className="font-medium capitalize">{selectedPet.species}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Breed</p>
                    <p className="font-medium">{selectedPet.breed}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Age</p>
                    <p className="font-medium">{selectedPet.age} years old</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Weight</p>
                    <p className="font-medium">{selectedPet.weight} lbs</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Color</p>
                    <p className="font-medium">{selectedPet.color}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">
                      {new Date(selectedPet.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Microchip ID</p>
                    <p className="font-mono text-sm">{selectedPet.microchipId || "Not registered"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Insurance</p>
                    <p className="font-medium">{selectedPet.insuranceProvider || "None"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
