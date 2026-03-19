'use client'

import { useState } from 'react'
import type { Medicine } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertTriangle,
  Package,
  Plus,
  Search,
  Syringe,
  Pill,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface InventoryTableProps {
  items: Medicine[]
  onAddStock?: (itemId: string, quantity: number) => void
  onRemoveStock?: (itemId: string, quantity: number, reason: string) => void
}

const categoryIcons: Record<string, React.ElementType> = {
  medicine: Pill,
  vaccine: Syringe,
  supplement: Sparkles,
}

export function InventoryTable({ items, onAddStock, onRemoveStock }: InventoryTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [addStockDialog, setAddStockDialog] = useState<{ open: boolean; item?: Medicine }>({ open: false })
  const [removeStockDialog, setRemoveStockDialog] = useState<{ open: boolean; item?: Medicine }>({ open: false })
  const [stockQuantity, setStockQuantity] = useState('')
  const [removeReason, setRemoveReason] = useState('')

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getStockStatus = (item: Medicine) => {
    const percentage = (item.currentStock / item.maxStock) * 100
    if (item.currentStock <= item.minStock) {
      return { status: 'low', label: 'Low Stock', color: 'destructive' as const }
    }
    if (percentage < 40) {
      return { status: 'warning', label: 'Running Low', color: 'secondary' as const }
    }
    return { status: 'good', label: 'In Stock', color: 'default' as const }
  }

  const getStockBarColor = (item: Medicine) => {
    const percentage = (item.currentStock / item.maxStock) * 100
    if (item.currentStock <= item.minStock) return 'bg-destructive'
    if (percentage < 40) return 'bg-warning'
    return 'bg-primary'
  }

  const handleAddStock = () => {
    if (addStockDialog.item && stockQuantity && onAddStock) {
      onAddStock(addStockDialog.item.id, parseInt(stockQuantity))
      setAddStockDialog({ open: false })
      setStockQuantity('')
    }
  }

  const handleRemoveStock = () => {
    if (removeStockDialog.item && stockQuantity && onRemoveStock) {
      onRemoveStock(removeStockDialog.item.id, parseInt(stockQuantity), removeReason)
      setRemoveStockDialog({ open: false })
      setStockQuantity('')
      setRemoveReason('')
    }
  }

  const lowStockCount = items.filter(i => i.currentStock <= i.minStock).length

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl">Inventory</CardTitle>
            {lowStockCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="w-3 h-3" />
                {lowStockCount} low stock
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="medicine">Medicine</SelectItem>
                <SelectItem value="vaccine">Vaccines</SelectItem>
                <SelectItem value="supplement">Supplements</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                const stockStatus = getStockStatus(item)
                const Icon = categoryIcons[item.category] || Package
                const percentage = Math.min((item.currentStock / item.maxStock) * 100, 100)

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex items-center justify-center w-9 h-9 rounded-lg',
                          item.category === 'vaccine' ? 'bg-sky-light' : 'bg-muted'
                        )}>
                          <Icon className={cn(
                            'w-5 h-5',
                            item.category === 'vaccine' ? 'text-accent' : 'text-muted-foreground'
                          )} />
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.unit}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className={cn(
                            'font-medium',
                            stockStatus.status === 'low' && 'text-destructive'
                          )}>
                            {item.currentStock} / {item.maxStock}
                          </span>
                          {stockStatus.status === 'low' && (
                            <AlertTriangle className="w-4 h-4 text-destructive" />
                          )}
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn('h-full transition-all', getStockBarColor(item))}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Min: {item.minStock}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${item.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => {
                            setAddStockDialog({ open: true, item })
                            setStockQuantity('')
                          }}
                        >
                          <Plus className="w-4 h-4" />
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            setRemoveStockDialog({ open: true, item })
                            setStockQuantity('')
                            setRemoveReason('')
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Add Stock Dialog */}
        <Dialog open={addStockDialog.open} onOpenChange={(open) => setAddStockDialog({ ...addStockDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Stock</DialogTitle>
              <DialogDescription>
                Add inventory for {addStockDialog.item?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="add-quantity">Quantity to Add</Label>
                <Input
                  id="add-quantity"
                  type="number"
                  min="1"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  placeholder={`Enter quantity (${addStockDialog.item?.unit})`}
                />
              </div>
              {addStockDialog.item && (
                <p className="text-sm text-muted-foreground">
                  Current stock: {addStockDialog.item.currentStock} {addStockDialog.item.unit}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddStockDialog({ open: false })}>
                Cancel
              </Button>
              <Button onClick={handleAddStock} disabled={!stockQuantity}>
                Add Stock
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Stock Dialog */}
        <Dialog open={removeStockDialog.open} onOpenChange={(open) => setRemoveStockDialog({ ...removeStockDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove / Waste Stock</DialogTitle>
              <DialogDescription>
                Record stock removal or waste for {removeStockDialog.item?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="remove-quantity">Quantity to Remove</Label>
                <Input
                  id="remove-quantity"
                  type="number"
                  min="1"
                  max={removeStockDialog.item?.currentStock}
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  placeholder={`Enter quantity (${removeStockDialog.item?.unit})`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remove-reason">Reason</Label>
                <Select value={removeReason} onValueChange={setRemoveReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="used">Used (not invoiced)</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {removeStockDialog.item && (
                <p className="text-sm text-muted-foreground">
                  Current stock: {removeStockDialog.item.currentStock} {removeStockDialog.item.unit}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRemoveStockDialog({ open: false })}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRemoveStock} disabled={!stockQuantity || !removeReason}>
                Remove Stock
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
