'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { reportApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart, Line, Legend, Cell, PieChart, Pie, Tooltip,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  Search, FileDown, AlertTriangle, TrendingUp, Package,
  Trash2, DollarSign, Syringe, Loader2, RotateCcw,
} from 'lucide-react'

const fmt$ = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
const fmtNum = (n: number) =>
  new Intl.NumberFormat('en-US').format(Number(n ?? 0))
const fmtPct = (n: number) => `${Number(n ?? 0).toFixed(1)}%`

function ComplianceBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? '#16a34a' : pct >= 50 ? '#f59e0b' : '#dc2626'
  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} className="h-full rounded-full" />
      </div>
      <span className="text-xs font-medium w-10 text-right" style={{ color }}>{fmtPct(pct)}</span>
    </div>
  )
}

function SectionHeader({ icon: Icon, title, description, color = 'text-primary' }: {
  icon: React.ElementType; title: string; description: string; color?: string
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <h3 className="font-semibold text-sm">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export function ReportsPage() {
  const { user } = useAuth()
  const branchId = user?.branchId

  // ── Stock & Operations filters ──────────────────────────────────────────
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [medSearch, setMedSearch] = useState('')
  const [appliedFrom, setAppliedFrom] = useState('')
  const [appliedTo, setAppliedTo] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')

  // ── Stock & Operations data ─────────────────────────────────────────────
  const [stockData, setStockData] = useState<any[]>([])
  const [wasteData, setWasteData] = useState<any[]>([])
  const [costData, setCostData] = useState<any[]>([])
  const [stockLoading, setStockLoading] = useState(false)

  // ── Vaccination Analytics data ──────────────────────────────────────────
  const [complianceData, setComplianceData] = useState<any[]>([])
  const [mostAdminData, setMostAdminData] = useState<any[]>([])
  const [overdueRatesData, setOverdueRatesData] = useState<any[]>([])
  const [trendsData, setTrendsData] = useState<any[]>([])
  const [vacLoading, setVacLoading] = useState(false)

  // ── Load Stock & Operations ─────────────────────────────────────────────
  const loadStock = useCallback((from: string, to: string) => {
    if (!branchId) return
    setStockLoading(true)
    Promise.all([
      reportApi.stockConsumption(branchId, from || undefined, to || undefined),
      reportApi.wasteStats(branchId, from || undefined, to || undefined),
      reportApi.costBreakdown(branchId),
    ])
      .then(([stock, waste, cost]) => {
        setStockData(stock || [])
        setWasteData(waste || [])
        setCostData(cost || [])
      })
      .catch(console.error)
      .finally(() => setStockLoading(false))
  }, [branchId])

  // ── Load Vaccination Analytics ──────────────────────────────────────────
  const loadVaccination = useCallback(() => {
    setVacLoading(true)
    Promise.all([
      reportApi.compliance(),
      reportApi.mostAdministeredVaccines(branchId || undefined),
      reportApi.overdueRates(),
      reportApi.vaccinationTrends(),
    ])
      .then(([comp, admin, overdue, trends]) => {
        setComplianceData(comp || [])
        setMostAdminData((admin || []).slice(0, 10))
        setOverdueRatesData(overdue || [])
        setTrendsData((trends || []).slice(0, 6).reverse())
      })
      .catch(console.error)
      .finally(() => setVacLoading(false))
  }, [branchId])

  useEffect(() => { loadStock('', '') }, [loadStock])
  useEffect(() => { loadVaccination() }, [loadVaccination])

  const handleApplyFilters = () => {
    setAppliedFrom(dateFrom)
    setAppliedTo(dateTo)
    setAppliedSearch(medSearch)
    loadStock(dateFrom, dateTo)
  }

  const handleResetFilters = () => {
    setDateFrom(''); setDateTo(''); setMedSearch('')
    setAppliedFrom(''); setAppliedTo(''); setAppliedSearch('')
    loadStock('', '')
  }

  // Client-side LIKE filter on medicine name
  const filteredStock = appliedSearch
    ? stockData.filter(r => r.med_name?.toLowerCase().includes(appliedSearch.toLowerCase()))
    : stockData

  // ── PDF Download ────────────────────────────────────────────────────────
  const handleDownloadPDF = () => {
    const area = document.getElementById('reports-print-area')
    if (!area) return

    const styles = Array.from(document.querySelectorAll('style'))
      .map(s => s.outerHTML).join('\n')

    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    })

    const filterNote = appliedFrom || appliedTo
      ? `Date range: ${appliedFrom || 'start'} → ${appliedTo || 'today'}`
      : 'All dates'

    const pw = window.open('', '_blank', 'width=1100,height=850')
    if (!pw) return

    pw.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>VetCare Pro — Reports</title>
  ${styles}
  <style>
    body { font-family: sans-serif; padding: 24px; background: #fff; color: #111; font-size: 13px; }
    .pdf-header { display: flex; justify-content: space-between; align-items: flex-start;
      border-bottom: 2px solid #16a34a; padding-bottom: 12px; margin-bottom: 20px; }
    .pdf-header h1 { margin: 0; font-size: 20px; font-weight: 700; color: #111; }
    .pdf-header .sub { margin: 4px 0 0; color: #555; font-size: 12px; }
    .section { margin-bottom: 28px; }
    .section h2 { font-size: 14px; font-weight: 700; border-bottom: 1px solid #ddd;
      padding-bottom: 6px; margin-bottom: 10px; color: #16a34a; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f0fdf4; font-weight: 600; text-align: left;
      padding: 6px 8px; border: 1px solid #d1fae5; color: #166534; }
    td { padding: 5px 8px; border: 1px solid #e5e7eb; }
    tr:nth-child(even) td { background: #f9fafb; }
    .pct-high { color: #16a34a; font-weight: 600; }
    .pct-mid { color: #d97706; font-weight: 600; }
    .pct-low { color: #dc2626; font-weight: 600; }
    .critical { background: #fef2f2 !important; color: #dc2626; font-weight: 600; }
    .filter-note { font-size: 11px; color: #777; margin-bottom: 8px; }
    @media print { @page { size: A4 landscape; margin: 12mm; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="pdf-header">
    <div>
      <h1>VetCare Pro — Reports &amp; Analytics</h1>
      <p class="sub">Branch: ${user?.branchId ? `#${user.branchId}` : 'All'} &nbsp;|&nbsp; ${filterNote}</p>
    </div>
    <div style="text-align:right">
      <p class="sub">Generated: ${date}</p>
    </div>
  </div>

  <!-- Stock Consumption -->
  <div class="section">
    <h2>Stock Consumption</h2>
    <p class="filter-note">${filterNote}${appliedSearch ? ` | Medicine filter: "${appliedSearch}"` : ''}</p>
    <table>
      <thead><tr>
        <th>Medicine</th><th>Type</th><th>Prescribed Qty</th>
        <th>Wasted Qty</th><th>Total Consumed</th><th>Unit Cost</th><th>Total Cost</th>
      </tr></thead>
      <tbody>
        ${filteredStock.slice(0, 30).map(r => `<tr>
          <td>${r.med_name || ''}</td>
          <td>${r.med_type || ''}</td>
          <td>${fmtNum(r.prescribed_qty)}</td>
          <td>${fmtNum(r.wasted_qty)}</td>
          <td><strong>${fmtNum(r.total_consumed)}</strong></td>
          <td>${fmt$(r.unit_cost)}</td>
          <td><strong>${fmt$(r.total_cost)}</strong></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <!-- Waste Statistics -->
  <div class="section">
    <h2>Waste Statistics</h2>
    <table>
      <thead><tr>
        <th>Medicine Type</th><th>Log Count</th><th>Units Wasted</th><th>Value Wasted</th>
      </tr></thead>
      <tbody>
        ${wasteData.map(r => `<tr>
          <td>${r.med_type || ''}</td>
          <td>${fmtNum(r.log_count)}</td>
          <td>${fmtNum(r.total_units_wasted)}</td>
          <td class="${Number(r.total_value_wasted) > 500 ? 'critical' : ''}">${fmt$(r.total_value_wasted)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <!-- Cost Breakdown -->
  <div class="section">
    <h2>Inventory Cost Breakdown</h2>
    <table>
      <thead><tr>
        <th>Type</th><th>Distinct Medicines</th><th>Total Units</th><th>Inventory Value</th>
      </tr></thead>
      <tbody>
        ${costData.map(r => `<tr>
          <td>${r.med_type || ''}</td>
          <td>${fmtNum(r.distinct_medicines)}</td>
          <td>${fmtNum(r.total_units)}</td>
          <td><strong>${fmt$(r.inventory_value)}</strong></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <!-- Vaccination Compliance -->
  <div class="section">
    <h2>Vaccination Compliance by Breed</h2>
    <table>
      <thead><tr>
        <th>Breed</th><th>Total Pets</th><th>Total Vaccinations</th><th>Up to Date</th><th>Compliance %</th>
      </tr></thead>
      <tbody>
        ${complianceData.slice(0, 20).map(r => {
          const pct = Number(r.compliance_pct ?? 0)
          const cls = pct >= 80 ? 'pct-high' : pct >= 50 ? 'pct-mid' : 'pct-low'
          return `<tr>
            <td>${r.breed || 'Unknown'}</td>
            <td>${fmtNum(r.total_pets)}</td>
            <td>${fmtNum(r.total_vaccinations)}</td>
            <td>${fmtNum(r.up_to_date)}</td>
            <td class="${cls}">${fmtPct(pct)}</td>
          </tr>`
        }).join('')}
      </tbody>
    </table>
  </div>

  <!-- Most Administered -->
  <div class="section">
    <h2>Most Administered Vaccines</h2>
    <table>
      <thead><tr>
        <th>Vaccine</th><th>Type</th><th>Branch</th>
        <th>Total Administered</th><th>Unique Pets</th><th>First</th><th>Last</th>
      </tr></thead>
      <tbody>
        ${mostAdminData.map(r => `<tr>
          <td>${r.vaccine_name || ''}</td>
          <td>${r.vac_type || ''}</td>
          <td>${r.branch_name || ''}</td>
          <td><strong>${fmtNum(r.total_administered)}</strong></td>
          <td>${fmtNum(r.unique_pets)}</td>
          <td>${r.first_administered ? r.first_administered.toString().slice(0,10) : ''}</td>
          <td>${r.last_administered ? r.last_administered.toString().slice(0,10) : ''}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <!-- Overdue Rates -->
  <div class="section">
    <h2>Overdue Vaccination Rates by Branch</h2>
    <table>
      <thead><tr>
        <th>Branch</th><th>Pets w/ Overdue</th><th>Total Overdue</th>
        <th>Avg Days</th><th>Max Days</th><th>Critical (&gt;90d)</th><th>High Priority (31–90d)</th>
      </tr></thead>
      <tbody>
        ${overdueRatesData.map(r => `<tr>
          <td>${r.branch_name || ''}</td>
          <td>${fmtNum(r.pets_with_overdue)}</td>
          <td>${fmtNum(r.total_overdue_vaccinations)}</td>
          <td>${Number(r.avg_days_overdue ?? 0).toFixed(1)}</td>
          <td>${fmtNum(r.max_days_overdue)}</td>
          <td class="${Number(r.critical_overdue) > 0 ? 'critical' : ''}">${fmtNum(r.critical_overdue)}</td>
          <td>${fmtNum(r.high_priority_overdue)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); };</script>
</body>
</html>`)
    pw.document.close()
  }

  const trendConfig = {
    total_vaccinations: { label: 'Vaccinations', color: 'var(--color-primary)' },
    unique_pets_vaccinated: { label: 'Unique Pets', color: 'var(--color-accent)' },
  }

  return (
    <div className="space-y-6" id="reports-print-area">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground text-sm">Branch performance and vaccination analytics</p>
        </div>
        <Button onClick={handleDownloadPDF} variant="outline">
          <FileDown className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
      </div>

      <Tabs defaultValue="stock">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="stock">Stock & Operations</TabsTrigger>
          <TabsTrigger value="vaccination">Vaccination Analytics</TabsTrigger>
        </TabsList>

        {/* ── Stock & Operations Tab ─────────────────────────────────────── */}
        <TabsContent value="stock" className="space-y-6 mt-6">

          {/* Search / Filter bar */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Search className="w-4 h-4" /> Search & Filter
              </CardTitle>
              <CardDescription className="text-xs">Filter by date range and medicine name (partial match supported)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-4 gap-3 items-end">
                <div className="space-y-1">
                  <Label className="text-xs">Date From</Label>
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Date To</Label>
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Medicine Name (contains)</Label>
                  <Input
                    placeholder="e.g. Rabies"
                    value={medSearch}
                    onChange={e => setMedSearch(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleApplyFilters} disabled={stockLoading} className="flex-1">
                    {stockLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                    <span className="ml-1">Apply</span>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleResetFilters} disabled={stockLoading}>
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              {(appliedFrom || appliedTo || appliedSearch) && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {(appliedFrom || appliedTo) && (
                    <Badge variant="secondary" className="text-xs">
                      {appliedFrom || '∞'} → {appliedTo || 'today'}
                    </Badge>
                  )}
                  {appliedSearch && (
                    <Badge variant="secondary" className="text-xs">
                      name contains "{appliedSearch}"
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stock Consumption */}
          <Card>
            <CardHeader className="pb-3">
              <SectionHeader icon={Package} title="Stock Consumption" description="Prescribed + wasted quantities and cost per medicine" />
            </CardHeader>
            <CardContent>
              {stockLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
              ) : filteredStock.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">No data for the selected filters</p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medicine</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Prescribed</TableHead>
                        <TableHead className="text-right">Wasted</TableHead>
                        <TableHead className="text-right">Total Used</TableHead>
                        <TableHead className="text-right">Unit Cost</TableHead>
                        <TableHead className="text-right">Total Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStock.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{r.med_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs capitalize">{r.med_type}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm">{fmtNum(r.prescribed_qty)}</TableCell>
                          <TableCell className="text-right text-sm text-destructive">{fmtNum(r.wasted_qty)}</TableCell>
                          <TableCell className="text-right font-semibold">{fmtNum(r.total_consumed)}</TableCell>
                          <TableCell className="text-right text-sm">{fmt$(r.unit_cost)}</TableCell>
                          <TableCell className="text-right font-semibold text-primary">{fmt$(r.total_cost)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Waste Statistics */}
            <Card>
              <CardHeader className="pb-3">
                <SectionHeader icon={Trash2} title="Waste Statistics" description="Wasted units and value by medicine type" color="text-destructive" />
              </CardHeader>
              <CardContent>
                {wasteData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 text-sm">No waste data</p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Logs</TableHead>
                          <TableHead className="text-right">Units</TableHead>
                          <TableHead className="text-right">Value Lost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {wasteData.map((r, i) => (
                          <TableRow key={i}>
                            <TableCell className="capitalize font-medium">{r.med_type}</TableCell>
                            <TableCell className="text-right text-sm">{fmtNum(r.log_count)}</TableCell>
                            <TableCell className="text-right text-sm">{fmtNum(r.total_units_wasted)}</TableCell>
                            <TableCell className="text-right font-semibold text-destructive">
                              {fmt$(r.total_value_wasted)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <SectionHeader icon={DollarSign} title="Inventory Cost Breakdown" description="Current stock value by medicine type" color="text-primary" />
              </CardHeader>
              <CardContent>
                {costData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 text-sm">No inventory data</p>
                ) : (
                  <>
                    <div className="rounded-md border mb-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Medicines</TableHead>
                            <TableHead className="text-right">Units</TableHead>
                            <TableHead className="text-right">Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {costData.map((r, i) => (
                            <TableRow key={i}>
                              <TableCell className="capitalize font-medium">{r.med_type}</TableCell>
                              <TableCell className="text-right text-sm">{fmtNum(r.distinct_medicines)}</TableCell>
                              <TableCell className="text-right text-sm">{fmtNum(r.total_units)}</TableCell>
                              <TableCell className="text-right font-semibold text-primary">{fmt$(r.inventory_value)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={costData.map(r => ({ name: r.med_type, value: Number(r.inventory_value) }))}
                            cx="50%" cy="50%" outerRadius={55} dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}>
                            {costData.map((_: any, i: number) => (
                              <Cell key={i} fill={['#16a34a', '#0ea5e9', '#f59e0b', '#8b5cf6'][i % 4]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => fmt$(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Vaccination Analytics Tab ──────────────────────────────────── */}
        <TabsContent value="vaccination" className="space-y-6 mt-6">

          {/* Vaccination Trends chart */}
          <Card>
            <CardHeader className="pb-2">
              <SectionHeader icon={TrendingUp} title="Vaccination Trends" description="Monthly vaccinations administered (last 6 months)" />
            </CardHeader>
            <CardContent>
              {vacLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
              ) : trendsData.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">No trend data</p>
              ) : (
                <ChartContainer config={trendConfig} className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendsData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line type="monotone" dataKey="total_vaccinations" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="unique_pets_vaccinated" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Vaccination Compliance by Breed */}
          <Card>
            <CardHeader className="pb-3">
              <SectionHeader icon={Syringe} title="Vaccination Compliance by Breed"
                description="Compliance rate = up-to-date vaccinations / total (GROUP BY breed, nested NULLIF)" />
            </CardHeader>
            <CardContent>
              {vacLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
              ) : complianceData.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">No compliance data</p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Breed</TableHead>
                        <TableHead className="text-right">Total Pets</TableHead>
                        <TableHead className="text-right">Vaccinations</TableHead>
                        <TableHead className="text-right">Up to Date</TableHead>
                        <TableHead>Compliance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {complianceData.map((r, i) => {
                        const pct = Number(r.compliance_pct ?? 0)
                        return (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{r.breed || 'Unknown'}</TableCell>
                            <TableCell className="text-right text-sm">{fmtNum(r.total_pets)}</TableCell>
                            <TableCell className="text-right text-sm">{fmtNum(r.total_vaccinations)}</TableCell>
                            <TableCell className="text-right text-sm">{fmtNum(r.up_to_date)}</TableCell>
                            <TableCell><ComplianceBar pct={pct} /></TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Most Administered Vaccines */}
          <Card>
            <CardHeader className="pb-3">
              <SectionHeader icon={Syringe} title="Most Administered Vaccines"
                description="Top vaccines by count (GROUP BY vaccine + branch, MIN/MAX dates)" />
            </CardHeader>
            <CardContent>
              {vacLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
              ) : mostAdminData.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">No data</p>
              ) : (
                <>
                  <div className="h-52 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mostAdminData.slice(0, 6)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="vaccine_name" type="category" width={120} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => fmtNum(v)} />
                        <Bar dataKey="total_administered" fill="#16a34a" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vaccine</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Branch</TableHead>
                          <TableHead className="text-right">Administered</TableHead>
                          <TableHead className="text-right">Unique Pets</TableHead>
                          <TableHead>First</TableHead>
                          <TableHead>Last</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mostAdminData.map((r, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{r.vaccine_name}</TableCell>
                            <TableCell><Badge variant="outline" className="text-xs">{r.vac_type}</Badge></TableCell>
                            <TableCell className="text-sm text-muted-foreground">{r.branch_name}</TableCell>
                            <TableCell className="text-right font-semibold">{fmtNum(r.total_administered)}</TableCell>
                            <TableCell className="text-right text-sm">{fmtNum(r.unique_pets)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {r.first_administered ? String(r.first_administered).slice(0, 10) : '—'}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {r.last_administered ? String(r.last_administered).slice(0, 10) : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Overdue Rates by Branch */}
          <Card>
            <CardHeader className="pb-3">
              <SectionHeader icon={AlertTriangle} title="Overdue Vaccination Rates by Branch"
                description="Per-branch overdue stats (MAX days overdue, critical/high-priority counts)" color="text-destructive" />
            </CardHeader>
            <CardContent>
              {vacLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
              ) : overdueRatesData.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">No overdue data</p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Branch</TableHead>
                        <TableHead className="text-right">Pets w/ Overdue</TableHead>
                        <TableHead className="text-right">Total Overdue</TableHead>
                        <TableHead className="text-right">Avg Days</TableHead>
                        <TableHead className="text-right">Max Days</TableHead>
                        <TableHead className="text-right">Critical (&gt;90d)</TableHead>
                        <TableHead className="text-right">High (31–90d)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overdueRatesData.map((r, i) => (
                        <TableRow key={i} className={Number(r.critical_overdue) > 0 ? 'bg-destructive/5' : ''}>
                          <TableCell className="font-medium">{r.branch_name}</TableCell>
                          <TableCell className="text-right">{fmtNum(r.pets_with_overdue)}</TableCell>
                          <TableCell className="text-right">{fmtNum(r.total_overdue_vaccinations)}</TableCell>
                          <TableCell className="text-right text-sm">{Number(r.avg_days_overdue ?? 0).toFixed(1)}</TableCell>
                          <TableCell className="text-right text-sm">{fmtNum(r.max_days_overdue)}</TableCell>
                          <TableCell className="text-right">
                            {Number(r.critical_overdue) > 0
                              ? <Badge variant="destructive" className="text-xs">{fmtNum(r.critical_overdue)}</Badge>
                              : <span className="text-muted-foreground text-sm">0</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            {Number(r.high_priority_overdue) > 0
                              ? <Badge className="text-xs bg-warning/10 text-warning-foreground border-warning/20">{fmtNum(r.high_priority_overdue)}</Badge>
                              : <span className="text-muted-foreground text-sm">0</span>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

        </TabsContent>
      </Tabs>
    </div>
  )
}
