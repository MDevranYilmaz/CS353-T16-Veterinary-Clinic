import type { Pet, Veterinarian, Appointment, Medicine, Branch, Invoice, Referral, MedicalRecord, VaccinationSchedule, VaccinationPlan, VaccinationPlanItem, VaccinationScheduleItem } from './types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ─── HTTP core ────────────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('vet_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  const json = await res.json()

  if (!res.ok) {
    throw new Error(json.error || `Request failed: ${res.status}`)
  }
  return json.data as T
}

const get = <T>(path: string) => request<T>(path)
const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) })
const put = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'PUT', body: JSON.stringify(body) })

// ─── Normalizers ─────────────────────────────────────────────────────────────

function guessSpecies(breed = ''): Pet['species'] {
  const b = breed.toLowerCase()
  if (b.match(/siamese|persian|maine|coon|tabby|feline|cat/)) return 'cat'
  if (b.match(/parrot|cockatiel|budgie|bird/)) return 'bird'
  if (b.match(/rabbit|bunny/)) return 'rabbit'
  return 'dog'
}

function calcAge(birthDate: string): number {
  if (!birthDate) return 0
  const diff = Date.now() - new Date(birthDate).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

function medCategory(type = ''): Medicine['category'] {
  const t = type.toLowerCase()
  if (t === 'vaccine') return 'vaccine'
  if (t === 'supplement') return 'supplement'
  return 'medicine'
}

export function normalizePet(p: any): Pet {
  return {
    id: String(p.pet_id),
    name: p.name,
    species: guessSpecies(p.breed),
    breed: p.breed || '',
    age: p.birth_date ? calcAge(p.birth_date) : 0,
    weight: 0,
    ownerId: String(p.owner_id),
    ownerName: p.owner_name || '',
    allergies: p.allergies ? String(p.allergies).split(',').map((s: string) => s.trim()).filter(Boolean) : [],
    medicalAlerts: [],
    vaccinationStatus: 'up-to-date',
    lastVisit: undefined,
  }
}

export function normalizeVet(v: any): Veterinarian {
  return {
    id: String(v.user_id),
    name: v.full_name,
    specialization: v.specialization || '',
    branchId: String(v.branch_id),
    branchName: v.branch_name || '',
    rating: v.avg_rating ? Number(v.avg_rating) : 0,
    available: true,
  }
}

export function normalizeAppointment(a: any): Appointment {
  const dt: string = a.date_time || ''
  let date = ''
  let time = ''

  // Try to parse as a Date first (handles RFC1123 like "Sun, 03 May 2026 14:00:00 GMT" and ISO strings)
  const parsed = Date.parse(dt)
  if (!isNaN(parsed)) {
    const d = new Date(parsed)
    // Convert and display times in Europe/Istanbul timezone
    try {
      date = d.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' }) // YYYY-MM-DD
      time = d.toLocaleTimeString('en-GB', { timeZone: 'Europe/Istanbul', hour12: false, hour: '2-digit', minute: '2-digit' }) // HH:MM
    } catch (e) {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const hh = String(d.getHours()).padStart(2, '0')
      const mm = String(d.getMinutes()).padStart(2, '0')
      date = `${year}-${month}-${day}`
      time = `${hh}:${mm}`
    }
  } else {
    // Fallback parsing for DB-style "YYYY-MM-DD HH:MM:SS" or other simple formats
    const parts = dt.split(' ')
    date = parts[0] || ''
    if (parts.length > 1 && parts[1]) time = parts[1].slice(0, 5)
    else time = dt.slice(11, 16) || ''
  }
  
  const rawStatus = (a.status || '').toLowerCase() as string
  const statusMap: Record<string, Appointment['status']> = {
    scheduled: 'scheduled',
    completed: 'completed',
    cancelled: 'cancelled',
  }
  return {
    id: String(a.appointment_id),
    petId: String(a.pet_id),
    petName: a.pet_name || '',
    petSpecies: guessSpecies(a.breed || ''),
    ownerId: String(a.owner_id || ''),
    ownerName: a.owner_name || '',
    vetId: String(a.vet_id),
    vetName: a.vet_name || '',
    branchId: String(a.branch_id || ''),
    branchName: a.branch_name || '',
    date,
    time: time || '--:--', // Fallback if time parsing fails
    type: (a.type || a.appointment_type || 'checkup').toLowerCase(),
    status: statusMap[rawStatus] ?? 'scheduled',
    notes: a.notes,
  }
}

export function normalizeMedicine(m: any): Medicine {
  const cat = medCategory(m.med_type)
  return {
    id: m.barcode_no,
    name: m.med_name,
    category: cat,
    unit: cat === 'vaccine' ? 'doses' : 'tablets',
    currentStock: Number(m.stock_count ?? 0),
    minStock: Number(m.min_threshold ?? 0),
    maxStock: Math.max(Number(m.stock_count ?? 0) * 2, Number(m.min_threshold ?? 0) * 10, 50),
    price: Number(m.unit_cost ?? 0),
    expiryDate: m.expiration_date || undefined,
    branchId: String(m.branch_id || ''),
  }
}

export function normalizeBranch(b: any): Branch {
  return {
    id: String(b.branch_id),
    name: b.name,
    address: b.address || '',
    phone: b.phone_number || '',
    managerId: '',
  }
}

export function normalizeBill(b: any): Invoice {
  return {
    id: String(b.bill_id),
    appointmentId: String(b.appointment_id),
    petName: b.pet_name || '',
    ownerName: b.owner_name || '',
    date: b.generated_date || '',
    items: [{
      description: 'Consultation & Treatment',
      quantity: 1,
      unitPrice: Number(b.total_amount),
      total: Number(b.total_amount),
    }],
    total: Number(b.total_amount),
    status: b.payment_status === 'Paid' ? 'paid' : 'pending',
  }
}

export function normalizeVaccination(v: any): VaccinationSchedule {
  const statusMap: Record<string, VaccinationSchedule['status']> = {
    'Overdue': 'overdue',
    'Due Soon': 'scheduled',
    'Upcoming': 'scheduled',
    'Up to Date': 'completed',
  }
  return {
    id: String(v.vac_id),
    petId: String(v.pet_id),
    petName: v.pet_name || '',
    vaccineId: v.barcode_no || '',
    vaccineName: v.vaccine_name || '',
    dueDate: v.next_due_date || '',
    status: statusMap[v.vaccination_status] ?? 'scheduled',
  }
}

export function normalizeReferral(r: any): Referral {
  const statusMap: Record<string, Referral['status']> = {
    'Pending': 'pending',
    'Accepted': 'accepted',
    'Rejected': 'rejected',
  }
  return {
    id: String(r.referral_id),
    fromVetId: String(r.sender_vet_id),
    fromVetName: r.sender_name || '',
    toVetId: String(r.receiver_vet_id),
    toVetName: r.receiver_name || '',
    toBranchId: '',
    toBranchName: '',
    petId: String(r.pet_id),
    petName: r.pet_name || '',
    reason: r.reason || '',
    date: r.referral_date || '',
    status: statusMap[r.status] ?? 'pending',
  }
}

export function normalizeMedicalRecord(r: any): MedicalRecord {
  const dt: string = r.date_time || ''
  return {
    id: `${r.pet_id}-${dt}`,
    petId: String(r.pet_id),
    petName: r.pet_name || '',
    vetId: '',
    vetName: '',
    date: dt.split(' ')[0] || '',
    diagnosis: r.diagnosis || '',
    treatment: r.treatments || '',
    prescriptions: [],
    notes: r.notes || '',
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthPayload {
  user_id: number
  full_name: string
  email: string
  role: 'pet_owner' | 'veterinarian' | 'manager'
  branch_id: number | null
  token: string
}

export const authApi = {
  login: (email: string, password: string) =>
    post<AuthPayload>('/auth/login', { email, password }),

  register: (data: {
    full_name: string
    email: string
    password: string
    phone?: string
    role: string
    address?: string
    specialization?: string
    license_number?: string
    branch_id?: number
    experience?: number
  }) => post<AuthPayload>('/auth/register', data),

  me: () => get<any>('/auth/me'),
}

// ─── Branches ────────────────────────────────────────────────────────────────

export const branchApi = {
  list: async (): Promise<Branch[]> => {
    const data = await get<any[]>('/branches')
    return (data || []).map(normalizeBranch)
  },
  get: async (id: number | string): Promise<Branch> => {
    const data = await get<any>(`/branches/${id}`)
    return normalizeBranch(data)
  },
}

// ─── Vets ────────────────────────────────────────────────────────────────────

export const vetApi = {
  list: async (filters?: { branch_id?: string; specialization?: string }): Promise<Veterinarian[]> => {
    const params = new URLSearchParams()
    if (filters?.branch_id) params.set('branch_id', filters.branch_id)
    if (filters?.specialization) params.set('specialization', filters.specialization)
    const data = await get<any>(`/vets?${params}`)
    const items = data?.items ?? data ?? []
    return items.map(normalizeVet)
  },
  get: async (id: number | string): Promise<Veterinarian & { avg_rating?: number }> => {
    const data = await get<any>(`/vets/${id}`)
    return { ...normalizeVet(data), avg_rating: data.avg_rating }
  },
  availableSlots: async (vetId: number | string, date: string): Promise<string[]> => {
    const data = await get<any>(`/vets/${vetId}/available-slots?date=${date}`)
    return data?.available_slots ?? []
  },
  rating: async (vetId: number | string) => {
    return get<{ rating: { avg_rating: number; total: number }; reviews: any[] }>(`/vets/${vetId}/rating`)
  },
}

// ─── Pets ────────────────────────────────────────────────────────────────────

export const petApi = {
  list: async (owner_id: number | string): Promise<Pet[]> => {
    if (!owner_id) {
      console.warn('petApi.list called without owner_id; returning empty list')
      return []
    }
    const data = await get<any>(`/pets?owner_id=${owner_id}`)
    const items = data?.items ?? data ?? []
    return items.map(normalizePet)
  },
  get: async (petId: number | string): Promise<Pet> => {
    const data = await get<any>(`/pets/${petId}`)
    return normalizePet(data)
  },
  create: (data: { name: string; owner_id: number; breed?: string; birth_date?: string; allergies?: string }) =>
    post<{ pet_id: number }>('/pets', data),
  medicalHistory: async (petId: number | string): Promise<MedicalRecord[]> => {
    const data = await get<any>(`/pets/${petId}/medical-history`)
    const items = data?.items ?? data ?? []
    return items.map(normalizeMedicalRecord)
  },
  prescriptions: async (petId: number | string): Promise<any[]> => {
    const data = await get<any>(`/pets/${petId}/prescriptions`)
    const items = data?.items ?? data ?? []
    return items
  },
  vaccinations: async (petId: number | string): Promise<any[]> => {
    const data = await get<any>(`/pets/${petId}/vaccinations`)
    const items = data?.items ?? data ?? []
    return items
  },
  referrals: async (petId: number | string): Promise<Referral[]> => {
    const data = await get<any>(`/pets/${petId}/referrals`)
    const items = data?.items ?? data ?? []
    return items.map(normalizeReferral)
  },
}

// ─── Appointments ────────────────────────────────────────────────────────────

export const appointmentApi = {
  listByOwner: async (ownerId: number | string): Promise<Appointment[]> => {
    if (!ownerId) {
      console.warn('appointmentApi.listByOwner called without ownerId; returning empty list')
      return []
    }
    const data = await get<any>(`/appointments?owner_id=${ownerId}`)
    const items = data?.items ?? data ?? []
    return items.map(normalizeAppointment)
  },
  listByVet: async (vetId: number | string, date?: string): Promise<Appointment[]> => {
    const params = new URLSearchParams({ vet_id: String(vetId) })
    if (date) params.set('date', date)
    const data = await get<any>(`/appointments/vet?${params}`)
    // Backend may return either an array or an object { appointments: [...] }
    let items: any[] = []
    if (Array.isArray(data)) items = data
    else if (data && Array.isArray(data.appointments)) items = data.appointments
    else if (data && Array.isArray(data.data)) items = data.data
    else {
      console.warn('Unexpected /appointments/vet response shape', data)
    }
    if (items.length > 0) {
      console.log('[API] First appointment raw data:', items[0])
    }
    return items.map(normalizeAppointment)
  },
  listByPet: async (petId: number | string): Promise<Appointment[]> => {
    const data = await get<any>(`/appointments?pet_id=${petId}`)
    // Backend may return either an array or an object { appointments: [...] }
    let items: any[] = []
    if (Array.isArray(data)) items = data
    else if (data && Array.isArray(data.appointments)) items = data.appointments
    else if (data && Array.isArray(data.items)) items = data.items
    else if (data && Array.isArray(data.data)) items = data.data
    else if (data && typeof data === 'object') {
      // try to extract any array value
      const arr = Object.values(data).find((v) => Array.isArray(v))
      if (Array.isArray(arr)) items = arr as any[]
      else {
        console.warn('Unexpected /appointments response shape for pet:', data)
      }
    }
    return items.map(normalizeAppointment)
  },
  book: (data: { date_time: string; pet_id: number; vet_id: number; type?: string; notes?: string }) =>
    post<{ appointment_id: number }>('/appointments', data),
  updateStatus: (id: number | string, status: 'Scheduled' | 'Completed' | 'Cancelled') =>
    put<any>(`/appointments/${id}/status`, { status }),
}

// ─── Billing ─────────────────────────────────────────────────────────────────

export const billingApi = {
  listByOwner: async (ownerId: number | string): Promise<Invoice[]> => {
    if (!ownerId) {
      console.warn('billingApi.listByOwner called without ownerId; returning empty list')
      return []
    }
    const data = await get<any>(`/billing?owner_id=${ownerId}`)
    const items = data?.items ?? data ?? []
    return items.map(normalizeBill)
  },
  listAll: async (): Promise<Invoice[]> => {
    const data = await get<any>('/billing')
    const items = data?.items ?? data ?? []
    return items.map(normalizeBill)
  },
  pay: (billId: number | string) =>
    put<any>(`/billing/${billId}/pay`, {}),
}

// ─── Inventory ───────────────────────────────────────────────────────────────

export const inventoryApi = {
  listByBranch: async (branchId: number | string): Promise<Medicine[]> => {
    const data = await get<any>(`/inventory/${branchId}`)
    const items = data?.items ?? data ?? []
    return items.map(normalizeMedicine)
  },
  listAllMedicines: async (): Promise<Medicine[]> => {
    const data = await get<any[]>('/inventory/medicines')
    return (data || []).map((m: any) => ({
      id: m.barcode_no,
      name: m.med_name,
      category: medCategory(m.med_type),
      unit: medCategory(m.med_type) === 'vaccine' ? 'doses' : 'tablets',
      currentStock: 0,
      minStock: 0,
      maxStock: 100,
      price: Number(m.unit_cost ?? 0),
      branchId: '',
    }))
  },
  addStock: (branchId: number | string, data: {
    barcode_no: string
    stock_count: number
    min_threshold?: number
    batch_number?: string
    expiration_date?: string
  }) => post<any>(`/inventory/${branchId}`, data),
  lowStock: async (branchId: number | string): Promise<Medicine[]> => {
    const data = await get<any[]>(`/inventory/low-stock/${branchId}`)
    return (data || []).map(normalizeMedicine)
  },
}

// ─── Prescriptions ───────────────────────────────────────────────────────────

export const prescriptionApi = {
  create: (data: {
    pet_id: number
    date_time: string
    expiration_date?: string
    medicines: { barcode_no: string; dosage: number; frequency: number }[]
  }) => post<{ prescription_id: number }>('/prescriptions', data),
  get: async (prescriptionId: number | string): Promise<any> => {
    return get<any>(`/prescriptions/${prescriptionId}`)
  },
}

// ─── Vaccinations ────────────────────────────────────────────────────────────

export const vaccinationApi = {
  status: async (petId: number | string): Promise<VaccinationSchedule[]> => {
    const data = await get<any[]>(`/vaccinations/status/${petId}`)
    return (data || []).map(normalizeVaccination)
  },
  overdueForPet: (petId: number | string) =>
    get<any[]>(`/vaccinations/status/${petId}/overdue`),
  upcomingForPet: (petId: number | string, days = 60) =>
    get<any[]>(`/vaccinations/status/${petId}/upcoming?days=${days}`),
  petProfileSummary: (petId: number | string) =>
    get<any>(`/vaccinations/pet-profile/${petId}/summary`),
  overdue: async (branchId?: number | string): Promise<VaccinationSchedule[]> => {
    const path = branchId ? `/vaccinations/overdue?branch_id=${branchId}` : '/vaccinations/overdue'
    const data = await get<any[]>(path)
    return (data || []).map(normalizeVaccination)
  },
  record: (data: { vac_date: string; pet_id: number; barcode_no: string; next_due_date?: string }) =>
    post<{ vac_id: number }>('/vaccinations', data),
  recommendations: (query: string) =>
    get<any[]>(`/vaccinations/recommendations?q=${encodeURIComponent(query)}`),
  latestForPetVaccine: (petId: number | string, barcodeNo: string) =>
    get<any>(`/vaccinations/pet/${petId}/vaccine/${encodeURIComponent(barcodeNo)}/latest`),
  getRecord: (vacId: number | string) => get<any>(`/vaccinations/${vacId}`),
  recommended: (petId: number | string) => get<any>(`/vaccinations/recommended/${petId}`),
  availableVaccines: (vetId?: number | string) =>
    get<any[]>(vetId ? `/vaccinations/available-vaccines?vet_id=${vetId}` : '/vaccinations/available-vaccines'),
  checkAvailability: (vetId: number | string, barcodeNo: string, date?: string) => {
    const params = new URLSearchParams({ vet_id: String(vetId), barcode_no: barcodeNo })
    if (date) params.set('date', date)
    return get<{ available: boolean; stock: number; batch_number?: string; expiration_date?: string }>(
      `/vaccinations/availability?${params}`
    )
  },
  upcomingAppointments: (petId: number | string) => get<any[]>(`/vaccinations/upcoming-appointments/${petId}`),
  overdueSummary: (branchId?: number | string, thresholdDays?: number) => {
    const params = new URLSearchParams()
    if (branchId) params.set('branch_id', String(branchId))
    if (typeof thresholdDays === 'number') params.set('threshold_days', String(thresholdDays))
    const query = params.toString()
    return get<any>(query ? `/vaccinations/overdue-summary?${query}` : '/vaccinations/overdue-summary')
  },
}

// ─── Referrals ───────────────────────────────────────────────────────────────

export const referralApi = {
  list: async (filters?: { vet_id?: string; pet_id?: string }): Promise<Referral[]> => {
    const params = new URLSearchParams()
    if (filters?.vet_id) params.set('vet_id', filters.vet_id)
    if (filters?.pet_id) params.set('pet_id', filters.pet_id)
    const data = await get<any>(`/referrals?${params}`)
    const items = data?.items ?? data ?? []
    return items.map(normalizeReferral)
  },
  create: (data: { reason: string; referral_date: string; receiver_vet_id: number; pet_id: number }) =>
    post<{ referral_id: number }>('/referrals', data),
  updateStatus: (id: number | string, status: 'Accepted' | 'Rejected') =>
    put<any>(`/referrals/${id}/status`, { status }),
}

// ─── Medical Records ─────────────────────────────────────────────────────────

export const medicalRecordApi = {
  create: (data: {
    pet_id: number
    date_time: string
    diagnosis: string
    treatments: string
    notes?: string
  }) => post<{ success: boolean }>('/medical-records', data),
}

// ─── Boarding ────────────────────────────────────────────────────────────────

export const boardingApi = {
  list: (branchId: number | string, availableOnly = false, checkIn?: string, checkOut?: string) => {
    let url = `/boarding?branch_id=${branchId}&available=${availableOnly}`
    if (checkIn) url += `&check_in=${checkIn}`
    if (checkOut) url += `&check_out=${checkOut}`
    return get<any[]>(url)
  },
  myReservations: () => get<any[]>('/boarding/my-reservations'),
  myPastStays: () => get<any[]>('/boarding/my-past-stays'),
  book: (data: { boarding_unit_id: number; pet_id: number; check_in_date: string; check_out_date: string; feeding_instructions?: string }) =>
    post<any>('/boarding/book', data),
  checkout: (id: number | string) => put<any>(`/boarding/${id}/checkout`, {}),
  toggleMaintenance: (id: number | string, under_maintenance: boolean) =>
    put<any>(`/boarding/${id}/maintenance`, { under_maintenance }),
}

// ─── Evaluations ─────────────────────────────────────────────────────────────

export const evaluationApi = {
  forVet: (vetId: number | string) =>
    get<{ rating: any; reviews: any[] }>(`/evaluations/vet/${vetId}`),
  create: (data: { points: number; date: string; comment?: string; vet_id: number }) =>
    post<{ eval_id: number }>('/evaluations', data),
}

// ─── Waste logs ──────────────────────────────────────────────────────────────

export const wasteLogApi = {
  list: (branchId: number | string) => get<any[]>(`/waste-logs/${branchId}`),
  log: (data: { quantity: number; waste_date: string; barcode_no: string; reason?: string }) =>
    post<{ log_id: number }>('/waste-logs', data),
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export const reportApi = {
  vaccinationTrends: () => get<any[]>('/reports/vaccination-trends'),
  compliance: () => get<any[]>('/reports/vaccination-compliance'),
  mostAdministeredVaccines: (branchId?: number | string) =>
    get<any[]>(
      branchId
        ? `/reports/vaccination-most-administered?branch_id=${branchId}`
        : '/reports/vaccination-most-administered'
    ),
  overdueRates: () => get<any[]>('/reports/vaccination-overdue-rates'),
  vaccinationCoverage: () => get<any[]>('/reports/vaccination-coverage'),
  veterinarianVaccinationPerformance: (months?: number) =>
    get<any[]>(
      typeof months === 'number'
        ? `/reports/veterinarian-vaccination-performance?months=${months}`
        : '/reports/veterinarian-vaccination-performance'
    ),
  branchPerformance: () => get<any[]>('/reports/branch-performance'),
  stockConsumption: (branchId: number | string) => get<any[]>(`/reports/stock-consumption/${branchId}`),
  wasteStats: (branchId: number | string) => get<any[]>(`/reports/waste-stats/${branchId}`),
}

// ─── Vaccination Plans ───────────────────────────────────────────────────────

export const vaccinationPlanApi = {
  // Plan management
  create: (data: { plan_name: string; species: string; breed?: string; description?: string }) =>
    post<{ plan_id: number }>('/vaccination-plans', data),
  list: (species?: string, breed?: string) => {
    const params = new URLSearchParams()
    if (species) params.set('species', species)
    if (breed) params.set('breed', breed)
    return get<{ plans: VaccinationPlan[] }>(`/vaccination-plans?${params}`).then((data) => data.plans || [])
  },
  get: (planId: number | string) =>
    get<any>(`/vaccination-plans/${planId}`),
  update: (planId: number | string, data: { plan_name?: string; description?: string }) =>
    put<any>(`/vaccination-plans/${planId}`, data),
  delete: (planId: number | string) =>
    request<any>(`/vaccination-plans/${planId}`, { method: 'DELETE' }),

  // Plan items
  addItem: (planId: number | string, data: { vaccine_barcode: string; age_weeks: number; sequence_number?: number; repeat_every_months?: number; gender_applicable?: 'M' | 'F'; notes?: string }) =>
    post<{ item_id: number }>(`/vaccination-plans/${planId}/items`, data),
  removeItem: (itemId: number | string) =>
    request<any>(`/vaccination-plans/items/${itemId}`, { method: 'DELETE' }),

  // Apply plans to pets
  applyPlan: (petId: number | string, planId: number | string) =>
    post<any>(`/vaccination-plans/pets/${petId}/apply`, { plan_id: planId }),
  removePlan: (petId: number | string, planId: number | string) =>
    post<any>(`/vaccination-plans/pets/${petId}/remove`, { plan_id: planId }),

  // Get pet schedule and status
  getPetSchedule: (petId: number | string) =>
    get<{ schedule: any[] }>(`/vaccination-plans/pets/${petId}/schedule`).then((data) => data.schedule || []),
  getApplicablePlans: (petId: number | string) =>
    get<{ plans: any[] }>(`/vaccination-plans/pets/${petId}/applicable`).then((data) => data.plans || []),
  getOverdue: (petId: number | string) =>
    get<{ overdue: any[] }>(`/vaccination-plans/pets/${petId}/overdue`).then((data) => data.overdue || []),
  getUpcoming: (petId: number | string, days?: number) => {
    const params = new URLSearchParams()
    if (days) params.set('days', String(days))
    return get<{ upcoming: any[] }>(`/vaccination-plans/pets/${petId}/upcoming?${params}`).then((data) => data.upcoming || [])
  },
}
