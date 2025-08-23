'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/payout'
import {
  Users,
  Car,
  MapPin,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface DashboardStats {
  totalDrivers: number
  activeDrivers: number
  totalVehicles: number
  availableVehicles: number
  todayTrips: number
  todayRevenue: number
  pendingPayouts: number
  activeIncidents: number
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalDrivers: 0,
    activeDrivers: 0,
    totalVehicles: 0,
    availableVehicles: 0,
    todayTrips: 0,
    todayRevenue: 0,
    pendingPayouts: 0,
    activeIncidents: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]

      // Fetch all stats in parallel
      const [
        driversResult,
        vehiclesResult,
        tripsResult,
        payoutsResult,
        incidentsResult
      ] = await Promise.all([
        // Drivers stats
        supabase.from('drivers').select('status'),
        // Vehicles stats
        supabase.from('vehicles').select('status'),
        // Today's trips
        supabase
          .from('trips')
          .select('fare_amount')
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`),
        // Pending payouts
        supabase
          .from('payouts')
          .select('id')
          .eq('approval_status', 'pending'),
        // Active incidents
        supabase
          .from('incidents')
          .select('id')
          .eq('status', 'open')
      ])

      // Process drivers
      const drivers = driversResult.data || []
      const totalDrivers = drivers.length
      const activeDrivers = drivers.filter(d => d.status === 'active').length

      // Process vehicles
      const vehicles = vehiclesResult.data || []
      const totalVehicles = vehicles.length
      const availableVehicles = vehicles.filter(v => v.status === 'available').length

      // Process trips
      const trips = tripsResult.data || []
      const todayTrips = trips.length
      const todayRevenue = trips.reduce((sum, trip) => sum + (trip.fare_amount || 0), 0)

      // Process payouts and incidents
      const pendingPayouts = payoutsResult.data?.length || 0
      const activeIncidents = incidentsResult.data?.length || 0

      setStats({
        totalDrivers,
        activeDrivers,
        totalVehicles,
        availableVehicles,
        todayTrips,
        todayRevenue,
        pendingPayouts,
        activeIncidents
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Drivers',
      value: stats.totalDrivers,
      subtitle: `${stats.activeDrivers} active`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Fleet Vehicles',
      value: stats.totalVehicles,
      subtitle: `${stats.availableVehicles} available`,
      icon: Car,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: "Today's Trips",
      value: stats.todayTrips,
      subtitle: 'Completed trips',
      icon: MapPin,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: "Today's Revenue",
      value: formatCurrency(stats.todayRevenue),
      subtitle: 'Total earnings',
      icon: CreditCard,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ]

  const alertCards = [
    {
      title: 'Pending Payouts',
      value: stats.pendingPayouts,
      subtitle: 'Awaiting approval',
      icon: stats.pendingPayouts > 0 ? AlertTriangle : CheckCircle,
      color: stats.pendingPayouts > 0 ? 'text-yellow-600' : 'text-green-600',
      bgColor: stats.pendingPayouts > 0 ? 'bg-yellow-100' : 'bg-green-100'
    },
    {
      title: 'Active Incidents',
      value: stats.activeIncidents,
      subtitle: 'Require attention',
      icon: stats.activeIncidents > 0 ? AlertTriangle : CheckCircle,
      color: stats.activeIncidents > 0 ? 'text-red-600' : 'text-green-600',
      bgColor: stats.activeIncidents > 0 ? 'bg-red-100' : 'bg-green-100'
    }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of your fleet management system</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-full`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-gray-600 mt-1">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {alertCards.map((alert) => (
          <Card key={alert.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {alert.title}
              </CardTitle>
              <div className={`${alert.bgColor} p-2 rounded-full`}>
                <alert.icon className={`h-4 w-4 ${alert.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{alert.value}</div>
              <p className="text-xs text-gray-600 mt-1">{alert.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-sm font-medium">Add Driver</p>
            </div>
            <div className="text-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <Car className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm font-medium">Add Vehicle</p>
            </div>
            <div className="text-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <CreditCard className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <p className="text-sm font-medium">Process Payouts</p>
            </div>
            <div className="text-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-600" />
              <p className="text-sm font-medium">Review Incidents</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



