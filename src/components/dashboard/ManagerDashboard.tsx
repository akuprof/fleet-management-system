'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/payout'
import {
  MapPin,
  CreditCard,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  TrendingUp
} from 'lucide-react'

interface ManagerStats {
  todayTrips: number
  todayRevenue: number
  pendingApprovals: number
  activeDrivers: number
  completedPayouts: number
  pendingIncidents: number
}

export function ManagerDashboard() {
  const [stats, setStats] = useState<ManagerStats>({
    todayTrips: 0,
    todayRevenue: 0,
    pendingApprovals: 0,
    activeDrivers: 0,
    completedPayouts: 0,
    pendingIncidents: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchManagerStats()
  }, [])

  const fetchManagerStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]

      const [
        tripsResult,
        payoutsResult,
        driversResult,
        incidentsResult
      ] = await Promise.all([
        // Today's trips
        supabase
          .from('trips')
          .select('fare_amount')
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`),
        // Payouts
        supabase.from('payouts').select('approval_status'),
        // Active drivers
        supabase
          .from('drivers')
          .select('id')
          .eq('status', 'active'),
        // Incidents
        supabase.from('incidents').select('status')
      ])

      const trips = tripsResult.data || []
      const todayTrips = trips.length
      const todayRevenue = trips.reduce((sum, trip) => sum + (trip.fare_amount || 0), 0)

      const payouts = payoutsResult.data || []
      const pendingApprovals = payouts.filter(p => p.approval_status === 'pending').length
      const completedPayouts = payouts.filter(p => p.approval_status === 'approved').length

      const activeDrivers = driversResult.data?.length || 0

      const incidents = incidentsResult.data || []
      const pendingIncidents = incidents.filter(i => i.status === 'open').length

      setStats({
        todayTrips,
        todayRevenue,
        pendingApprovals,
        activeDrivers,
        completedPayouts,
        pendingIncidents
      })
    } catch (error) {
      console.error('Error fetching manager stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: "Today's Trips",
      value: stats.todayTrips,
      subtitle: 'Completed today',
      icon: MapPin,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: "Today's Revenue",
      value: formatCurrency(stats.todayRevenue),
      subtitle: 'Total earnings',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Active Drivers',
      value: stats.activeDrivers,
      subtitle: 'Currently working',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      subtitle: 'Payouts awaiting approval',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
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
        <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
        <p className="text-gray-600">Manage operations and approve transactions</p>
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

      {/* Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Pending Approvals
            </CardTitle>
            <CardDescription>
              Items requiring your attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Payout Approvals</p>
                  <p className="text-sm text-gray-600">{stats.pendingApprovals} pending</p>
                </div>
                <Button size="sm" variant="outline">
                  Review
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Incident Reports</p>
                  <p className="text-sm text-gray-600">{stats.pendingIncidents} open</p>
                </div>
                <Button size="sm" variant="outline">
                  Review
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest completed actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="bg-green-100 p-2 rounded-full">
                  <CreditCard className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Payouts Approved</p>
                  <p className="text-sm text-gray-600">{stats.completedPayouts} this week</p>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  Completed
                </Badge>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="bg-blue-100 p-2 rounded-full">
                  <MapPin className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Trips Monitored</p>
                  <p className="text-sm text-gray-600">{stats.todayTrips} today</p>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common management tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <CreditCard className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm font-medium">Approve Payouts</p>
            </div>
            <div className="text-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-sm font-medium">View Trips</p>
            </div>
            <div className="text-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-600" />
              <p className="text-sm font-medium">Handle Incidents</p>
            </div>
            <div className="text-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-sm font-medium">Manage Drivers</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}





