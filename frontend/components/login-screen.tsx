'use client'

import { useState } from 'react'
import { useAuth, type RegisterData } from '@/lib/auth-context'
import { branchApi } from '@/lib/api'
import { useEffect } from 'react'
import type { Branch } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PawPrint, Loader2, AlertCircle } from 'lucide-react'

export function LoginScreen() {
  const { login, register } = useAuth()
  const [branches, setBranches] = useState<Branch[]>([])

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Register state
  const [regData, setRegData] = useState<Partial<RegisterData>>({ role: 'pet_owner' })
  const [regPassword, setRegPassword] = useState('')
  const [regError, setRegError] = useState('')
  const [regLoading, setRegLoading] = useState(false)

  useEffect(() => {
    branchApi.list().then(setBranches).catch(() => {})
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    const { error } = await login(loginEmail, loginPassword)
    if (error) setLoginError(error)
    setLoginLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegError('')
    if (!regData.full_name || !regData.email || !regPassword || !regData.role) {
      setRegError('Please fill all required fields.')
      return
    }
    if (regData.role === 'veterinarian' && (!regData.specialization || !regData.license_number || !regData.branch_id)) {
      setRegError('Vets need specialization, licence number, and branch.')
      return
    }
    if (regData.role === 'manager' && !regData.branch_id) {
      setRegError('Managers need a branch.')
      return
    }
    setRegLoading(true)
    const { error } = await register({ ...regData, password: regPassword } as RegisterData)
    if (error) setRegError(error)
    setRegLoading(false)
  }

  const updateReg = (field: Partial<RegisterData>) => setRegData((d) => ({ ...d, ...field }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mx-auto">
            <PawPrint className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">VetCare Pro</h1>
          <p className="text-muted-foreground text-sm">Veterinary Clinic Chain Management</p>
        </div>

        <Tabs defaultValue="login">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          {/* ── Login ── */}
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>Enter your credentials to access your account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  {loginError && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {loginError}
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={loginLoading}>
                    {loginLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Sign In
                  </Button>
                  <div className="text-xs text-muted-foreground text-center space-y-1 pt-2 border-t">
                    <p className="font-medium">Demo credentials (seed data):</p>
                    <p>Owner: henry@example.com / password123</p>
                    <p>Vet: alice@vetclinic.com / password123</p>
                    <p>Manager: frank@vetclinic.com / password123</p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Register ── */}
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Create account</CardTitle>
                <CardDescription>Join VetCare Pro</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={regData.role}
                      onValueChange={(v) => updateReg({ role: v as RegisterData['role'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pet_owner">Pet Owner</SelectItem>
                        <SelectItem value="veterinarian">Veterinarian</SelectItem>
                        <SelectItem value="manager">Clinic Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input
                        placeholder="John Doe"
                        value={regData.full_name || ''}
                        onChange={(e) => updateReg({ full_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={regData.email || ''}
                        onChange={(e) => updateReg({ email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        placeholder="555-0000"
                        value={regData.phone || ''}
                        onChange={(e) => updateReg({ phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password *</Label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                      />
                    </div>

                    {/* Pet Owner extras */}
                    {regData.role === 'pet_owner' && (
                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Input
                          placeholder="123 Main St"
                          value={regData.address || ''}
                          onChange={(e) => updateReg({ address: e.target.value })}
                        />
                      </div>
                    )}

                    {/* Vet extras */}
                    {regData.role === 'veterinarian' && (
                      <>
                        <div className="space-y-2">
                          <Label>Specialization *</Label>
                          <Input
                            placeholder="General Practice"
                            value={regData.specialization || ''}
                            onChange={(e) => updateReg({ specialization: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Licence Number *</Label>
                          <Input
                            placeholder="LIC-XXX"
                            value={regData.license_number || ''}
                            onChange={(e) => updateReg({ license_number: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Branch *</Label>
                          <Select
                            value={String(regData.branch_id || '')}
                            onValueChange={(v) => updateReg({ branch_id: Number(v) })}
                          >
                            <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                            <SelectContent>
                              {branches.map((b) => (
                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    {/* Manager extras */}
                    {regData.role === 'manager' && (
                      <>
                        <div className="space-y-2">
                          <Label>Branch *</Label>
                          <Select
                            value={String(regData.branch_id || '')}
                            onValueChange={(v) => updateReg({ branch_id: Number(v) })}
                          >
                            <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                            <SelectContent>
                              {branches.map((b) => (
                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Years of Experience</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={regData.experience ?? ''}
                            onChange={(e) => updateReg({ experience: Number(e.target.value) })}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {regError && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {regError}
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={regLoading}>
                    {regLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Create Account
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
