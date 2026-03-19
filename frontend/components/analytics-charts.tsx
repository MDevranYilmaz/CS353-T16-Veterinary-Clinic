'use client'

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
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

// Overdue Vaccinations Chart
const overdueVaccinationsData = [
  { name: 'Rabies', overdue: 5, dueSoon: 12 },
  { name: 'DHPP', overdue: 8, dueSoon: 15 },
  { name: 'Feline Distemper', overdue: 3, dueSoon: 8 },
  { name: 'Bordetella', overdue: 6, dueSoon: 10 },
  { name: 'Leptospirosis', overdue: 2, dueSoon: 5 },
]

export function OverdueVaccinationsChart() {
  const chartConfig = {
    overdue: {
      label: 'Overdue',
      color: 'var(--color-destructive)',
    },
    dueSoon: {
      label: 'Due Soon',
      color: 'var(--color-warning)',
    },
  }

  const totalOverdue = overdueVaccinationsData.reduce((sum, d) => sum + d.overdue, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Vaccination Status</CardTitle>
            <CardDescription>Overdue and upcoming vaccinations</CardDescription>
          </div>
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="w-3 h-3" />
            {totalOverdue} overdue
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overdueVaccinationsData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="overdue" fill="var(--color-destructive)" radius={[0, 4, 4, 0]} />
              <Bar dataKey="dueSoon" fill="var(--color-warning)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

// Stock Consumption Chart
const stockConsumptionData = [
  { month: 'Jan', medicines: 450, vaccines: 120, supplements: 85 },
  { month: 'Feb', medicines: 520, vaccines: 145, supplements: 92 },
  { month: 'Mar', medicines: 480, vaccines: 160, supplements: 78 },
  { month: 'Apr', medicines: 560, vaccines: 135, supplements: 95 },
  { month: 'May', medicines: 590, vaccines: 170, supplements: 88 },
  { month: 'Jun', medicines: 620, vaccines: 185, supplements: 102 },
]

export function StockConsumptionChart() {
  const chartConfig = {
    medicines: {
      label: 'Medicines',
      color: 'var(--color-primary)',
    },
    vaccines: {
      label: 'Vaccines',
      color: 'var(--color-accent)',
    },
    supplements: {
      label: 'Supplements',
      color: 'var(--color-chart-3)',
    },
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Stock Consumption</CardTitle>
            <CardDescription>Monthly usage by category</CardDescription>
          </div>
          <div className="flex items-center gap-1 text-sm text-primary">
            <TrendingUp className="w-4 h-4" />
            <span>+12% this month</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stockConsumptionData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="medicines"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-primary)', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="vaccines"
                stroke="var(--color-accent)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-accent)', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="supplements"
                stroke="var(--color-chart-3)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-chart-3)', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

// Revenue Distribution Chart
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
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-muted-foreground">{item.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Appointment Trends Chart
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
    checkups: {
      label: 'Checkups',
      color: 'var(--color-primary)',
    },
    vaccinations: {
      label: 'Vaccinations',
      color: 'var(--color-accent)',
    },
    surgeries: {
      label: 'Surgeries',
      color: 'var(--color-chart-3)',
    },
    emergency: {
      label: 'Emergency',
      color: 'var(--color-destructive)',
    },
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
