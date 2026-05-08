'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { inventoryApi, billingApi, vaccinationApi, wasteLogApi } from '@/lib/api'
import type { Medicine, Invoice } from '@/lib/types'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Package,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  FileText,
  Syringe,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ManagerDashboardProps {
  onNavigate: (view: string) => void
  inventoryOnly?: boolean
  billingOnly?: boolean
}

export function ManagerDashboard({ onNavigate, inventoryOnly, billingOnly }: ManagerDashboardProps) {
  const { user } = useAuth()
  const [inventory, setInventory] = useState<Medicine[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [overdueVaxCount, setOverdueVaxCount] = useState(0)
  const [overdueVax, setOverdueVax] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [invoiceDetail, setInvoiceDetail] = useState<any | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const openInvoiceDetail = async (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setInvoiceDetail(null)
    setLoadingDetail(true)
    try {
      const data = await billingApi.detail(invoice.id)
      setInvoiceDetail(data)
    } catch {}
    setLoadingDetail(false)
  }

  const branchId = user?.branchId

  useEffect(() => {
    if (!branchId) return
    setLoading(true)
    Promise.all([
      inventoryApi.listByBranch(branchId),
      billingApi.listAll(),
      vaccinationApi.overdueRaw(branchId),
    ]).then(([inv, bills, vax]) => {
      setInventory(inv)
      setInvoices(bills)
      setOverdueVax(vax)
      setOverdueVaxCount(vax.length)
    }).catch(console.error).finally(() => setLoading(false))
  }, [branchId])

  const lowStockItems = inventory.filter((i) => i.currentStock <= i.minStock)
  const pendingInvoices = invoices.filter((i) => i.status === 'pending')
  const monthlyRevenue = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.total, 0)

  const handleAddStock = async (itemId: string, quantity: number) => {
    if (!branchId) return
    try {
      await inventoryApi.addStock(branchId, { barcode_no: itemId, stock_count: quantity })
      const updated = await inventoryApi.listByBranch(branchId)
      setInventory(updated)
    } catch (e) {
      console.error('[ManagerDashboard] addStock error:', e)
    }
  }

  const handleRemoveStock = async (itemId: string, quantity: number, reason: string) => {
    if (!branchId) return
    try {
      const today = new Date().toISOString().slice(0, 10)
      await wasteLogApi.log({ quantity, waste_date: today, barcode_no: itemId, reason })
      const updated = await inventoryApi.listByBranch(branchId)
      setInventory(updated)
    } catch (e) {
      console.error('[ManagerDashboard] removeStock error:', e)
    }
  }

  const handleMarkPaid = async (billId: string) => {
    try {
      await billingApi.pay(billId)
      const updated = await billingApi.listAll()
      setInvoices(updated)
    } catch (e) {
      console.error('[ManagerDashboard] markPaid error:', e)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  if (inventoryOnly) {
    return (
      <InventoryTable
        items={inventory}
        onAddStock={handleAddStock}
        onRemoveStock={handleRemoveStock}
      />
    )
  }

  if (billingOnly) {
    return (
      <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Invoice Management</CardTitle>
          <CardDescription>Manage billing and payments</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No invoices found.</p>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => openInvoiceDetail(invoice)}>
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'flex items-center justify-center w-12 h-12 rounded-lg',
                      invoice.status === 'paid' ? 'bg-primary/10' : 'bg-warning/10'
                    )}>
                      {invoice.status === 'paid' ? (
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      ) : (
                        <Clock className="w-6 h-6 text-warning-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">Invoice #{invoice.id}</p>
                      <p className="text-sm text-muted-foreground">{invoice.ownerName} - {invoice.petName}</p>
                      <p className="text-xs text-muted-foreground">{invoice.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xl font-bold">${invoice.total.toFixed(2)}</p>
                      <Badge
                        variant={invoice.status === 'paid' ? 'default' : 'outline'}
                        className={cn(invoice.status === 'paid' && 'bg-primary/10 text-primary border-0')}
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                    {invoice.status !== 'paid' && (
                      <Button size="sm" onClick={(e) => { e.stopPropagation(); handleMarkPaid(invoice.id) }}>Mark Paid</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}

      <Dialog open={selectedInvoice !== null} onOpenChange={() => { setSelectedInvoice(null); setInvoiceDetail(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invoice #{selectedInvoice?.id}</DialogTitle>
            <DialogDescription>{selectedInvoice?.ownerName} — {selectedInvoice?.petName}</DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground">Date</p><p className="font-medium">{selectedInvoice.date}</p></div>
                <div><p className="text-muted-foreground">Status</p>
                  <Badge variant={selectedInvoice.status === 'paid' ? 'default' : 'outline'} className={cn(selectedInvoice.status === 'paid' && 'bg-primary/10 text-primary border-0')}>
                    {selectedInvoice.status}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Cost Breakdown</p>
                {loadingDetail ? (
                  <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                ) : (
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium">Item</th>
                          <th className="text-center px-3 py-2 font-medium">Qty</th>
                          <th className="text-right px-3 py-2 font-medium">Unit</th>
                          <th className="text-right px-3 py-2 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="px-3 py-2 capitalize">
                            {invoiceDetail?.appointment_type ? `${invoiceDetail.appointment_type} - Examination Fee` : 'Examination Fee'}
                          </td>
                          <td className="text-center px-3 py-2">1</td>
                          <td className="text-right px-3 py-2">${Number(invoiceDetail?.examination_fee ?? 100).toFixed(2)}</td>
                          <td className="text-right px-3 py-2">${Number(invoiceDetail?.examination_fee ?? 100).toFixed(2)}</td>
                        </tr>
                        {(invoiceDetail?.medication_breakdown || []).map((med: any, idx: number) => (
                          <tr key={idx} className="border-t">
                            <td className="px-3 py-2">{med.med_name}</td>
                            <td className="text-center px-3 py-2">{med.dosage}</td>
                            <td className="text-right px-3 py-2">${Number(med.unit_cost).toFixed(2)}</td>
                            <td className="text-right px-3 py-2">${Number(med.line_total).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total</span>
                <span>${selectedInvoice.total.toFixed(2)}</span>
              </div>

              {selectedInvoice.status !== 'paid' && (
                <Button className="w-full" onClick={() => { handleMarkPaid(selectedInvoice.id); setSelectedInvoice(null); setInvoiceDetail(null) }}>
                  Mark Paid
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      </>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manager Dashboard</h1>
          <p className="text-muted-foreground">
            {user?.fullName ? `${user.fullName} — ` : ''}Branch Overview and Management
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onNavigate('reports')}>
            <BarChart3 className="w-4 h-4 mr-2" />Reports
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { icon: Package, value: inventory.length, label: 'Inventory Items', color: 'bg-primary/10 text-primary' },
          { icon: AlertTriangle, value: lowStockItems.length, label: 'Low Stock', color: 'bg-destructive/10 text-destructive' },
          { icon: FileText, value: pendingInvoices.length, label: 'Pending Bills', color: 'bg-warning/10 text-warning-foreground' },
          { icon: DollarSign, value: `$${monthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, label: 'Revenue (Paid)', color: 'bg-primary/10 text-primary' },
          { icon: Syringe, value: overdueVaxCount, label: 'Overdue Vaccines', color: 'bg-accent/10 text-accent' },
        ].map(({ icon: Icon, value, label, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('flex items-center justify-center w-10 h-10 rounded-xl', color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vaccines">
            Overdue Vaccines
            {overdueVaxCount > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">{overdueVaxCount}</Badge>
            )}
          </TabsTrigger>
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
                  lowStockItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/5">
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
              </CardContent>
            </Card>

            {/* Pending Invoices */}
            <Card>
              <CardHeader className="pb-3">
                <div>
                  <CardTitle className="text-lg">Pending Invoices</CardTitle>
                  <CardDescription>Outstanding payments</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingInvoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No pending invoices.</p>
                ) : (
                  pendingInvoices.slice(0, 5).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning/10">
                          <FileText className="w-5 h-5 text-warning-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{invoice.ownerName}</p>
                          <p className="text-xs text-muted-foreground">{invoice.petName} - {invoice.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${invoice.total.toFixed(2)}</p>
                        <Badge variant="outline" className="text-xs">{invoice.status}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <OverdueVaccinationsChart />
            <StockConsumptionChart />
          </div>
        </TabsContent>

        <TabsContent value="vaccines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Syringe className="w-5 h-5 text-primary" />
                Overdue Vaccinations — Your Branch
              </CardTitle>
              <CardDescription>
                Overdue = past due date set by the vet. Priority: Critical &gt;90 days, High Priority &gt;30 days, Moderate otherwise.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {overdueVax.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-primary" />
                  <p>No overdue vaccinations at your branch</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {overdueVax.map((v, i) => {
                    const priority = v.days_overdue > 90 ? 'Critical' : v.days_overdue > 30 ? 'High Priority' : 'Moderate'
                    const priorityStyle = v.days_overdue > 90
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : v.days_overdue > 30
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    return (
                      <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10">
                            <Syringe className="w-5 h-5 text-destructive" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{v.pet_name}
                              <span className="text-muted-foreground font-normal"> ({v.breed})</span>
                            </p>
                            <p className="text-xs text-muted-foreground">{v.vaccine_name} · {v.vac_type}</p>
                            <p className="text-xs text-muted-foreground">Owner: {v.owner_name} · {v.owner_phone}</p>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge variant="outline" className={cn('text-xs', priorityStyle)}>{priority}</Badge>
                          <p className="text-sm font-semibold text-destructive">{v.days_overdue} days overdue</p>
                          <p className="text-xs text-muted-foreground">Last vet: {v.vet_name}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
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
