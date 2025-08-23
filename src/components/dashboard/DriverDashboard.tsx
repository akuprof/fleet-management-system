'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/utils/payout'
import {
  MapPin,
  CreditCard,
  Clock,
  Target,
  TrendingUp,
  Plus,
  Calendar,
  Fuel
} from 'lucide-react'

interface DriverStats {
  todayTrips: number
  todayRevenue: number
  todayTarget: number
  todayPayout: number
  weeklyTrips: number
  weeklyRevenue: number
  pendingPayouts: number
  lastTripTime: string | null
}

export function DriverDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<DriverStats>({
    todayTrips: 0,
    todayRevenue: 0,
    todayTarget: 2250,
    todayPayout: 0,
    weeklyTrips: 0,
    weeklyRevenue: 0,
    pendingPayouts: 0,
    lastTripTime: null
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (profile?.username) {
      fetchDriverStats()
    }
  }, [profile])

  const fetchDriverStats = async () => {
    try {
      // First get the driver ID based on phone number
      const { data: driver } = await supabase
        .from('drivers')
        .select('id')
        .eq('phone', profile?.username)
        .single()

      if (!driver) {
        setLoading(false)
        return
      }

      const today = new Date().toISOString().split('T')[0]
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const weekStartStr = weekStart.toISOString().split('T')[0]

      const [
        todayTripsResult,
        weeklyTripsResult,
        payoutsResult,
        summaryResult
      ] = await Promise.all([
        // Today's trips
        supabase
          .from('trips')
          .select('fare_amount, net_revenue, created_at')
          .eq('driver_id', driver.id)
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`)
          .order('created_at', { ascending: false }),
        // Weekly trips
        supabase
          .from('trips')
          .select('fare_amount, net_revenue')
          .eq('driver_id', driver.id)
          .gte('created_at', `${weekStartStr}T00:00:00`),
        // Pending payouts
        supabase
          .from('payouts')
          .select('net_payout')
          .eq('driver_id', driver.id)
          .eq('approval_status', 'pending'),
        // Today's summary
        supabase
          .from('daily_summaries')
          .select('*')
          .eq('driver_id', driver.id)
          .eq('summary_date', today)
          .single()
      ])

      const todayTrips = todayTripsResult.data || []
      const weeklyTrips = weeklyTripsResult.data || []
      const pendingPayouts = payoutsResult.data || []
      const summary = summaryResult.data

      const todayRevenue = todayTrips.reduce((sum, trip) => sum + (trip.fare_amount || 0), 0)
      const weeklyRevenue = weeklyTrips.reduce((sum, trip) => sum + (trip.fare_amount || 0), 0)
      const pendingPayoutAmount = pendingPayouts.reduce((sum, payout) => sum + (payout.net_payout || 0), 0)

      // Calculate today's payout using the business formula
      const todayPayout = summary?.total_payout || 0
      const lastTripTime = todayTrips.length > 0 ? todayTrips[0].created_at : null

      setStats({
        todayTrips: todayTrips.length,
        todayRevenue,
        todayTarget: 2250,
        todayPayout,
        weeklyTrips: weeklyTrips.length,
        weeklyRevenue,
        pendingPayouts: pendingPayoutAmount,
        lastTripTime
      })
    } catch (error) {
      console.error('Error fetching driver stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const targetProgress = Math.min((stats.todayRevenue / stats.todayTarget) * 100, 100)

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
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
    )
  }

  return (
    <div className="space-y-6 max-w-md mx-auto lg:max-w-4xl">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
        <p className="text-gray-600">Track your trips and earnings</p>
      </div>

      {/* Today's Target Progress */}
      <Card className="border-2 border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Target className="h-5 w-5" />
            Today's Target Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.todayRevenue)}
              </span>
              <Badge variant={targetProgress >= 100 ? 'default' : 'secondary'}>
                {targetProgress.toFixed(0)}%
              </Badge>
            </div>
            <Progress value={targetProgress} className="h-3" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>Target: {formatCurrency(stats.todayTarget)}</span>
              <span>Remaining: {formatCurrency(Math.max(0, stats.todayTarget - stats.todayRevenue))}</span>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-700 font-medium">
                Expected Payout: {formatCurrency(stats.todayPayout)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Today's Trips
            </CardTitle>
            <div className="bg-blue-100 p-2 rounded-full">
              <MapPin className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.todayTrips}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.lastTripTime 
                ? `Last trip: ${new Date(stats.lastTripTime).toLocaleTimeString()}`
                : 'No trips yet today'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Today's Revenue
            </CardTitle>
            <div className="bg-green-100 p-2 rounded-full">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.todayRevenue)}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Gross earnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Trips</p>
              <p className="text-xl font-bold text-gray-900">{stats.weeklyTrips}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(stats.weeklyRevenue)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Payouts */}
      {stats.pendingPayouts > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Clock className="h-5 w-5" />
              Pending Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {formatCurrency(stats.pendingPayouts)}
            </div>
            <p className="text-sm text-orange-700 mt-1">
              Awaiting approval from management
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button size="lg" className="h-16 text-base" onClick={() => window.location.href = '/dashboard/my-trips'}>
          <Plus className="h-5 w-5 mr-2" />
          Log New Trip
        </Button>
        <Button size="lg" variant="outline" className="h-16 text-base">
          <Fuel className="h-5 w-5 mr-2" />
          View My Trips
        </Button>
      </div>

      {/* Recent Trips Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trips</CardTitle>
          <CardDescription>Your latest completed trips</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No trips logged yet today</p>
            <Button className="mt-4" variant="outline">
              Log Your First Trip
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



