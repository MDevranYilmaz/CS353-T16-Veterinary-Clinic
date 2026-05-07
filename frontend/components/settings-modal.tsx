'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userName: string
  userEmail: string
  userPhone?: string
  userRole?: 'owner' | 'vet' | 'manager'
  userBranchName?: string
}

export function SettingsModal({ open, onOpenChange, userName, userEmail, userPhone, userRole, userBranchName }: SettingsModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: userName,
    email: userEmail,
    phone: userPhone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Validate passwords match if changing password
      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        alert('New passwords do not match')
        setLoading(false)
        return
      }

      // TODO: Make API call to update user profile
      // For now, just show success
      alert('Profile updated successfully')
      onOpenChange(false)
    } catch (error) {
      alert('Update failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription>
            Update your password
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Branch Name (Manager only) */}
          {userRole === 'manager' && userBranchName && (
            <div className="space-y-2">
              <Label htmlFor="branch">Branch Name</Label>
              <Input
                id="branch"
                value={userBranchName}
                disabled
                className="bg-muted"
              />
            </div>
          )}

          {/* Password Section */}
          <div className="pt-4 border-t">
            <h3 className="font-medium text-sm mb-3">Change Password</h3>

            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
              />
            </div>

            <div className="space-y-2 mt-3">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
              />
            </div>

            <div className="space-y-2 mt-3">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
