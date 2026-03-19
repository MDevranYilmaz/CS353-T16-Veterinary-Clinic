'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InventoryTable } from '@/components/inventory-table'
import {
  OverdueVaccinationsChart,
  StockConsumptionChart,
  RevenueDistributionChart,
  AppointmentTrendsChart,
} from '@/components/analytics-charts'
import {
  medicines,
  invoices,
  dashboardStats,
  appointments,
  branches,
} from '@/lib/mock-data'
import type { Medicine } from '@/lib/types'
import {
  Package,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  FileText,
  Calendar,
  Syringe,
  Building,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ManagerDashboardProps {
  onNavigate: (view: string) => void
}

export function ManagerDashboard({ onNavigate }: ManagerDashboardProps) {
  const [inventory, setInventory] = useState<Medicine[]>(medicines)
  const stats = dashboardStats.manager
  const lowStockItems = inventory.filter((i) => i.currentStock <= i.minStock)
  const pendingInvoices = invoices.filter((i) => i.status === 'pending' || i.status === 'overdue')

  const handleAddStock = (itemId: string, quantity: number) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, currentStock: item.currentStock + quantity }
          : item
      )
    )
  }

  const handleRemoveStock = (itemId: string, quantity: number, reason: string) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, currentStock: Math.max(0, item.currentStock - quantity) }
          : item
      )
    )
    console.log(`[v0] Removed ${quantity} from ${itemId} - Reason: ${reason}`)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manager Dashboard</h1>
          <p className="text-muted-foreground">
            Downtown Clinic - Overview and Management
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onNavigate('reports')}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Reports
          </Button>
          <Button onClick={() => onNavigate('inventory')}>
            <Package className="w-4 h-4 mr-2" />
            Manage Inventory
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalInventoryItems}</p>
                <p className="text-sm text-muted-foreground">Inventory Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-destructive/10">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.lowStockItems}</p>
                <p className="text-sm text-muted-foreground">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-warning/10">
                <FileText className="w-5 h-5 text-warning-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingInvoices}</p>
                <p className="text-sm text-muted-foreground">Pending Bills</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-light">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10">
                <Syringe className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.overdueVaccinations}</p>
                <p className="text-sm text-muted-foreground">Overdue Vaccines</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Low Stock Alerts */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Low Stock Alerts</CardTitle>
                    <CardDescription>Items below minimum threshold</CardDescription>
                  </div>
                  {lowStockItems.length > 0 && (
                    <Badge variant="destructive">{lowStockItems.length} items</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {lowStockItems.length > 0 ? (
                  lowStockItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10">
                          {item.category === 'vaccine' ? (
                            <Syringe className="w-5 h-5 text-destructive" />
                          ) : (
                            <Package className="w-5 h-5 text-destructive" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-destructive">{item.currentStock}</p>
                        <p className="text-xs text-muted-foreground">Min: {item.minStock}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-primary" />
                    <p>All items are well-stocked</p>
                  </div>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onNavigate('inventory')}
                >
                  Manage Inventory
                </Button>
              </CardContent>
            </Card>

            {/* Pending Invoices */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Pending Invoices</CardTitle>
                    <CardDescription>Outstanding payments</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => onNavigate('billing')}>
                    View all
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border',
                      invoice.status === 'overdue' && 'border-destructive/30 bg-destructive/5'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex items-center justify-center w-10 h-10 rounded-lg',
                          invoice.status === 'overdue' ? 'bg-destructive/10' : 'bg-warning/10'
                        )}
                      >
                        <FileText
                          className={cn(
                            'w-5 h-5',
                            invoice.status === 'overdue' ? 'text-destructive' : 'text-warning-foreground'
                          )}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{invoice.ownerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {invoice.petName} - {invoice.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${invoice.total.toFixed(2)}</p>
                      <Badge
                        variant={invoice.status === 'overdue' ? 'destructive' : 'outline'}
                        className="text-xs"
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Quick Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <OverdueVaccinationsChart />
            <StockConsumptionChart />
          </div>
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryTable
            items={inventory}
            onAddStock={handleAddStock}
            onRemoveStock={handleRemoveStock}
          />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice Management</CardTitle>
              <CardDescription>Manage billing and payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'flex items-center justify-center w-12 h-12 rounded-lg',
                          invoice.status === 'paid'
                            ? 'bg-primary/10'
                            : invoice.status === 'overdue'
                            ? 'bg-destructive/10'
                            : 'bg-warning/10'
                        )}
                      >
                        {invoice.status === 'paid' ? (
                          <CheckCircle2 className="w-6 h-6 text-primary" />
                        ) : invoice.status === 'overdue' ? (
                          <XCircle className="w-6 h-6 text-destructive" />
                        ) : (
                          <Clock className="w-6 h-6 text-warning-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">Invoice #{invoice.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.ownerName} - {invoice.petName}
                        </p>
                        <p className="text-xs text-muted-foreground">{invoice.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xl font-bold">${invoice.total.toFixed(2)}</p>
                        <Badge
                          variant={
                            invoice.status === 'paid'
                              ? 'default'
                              : invoice.status === 'overdue'
                              ? 'destructive'
                              : 'outline'
                          }
                          className={cn(
                            invoice.status === 'paid' && 'bg-primary/10 text-primary border-0'
                          )}
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                      {invoice.status !== 'paid' && (
                        <Button size="sm">Mark Paid</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <AppointmentTrendsChart />
            <RevenueDistributionChart />
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <OverdueVaccinationsChart />
            <StockConsumptionChart />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
