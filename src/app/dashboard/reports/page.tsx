'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { formatCurrency, calculatePayout } from '@/lib/utils/payout'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  Users,
  Car,
  MapPin,
  DollarSign,
  Target,
  AlertTriangle,
  Clock,
  Activity,
  CreditCard,
  PieChart,
  FileText
} from 'lucide-react'

interface ReportData {
  // Revenue Analytics
  totalRevenue: number
  totalTrips: number
  averageTrip: number
  totalPayouts: number
  
  // Driver Performance
  topDrivers: Array<{
    name: string
    trips: number
    revenue: number
    payout: number
    targetAchievement: number
  }>
  
  // Fleet Utilization
  vehicleUtilization: Array<{
    registration: string
    trips: number
    revenue: number
    utilization: number
  }>
  
  // Time-based Analytics
  dailyTrends: Array<{
    date: string
    trips: number
    revenue: number
  }>
  
  // Incident Analytics
  incidentStats: {
    total: number
    byType: Record<string, number>
    bySeverity: Record<string, number>
    totalCost: number
  }
  
  // Operational Metrics
  operationalMetrics: {
    activeDrivers: number
    totalDrivers: number
    activeVehicles: number
    totalVehicles: number
    activeAssignments: number
    pendingPayouts: number
    openIncidents: number
  }
}

export default function ReportsPage() {
  const { profile, isAdmin, isManager } = useAuth()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30') // days
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reportType, setReportType] = useState('overview')
  const supabase = createClient()

  useEffect(() => {
    if (isAdmin || isManager) {
      fetchReportData()
    } else {
      setLoading(false)
    }
  }, [isAdmin, isManager, dateRange, startDate, endDate])

  const getDateRange = () => {
    const end = new Date()
    const start = new Date()
    
    if (startDate && endDate) {
      return { start: startDate, end: endDate }
    }
    
    start.setDate(end.getDate() - parseInt(dateRange))
    return { 
      start: start.toISOString().split('T')[0], 
      end: end.toISOString().split('T')[0] 
    }
  }

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const { start, end } = getDateRange()

      // Fetch all data in parallel
      const [
        tripsResult,
        driversResult,
        vehiclesResult,
        payoutsResult,
        incidentsResult,
        assignmentsResult
      ] = await Promise.all([
        // Trips data
        supabase
          .from('trips')
          .select(`
            *,
            driver:drivers(name, phone)
          `)
          .gte('trip_start_time', `${start}T00:00:00`)
          .lte('trip_start_time', `${end}T23:59:59`),
        
        // Drivers data
        supabase
          .from('drivers')
          .select('*'),
        
        // Vehicles data
        supabase
          .from('vehicles')
          .select('*'),
        
        // Payouts data
        supabase
          .from('payouts')
          .select(`
            *,
            driver:drivers(name, phone)
          `)
          .gte('payout_date', start)
          .lte('payout_date', end),
        
        // Incidents data
        supabase
          .from('incidents')
          .select('*')
          .gte('incident_date', start)
          .lte('incident_date', end),
        
        // Assignments data
        supabase
          .from('assignments')
          .select(`
            *,
            driver:drivers(name, phone),
            vehicle:vehicles(registration_number, model, brand)
          `)
      ])

      if (tripsResult.error) throw tripsResult.error
      if (driversResult.error) throw driversResult.error
      if (vehiclesResult.error) throw vehiclesResult.error
      if (payoutsResult.error) throw payoutsResult.error
      if (incidentsResult.error) throw incidentsResult.error
      if (assignmentsResult.error) throw assignmentsResult.error

      const trips = tripsResult.data || []
      const drivers = driversResult.data || []
      const vehicles = vehiclesResult.data || []
      const payouts = payoutsResult.data || []
      const incidents = incidentsResult.data || []
      const assignments = assignmentsResult.data || []

      // Process data for analytics
      const processedData = processReportData(trips, drivers, vehicles, payouts, incidents, assignments)
      setReportData(processedData)

    } catch (error) {
      console.error('Error fetching report data:', error)
      toast.error('Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  const processReportData = (trips: any[], drivers: any[], vehicles: any[], payouts: any[], incidents: any[], assignments: any[]): ReportData => {
    // Revenue Analytics
    const totalRevenue = trips.reduce((sum, trip) => sum + (trip.fare_amount || 0), 0)
    const totalTrips = trips.length
    const averageTrip = totalTrips > 0 ? totalRevenue / totalTrips : 0
    const totalPayouts = payouts.reduce((sum, payout) => sum + (payout.net_payout || 0), 0)

    // Driver Performance
    const driverStats = new Map()
    trips.forEach(trip => {
      if (trip.driver) {
        const driverId = trip.driver_id
        const existing = driverStats.get(driverId) || {
          name: trip.driver.name,
          trips: 0,
          revenue: 0,
          payout: 0
        }
        existing.trips += 1
        existing.revenue += trip.fare_amount || 0
        existing.payout = calculatePayout(existing.revenue)
        existing.targetAchievement = (existing.revenue / 2250) * 100
        driverStats.set(driverId, existing)
      }
    })

    const topDrivers = Array.from(driverStats.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Fleet Utilization
    const vehicleStats = new Map()
    trips.forEach(trip => {
      if (trip.vehicle_id) {
        const existing = vehicleStats.get(trip.vehicle_id) || {
          registration: 'Unknown',
          trips: 0,
          revenue: 0
        }
        existing.trips += 1
        existing.revenue += trip.fare_amount || 0
        vehicleStats.set(trip.vehicle_id, existing)
      }
    })

    const vehicleUtilization = Array.from(vehicleStats.values())
      .map(vehicle => ({
        ...vehicle,
        utilization: Math.min((vehicle.trips / 30) * 100, 100) // Assume max 1 trip per day
      }))
      .sort((a, b) => b.utilization - a.utilization)

    // Daily Trends
    const dailyStats = new Map()
    trips.forEach(trip => {
      if (trip.trip_start_time) {
        const date = trip.trip_start_time.split('T')[0]
        const existing = dailyStats.get(date) || { date, trips: 0, revenue: 0 }
        existing.trips += 1
        existing.revenue += trip.fare_amount || 0
        dailyStats.set(date, existing)
      }
    })

    const dailyTrends = Array.from(dailyStats.values())
      .sort((a, b) => a.date.localeCompare(b.date))

    // Incident Analytics
    const incidentByType: Record<string, number> = {}
    const incidentBySeverity: Record<string, number> = {}
    let incidentTotalCost = 0

    incidents.forEach(incident => {
      const type = incident.incident_type || 'unknown'
      const severity = incident.severity || 'unknown'
      
      incidentByType[type] = (incidentByType[type] || 0) + 1
      incidentBySeverity[severity] = (incidentBySeverity[severity] || 0) + 1
      incidentTotalCost += incident.estimated_cost || 0
    })

    // Operational Metrics
    const activeDrivers = drivers.filter(d => d.status === 'active').length
    const activeVehicles = vehicles.filter(v => v.status === 'available' || v.status === 'assigned').length
    const activeAssignments = assignments.filter(a => a.status === 'active').length
    const pendingPayouts = payouts.filter(p => p.approval_status === 'pending').length
    const openIncidents = incidents.filter(i => i.status === 'open').length

    return {
      totalRevenue,
      totalTrips,
      averageTrip,
      totalPayouts,
      topDrivers,
      vehicleUtilization,
      dailyTrends,
      incidentStats: {
        total: incidents.length,
        byType: incidentByType,
        bySeverity: incidentBySeverity,
        totalCost: incidentTotalCost
      },
      operationalMetrics: {
        activeDrivers,
        totalDrivers: drivers.length,
        activeVehicles,
        totalVehicles: vehicles.length,
        activeAssignments,
        pendingPayouts,
        openIncidents
      }
    }
  }

  const exportReport = () => {
    if (!reportData) return
    
    const csvData = generateCSVReport(reportData)
    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fleet-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const generateCSVReport = (data: ReportData): string => {
    let csv = 'Fleet Management Report\n\n'
    
    // Summary
    csv += 'SUMMARY\n'
    csv += `Total Revenue,${data.totalRevenue}\n`
    csv += `Total Trips,${data.totalTrips}\n`
    csv += `Average Trip Value,${data.averageTrip.toFixed(2)}\n`
    csv += `Total Payouts,${data.totalPayouts}\n\n`
    
    // Top Drivers
    csv += 'TOP DRIVERS\n'
    csv += 'Name,Trips,Revenue,Payout,Target Achievement\n'
    data.topDrivers.forEach(driver => {
      csv += `${driver.name},${driver.trips},${driver.revenue},${driver.payout.toFixed(2)},${driver.targetAchievement.toFixed(1)}%\n`
    })
    
    return csv
  }

  if (!isAdmin && !isManager) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to view reports.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-4 gap-4 mb-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!reportData) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Business intelligence and performance insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {dateRange === 'custom' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reportData.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {reportData.totalTrips} trips
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Trip</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reportData.averageTrip)}</div>
            <p className="text-xs text-muted-foreground">
              Per trip value
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reportData.totalPayouts)}</div>
            <p className="text-xs text-muted-foreground">
              Driver earnings
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fleet Utilization</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((reportData.operationalMetrics.activeVehicles / reportData.operationalMetrics.totalVehicles) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {reportData.operationalMetrics.activeVehicles} of {reportData.operationalMetrics.totalVehicles} vehicles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="drivers">Driver Performance</TabsTrigger>
          <TabsTrigger value="vehicles">Fleet Analysis</TabsTrigger>
          <TabsTrigger value="incidents">Incident Reports</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Daily Revenue Trend</CardTitle>
                <CardDescription>Revenue performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reportData.dailyTrends.slice(-7).map((day) => (
                    <div key={day.date} className="flex items-center justify-between">
                      <span className="text-sm">{new Date(day.date).toLocaleDateString()}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min((day.revenue / Math.max(...reportData.dailyTrends.map(d => d.revenue))) * 100, 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-20 text-right">
                          {formatCurrency(day.revenue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operational Status</CardTitle>
                <CardDescription>Current fleet status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">Active Drivers</span>
                    </div>
                    <Badge>{reportData.operationalMetrics.activeDrivers}/{reportData.operationalMetrics.totalDrivers}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      <span className="text-sm">Active Vehicles</span>
                    </div>
                    <Badge>{reportData.operationalMetrics.activeVehicles}/{reportData.operationalMetrics.totalVehicles}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      <span className="text-sm">Active Assignments</span>
                    </div>
                    <Badge>{reportData.operationalMetrics.activeAssignments}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Pending Payouts</span>
                    </div>
                    <Badge variant="outline" className="text-yellow-600">
                      {reportData.operationalMetrics.pendingPayouts}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">Open Incidents</span>
                    </div>
                    <Badge variant="outline" className="text-red-600">
                      {reportData.operationalMetrics.openIncidents}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Driver Performance Tab */}
        <TabsContent value="drivers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Drivers</CardTitle>
              <CardDescription>Driver performance rankings</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Trips</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Payout</TableHead>
                    <TableHead>Target Achievement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.topDrivers.map((driver, index) => (
                    <TableRow key={driver.name}>
                      <TableCell>
                        <Badge variant={index < 3 ? 'default' : 'outline'}>
                          #{index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{driver.name}</TableCell>
                      <TableCell>{driver.trips}</TableCell>
                      <TableCell>{formatCurrency(driver.revenue)}</TableCell>
                      <TableCell>{formatCurrency(driver.payout)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={Math.min(driver.targetAchievement, 100)} className="w-16 h-2" />
                          <span className="text-sm">{driver.targetAchievement.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fleet Analysis Tab */}
        <TabsContent value="vehicles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Utilization</CardTitle>
              <CardDescription>Fleet performance and utilization rates</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Trips</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Utilization</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.vehicleUtilization.slice(0, 10).map((vehicle) => (
                    <TableRow key={vehicle.registration}>
                      <TableCell className="font-medium">{vehicle.registration}</TableCell>
                      <TableCell>{vehicle.trips}</TableCell>
                      <TableCell>{formatCurrency(vehicle.revenue)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={vehicle.utilization} className="w-16 h-2" />
                          <span className="text-sm">{vehicle.utilization.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Incidents by Type</CardTitle>
                <CardDescription>Breakdown of incident categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(reportData.incidentStats.byType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Incidents by Severity</CardTitle>
                <CardDescription>Severity distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(reportData.incidentStats.bySeverity).map(([severity, count]) => (
                    <div key={severity} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{severity}</span>
                      <Badge 
                        variant={severity === 'critical' || severity === 'severe' ? 'destructive' : 'outline'}
                      >
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Estimated Cost</span>
                    <span className="font-bold text-red-600">
                      {formatCurrency(reportData.incidentStats.totalCost)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Driver Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {Math.round((reportData.operationalMetrics.activeDrivers / reportData.operationalMetrics.totalDrivers) * 100)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Active Rate</p>
                  <div className="mt-2">
                    <Progress 
                      value={(reportData.operationalMetrics.activeDrivers / reportData.operationalMetrics.totalDrivers) * 100} 
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fleet Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {Math.round((reportData.operationalMetrics.activeVehicles / reportData.operationalMetrics.totalVehicles) * 100)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Utilization</p>
                  <div className="mt-2">
                    <Progress 
                      value={(reportData.operationalMetrics.activeVehicles / reportData.operationalMetrics.totalVehicles) * 100} 
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Efficiency Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {Math.round(((reportData.totalTrips / reportData.operationalMetrics.activeDrivers) / 30) * 100)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Trips per Driver</p>
                  <div className="mt-2">
                    <Progress 
                      value={Math.min(((reportData.totalTrips / reportData.operationalMetrics.activeDrivers) / 30) * 100, 100)} 
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
