'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { vaccinationApi, reportApi } from '@/lib/api'
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

// ── Revenue Distribution Chart (static — no direct API endpoint) ──────────────

const revenueData = [
  { name: 'Consultations', value: 35, color: 'var(--color-primary)' },
  { name: 'Vaccinations', value: 25, color: 'var(--color-accent)' },
  { name: 'Surgeries', value: 20, color: 'var(--color-chart-3)' },
  { name: 'Medications', value: 15, color: 'var(--color-chart-4)' },
  { name: 'Other', value: 5, color: 'var(--color-muted)' },
]

export function RevenueDistributionChart() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Revenue Distribution</CardTitle>
        <CardDescription>Breakdown by service type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={revenueData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
                labelLine={false}
              >
                {revenueData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value}%`, 'Share']}
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
          {revenueData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-muted-foreground">{item.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Appointment Trends Chart (static — no day-of-week API) ────────────────────

const appointmentTrendsData = [
  { day: 'Mon', checkups: 12, vaccinations: 8, surgeries: 2, emergency: 3 },
  { day: 'Tue', checkups: 15, vaccinations: 10, surgeries: 3, emergency: 2 },
  { day: 'Wed', checkups: 10, vaccinations: 6, surgeries: 4, emergency: 4 },
  { day: 'Thu', checkups: 18, vaccinations: 12, surgeries: 2, emergency: 1 },
  { day: 'Fri', checkups: 20, vaccinations: 14, surgeries: 5, emergency: 3 },
  { day: 'Sat', checkups: 8, vaccinations: 5, surgeries: 1, emergency: 5 },
]

export function AppointmentTrendsChart() {
  const chartConfig = {
    checkups: { label: 'Checkups', color: 'var(--color-primary)' },
    vaccinations: { label: 'Vaccinations', color: 'var(--color-accent)' },
    surgeries: { label: 'Surgeries', color: 'var(--color-chart-3)' },
    emergency: { label: 'Emergency', color: 'var(--color-destructive)' },
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Weekly Appointments</CardTitle>
        <CardDescription>Appointments by type this week</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={appointmentTrendsData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="checkups" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="vaccinations" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="surgeries" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="emergency" fill="var(--color-destructive)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
