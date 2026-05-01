'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { UserRole } from './types'
import { authApi, type AuthPayload } from './api'

interface AuthUser {
  userId: number
  fullName: string
  email: string
  role: UserRole
  branchId: number | null
}

interface AuthContextValue {
  user: AuthUser | null
  isLoggedIn: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  register: (data: RegisterData) => Promise<{ error?: string }>
  logout: () => void
}

export interface RegisterData {
  full_name: string
  email: string
  password: string
  phone?: string
  role: 'pet_owner' | 'veterinarian' | 'manager'
  address?: string
  specialization?: string
  license_number?: string
  branch_id?: number
  experience?: number
}

function backendRoleToFrontend(role: string): UserRole {
  if (role === 'pet_owner') return 'owner'
  if (role === 'veterinarian') return 'vet'
  return 'manager'
}

function payloadToUser(p: AuthPayload): AuthUser {
  return {
    userId: p.user_id,
    fullName: p.full_name,
    email: p.email,
    role: backendRoleToFrontend(p.role),
    branchId: p.branch_id,
  }
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoggedIn: false,
  isLoading: true,
  login: async () => ({}),
  register: async () => ({}),
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('vet_token')
    const stored = localStorage.getItem('vet_user')
    if (token && stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem('vet_token')
        localStorage.removeItem('vet_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const payload = await authApi.login(email, password)
      localStorage.setItem('vet_token', payload.token)
      const u = payloadToUser(payload)
      localStorage.setItem('vet_user', JSON.stringify(u))
      setUser(u)
      return {}
    } catch (err: any) {
      return { error: err.message || 'Login failed' }
    }
  }, [])

  const register = useCallback(async (data: RegisterData) => {
    try {
      const payload = await authApi.register(data)
      localStorage.setItem('vet_token', payload.token)
      const u = payloadToUser(payload)
      localStorage.setItem('vet_user', JSON.stringify(u))
      setUser(u)
      return {}
    } catch (err: any) {
      return { error: err.message || 'Registration failed' }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('vet_token')
    localStorage.removeItem('vet_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
