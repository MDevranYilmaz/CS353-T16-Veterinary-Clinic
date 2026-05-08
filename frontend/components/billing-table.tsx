"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Search, CreditCard, Receipt, CheckCircle, Loader2 } from "lucide-react"
import type { Bill } from "@/lib/types"
import { billingApi } from "@/lib/api"

interface BillingTableProps {
  bills: Bill[]
  userRole: "owner" | "vet" | "manager"
  onBillPaid?: () => void
}

export function BillingTable({ bills, userRole, onBillPaid }: BillingTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [billDetail, setBillDetail] = useState<any | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paying, setPaying] = useState(false)

  const openDetail = async (bill: Bill) => {
    setSelectedBill(bill)
    setBillDetail(null)
    setLoadingDetail(true)
    try {
      const data = await billingApi.detail(bill.id)
      setBillDetail(data)
    } catch {
      // fall back to basic info
    } finally {
      setLoadingDetail(false)
    }
  }

  const handlePay = async () => {
    if (!selectedBill) return
    setPaying(true)
    try {
      await billingApi.pay(selectedBill.id)
      setShowPaymentModal(false)
      setSelectedBill(null)
      onBillPaid?.()
    } catch (err) {
      alert('Payment failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setPaying(false)
    }
  }

  const filteredBills = bills.filter((bill) => {
    const matchesSearch =
      bill.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.petName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || bill.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: Bill["status"]) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Paid</Badge>
      case "pending":
        return <Badge className="bg-warning/10 text-warning-foreground border-warning/20">Pending</Badge>
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>
      case "partial":
        return <Badge className="bg-accent/10 text-accent-foreground border-accent/20">Partial</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const totalPending = filteredBills
    .filter((b) => b.status === "pending" || b.status === "overdue")
    .reduce((sum, b) => sum + b.amount - (b.amountPaid || 0), 0)

  const totalPaid = filteredBills
    .filter((b) => b.status === "paid")
    .reduce((sum, b) => sum + b.amount, 0)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Bills</p>
                <p className="text-2xl font-bold">{filteredBills.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                <CreditCard className="h-5 w-5 text-warning-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search bills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Pet</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No bills found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-medium">{bill.id}</TableCell>
                      <TableCell>{bill.petName}</TableCell>
                      <TableCell>
                        {new Date(bill.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {bill.services.join(", ")}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(bill.amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(bill.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetail(bill)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {userRole === "owner" && bill.status !== "paid" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedBill(bill)
                                setShowPaymentModal(true)
                              }}
                            >
                              Pay
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bill Details Modal */}
      <Dialog open={selectedBill !== null && !showPaymentModal} onOpenChange={() => { setSelectedBill(null); setBillDetail(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invoice #{selectedBill?.id}</DialogTitle>
            <DialogDescription>Bill details and breakdown</DialogDescription>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Pet</p>
                  <p className="font-medium">{selectedBill.petName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date(selectedBill.date).toLocaleDateString()}</p>
                </div>
                {selectedBill.ownerName && (
                  <div>
                    <p className="text-sm text-muted-foreground">Owner</p>
                    <p className="font-medium">{selectedBill.ownerName}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedBill.status)}
                </div>
              </div>

              {/* Cost breakdown */}
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
                          <td className="px-3 py-2">Examination Fee</td>
                          <td className="text-center px-3 py-2">1</td>
                          <td className="text-right px-3 py-2">{formatCurrency(100)}</td>
                          <td className="text-right px-3 py-2">{formatCurrency(100)}</td>
                        </tr>
                        {(billDetail?.medication_breakdown || []).map((med: any, idx: number) => (
                          <tr key={idx} className="border-t">
                            <td className="px-3 py-2">{med.med_name}</td>
                            <td className="text-center px-3 py-2">{med.dosage}</td>
                            <td className="text-right px-3 py-2">{formatCurrency(Number(med.unit_cost))}</td>
                            <td className="text-right px-3 py-2">{formatCurrency(Number(med.line_total))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t space-y-1">
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>{formatCurrency(selectedBill.amount)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                {userRole !== "vet" && selectedBill.status !== "paid" && (
                  <Button onClick={() => setShowPaymentModal(true)}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Mark Paid
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
            <DialogDescription>
              Pay invoice {selectedBill?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Amount Due</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(
                      selectedBill.amount - (selectedBill.amountPaid || 0)
                    )}
                  </span>
                </div>
              </div>
              <Button className="w-full" size="lg" onClick={handlePay} disabled={paying}>
                {paying ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Pay {formatCurrency(selectedBill.amount - (selectedBill.amountPaid || 0))}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Your payment is secured with 256-bit SSL encryption
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
