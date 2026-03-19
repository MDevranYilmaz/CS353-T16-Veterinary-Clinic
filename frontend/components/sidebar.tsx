'use client'

import { useState } from 'react'
import type { UserRole } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Package,
  FileText,
  BarChart3,
  Stethoscope,
  PawPrint,
  ClipboardList,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface SidebarProps {
  currentRole: UserRole
  currentView: string
  onViewChange: (view: string) => void
  userName: string
  userAvatar?: string
}

const roleNavItems: Record<UserRole, { id: string; label: string; icon: React.ElementType }[]> = {
  owner: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-pets', label: 'My Pets', icon: PawPrint },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'find-vet', label: 'Find a Vet', icon: Stethoscope },
    { id: 'invoices', label: 'My Invoices', icon: FileText },
  ],
  vet: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'schedule', label: 'My Schedule', icon: Calendar },
    { id: 'patients', label: 'Patients', icon: PawPrint },
    { id: 'records', label: 'Medical Records', icon: ClipboardList },
    { id: 'vaccinations', label: 'Vaccinations', icon: Stethoscope },
    { id: 'referrals', label: 'Referrals', icon: ArrowLeftRight },
  ],
  manager: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'billing', label: 'Billing', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'staff', label: 'Staff', icon: Users },
  ],
}

export function Sidebar({ currentRole, currentView, onViewChange, userName, userAvatar }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const navItems = roleNavItems[currentRole]

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return 'Pet Owner'
      case 'vet':
        return 'Veterinarian'
      case 'manager':
        return 'Manager'
    }
  }

  return (
    <aside
      className={cn(
        'flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
          <PawPrint className="w-6 h-6 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="font-bold text-lg">VetCare Pro</h1>
            <p className="text-xs text-sidebar-foreground/70">{getRoleLabel(currentRole)}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </Button>
      </div>

      {/* User Profile */}
      <div className={cn(
        'p-4 border-t border-sidebar-border',
        collapsed ? 'flex justify-center' : ''
      )}>
        <div className={cn('flex items-center gap-3', collapsed && 'flex-col')}>
          <Avatar className="w-10 h-10">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
              {userName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-sidebar-foreground/70 truncate">{getRoleLabel(currentRole)}</p>
            </div>
          )}
          {!collapsed && (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="w-8 h-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
