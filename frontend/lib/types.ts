export type UserRole = 'owner' | 'vet' | 'manager'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  branchId?: string
}

export interface Pet {
  id: string
  name: string
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'
  breed: string
  age: number
  weight: number
  ownerId: string
  ownerName: string
  allergies: string[]
  medicalAlerts: string[]
  imageUrl?: string
  vaccinationStatus: 'up-to-date' | 'due-soon' | 'overdue'
  lastVisit?: string
}

export interface Veterinarian {
  id: string
  name: string
  specialization: string
  branchId: string
  branchName: string
  avatar?: string
  rating: number
  available: boolean
}

export interface Appointment {
  id: string
  petId: string
  petName: string
  petSpecies: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'
  ownerId: string
  ownerName: string
  vetId: string
  vetName: string
  branchId: string
  branchName: string
  date: string
  time: string
  type: 'checkup' | 'vaccination' | 'surgery' | 'emergency' | 'followup'
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  notes?: string
}

export interface MedicalRecord {
  id: string
  petId: string
  petName: string
  vetId: string
  vetName: string
  date: string
  diagnosis: string
  treatment: string
  prescriptions: Prescription[]
  notes: string
}

export interface Prescription {
  id: string
  medicineId: string
  medicineName: string
  dosage: string
  frequency: string
  duration: string
  quantity: number
}

export interface Medicine {
  id: string
  name: string
  category: 'medicine' | 'vaccine' | 'supplement'
  unit: string
  currentStock: number
  minStock: number
  maxStock: number
  price: number
  expiryDate?: string
  branchId: string
}

export interface InventoryItem extends Medicine {
  lastRestocked?: string
  supplier?: string
}

export interface Branch {
  id: string
  name: string
  address: string
  phone: string
  managerId: string
}

export interface Invoice {
  id: string
  appointmentId: string
  petName: string
  ownerName: string
  date: string
  items: InvoiceItem[]
  total: number
  status: 'pending' | 'paid' | 'overdue'
}

export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Referral {
  id: string
  fromVetId: string
  fromVetName: string
  toVetId: string
  toVetName: string
  toBranchId: string
  toBranchName: string
  petId: string
  petName: string
  reason: string
  date: string
  status: 'pending' | 'accepted' | 'completed'
}

export interface StockEntry {
  id: string
  medicineId: string
  medicineName: string
  quantity: number
  type: 'add' | 'remove' | 'waste'
  reason?: string
  date: string
  userId: string
}

export interface VaccinationSchedule {
  id: string
  petId: string
  petName: string
  vaccineId: string
  vaccineName: string
  dueDate: string
  status: 'scheduled' | 'completed' | 'overdue'
}
