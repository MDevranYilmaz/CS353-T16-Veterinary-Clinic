'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { vaccinationApi, reportApi, billingApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { AlertTriangle, TrendingUp } from 'lucide-react'

// ── Overdue Vaccinations Chart ─────────────────────────────────────────────────

export function OverdueVaccinationsChart() {
  const { user } = useAuth()
  const [chartData, setChartData] = useState<{ name: string; overdue: number }[]>([])
  const [totalOverdue, setTotalOverdue] = useState(0)

  useEffect(() => {
    vaccinationApi.overdue(user?.branchId ?? undefined)
      .then((vaxList) => {
        const grouped: Record<string, number> = {}
        for (const v of vaxList) {
          const name = v.vaccineName || 'Unknown'
          grouped[name] = (grouped[name] ?? 0) + 1
        }
        const data = Object.entries(grouped)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([name, overdue]) => ({ name, overdue }))
        setChartData(data)
        setTotalOverdue(vaxList.length)
      })
      .catch(console.error)
  }, [user?.branchId])

  const chartConfig = {
    overdue: { label: 'Overdue', color: 'var(--color-destructive)' },
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Vaccination Status</CardTitle>
            <CardDescription>Overdue vaccinations by type</CardDescription>
          </div>
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="w-3 h-3" />
            {totalOverdue} overdue
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
            No overdue vaccinations
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="overdue" fill="var(--color-destructive)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

// ── Stock Consumption Chart ───────────────────────────────────────────────────

export function StockConsumptionChart() {
  const { user } = useAuth()
  const [chartData, setChartData] = useState<{ name: string; consumed: number; cost: number }[]>([])

  useEffect(() => {
    if (!user?.branchId) return
    reportApi.stockConsumption(user.branchId)
      .then((rows: any[]) => {
        const grouped: Record<string, { consumed: number; cost: number }> = {}
        for (const row of rows) {
          const type = (row.med_type as string) || 'medicine'
          const label = type.charAt(0).toUpperCase() + type.slice(1)
          if (!grouped[label]) grouped[label] = { consumed: 0, cost: 0 }
          grouped[label].consumed += Number(row.total_consumed ?? 0)
          grouped[label].cost += Number(row.total_cost ?? 0)
        }
        setChartData(
          Object.entries(grouped).map(([name, vals]) => ({
            name,
            consumed: vals.consumed,
            cost: vals.cost,
          }))
        )
      })
      .catch(console.error)
  }, [user?.branchId])

  const chartConfig = {
    consumed: { label: 'Units Used', color: 'var(--color-primary)' },
    cost: { label: 'Cost ($)', color: 'var(--color-accent)' },
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Stock Consumption</CardTitle>
            <CardDescription>Total usage by category</CardDescription>
          </div>
          <div className="flex items-center gap-1 text-sm text-primary">
            <TrendingUp className="w-4 h-4" />
            <span>by type</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
            No consumption data
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="consumed" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cost" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

// ── Revenue Distribution Chart — uses real billing data ──────────────────────

export function RevenueDistributionChart() {
  const [pieData, setPieData] = useState<{ name: string; value: number; color: string }[]>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    billingApi.listAll()
      .then((bills) => {
        const paid = bills.filter((b) => b.status === 'paid').reduce((s, b) => s + b.total, 0)
        const pending = bills.filter((b) => b.status !== 'paid').reduce((s, b) => s + b.total, 0)
        setTotal(paid + pending)
        setPieData([
          { name: 'Paid', value: Math.round(paid * 100) / 100, color: 'var(--color-primary)' },
          { name: 'Pending', value: Math.round(pending * 100) / 100, color: 'var(--color-accent)' },
        ])
      })
      .catch(console.error)
  }, [])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Revenue Overview</CardTitle>
        <CardDescription>Paid vs pending — total ${total.toFixed(2)}</CardDescription>
      </CardHeader>
      <CardContent>
        {pieData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
            No billing data
          </div>
        ) : (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: $${value}`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ── Vaccination Trends Chart — uses real monthly vaccination data ──────────────

export function AppointmentTrendsChart() {
  const [chartData, setChartData] = useState<{ month: string; total: number; pets: number }[]>([])

  useEffect(() => {
    reportApi.vaccinationTrends()
      .then((rows: any[]) => {
        const data = (rows || [])
          .slice(0, 6)
          .reverse()
          .map((r: any) => ({
            month: r.month || '',
            total: Number(r.total_vaccinations ?? 0),
            pets: Number(r.unique_pets_vaccinated ?? 0),
          }))
        setChartData(data)
      })
      .catch(console.error)
  }, [])

  const chartConfig = {
    total: { label: 'Vaccinations', color: 'var(--color-primary)' },
    pets: { label: 'Unique Pets', color: 'var(--color-accent)' },
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Vaccination Trends</CardTitle>
        <CardDescription>Monthly vaccinations administered (last 6 months)</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
            No vaccination data
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="total" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pets" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
