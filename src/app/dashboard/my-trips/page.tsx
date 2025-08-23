'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { formatCurrency, calculatePayout } from '@/lib/utils/payout'
import {
  MapPin,
  Plus,
  Clock,
  DollarSign,
  Route,
  Calendar,
  AlertCircle,
  TrendingUp,
  Target,
  Fuel
} from 'lucide-react'
import { Database } from '@/lib/types/database'

type Trip = Database['public']['Tables']['trips']['Row']

export default function MyTripsPage() {
  const { profile, isDriver } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [driverId, setDriverId] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (isDriver && profile?.username) {
      fetchDriverAndTrips()
    } else {
      setLoading(false)
    }
  }, [isDriver, profile])

  const fetchDriverAndTrips = async () => {
    try {
      // Get driver ID first
      const { data: driver } = await supabase
        .from('drivers')
        .select('id')
        .eq('phone', profile?.username)
        .single()

      if (!driver) {
        toast.error('Driver profile not found')
        setLoading(false)
        return
      }

      setDriverId(driver.id)

      // Fetch trips for this driver
      const { data: tripsData, error } = await supabase
        .from('trips')
        .select('*')
        .eq('driver_id', driver.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTrips(tripsData || [])
    } catch (error) {
      console.error('Error fetching trips:', error)
      toast.error('Failed to load trips')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTrip = async (formData: FormData) => {
    if (!driverId) {
      toast.error('Driver ID not found')
      return
    }

    try {
      const fareAmount = parseFloat(formData.get('fare_amount') as string) || 0
      const platformCommission = parseFloat(formData.get('platform_commission') as string) || 0
      
      const tripData = {
        driver_id: driverId,
        vehicle_id: null, // Will be set based on assignment
        trip_start_time: formData.get('trip_start_time') as string,
        trip_end_time: formData.get('trip_end_time') as string,
        pickup_location: formData.get('pickup_location') as string,
        drop_location: formData.get('drop_location') as string,
        distance_km: parseFloat(formData.get('distance_km') as string) || null,
        fare_amount: fareAmount,
        platform_commission: platformCommission,
        net_revenue: fareAmount - platformCommission,
        platform_trip_id: formData.get('platform_trip_id') as string,
        trip_status: 'completed',
      }

      const { error } = await supabase
        .from('trips')
        .insert(tripData)

      if (error) throw error

      toast.success('Trip logged successfully!')
      setIsAddDialogOpen(false)
      fetchDriverAndTrips()
    } catch (error) {
      console.error('Error adding trip:', error)
      toast.error('Failed to log trip')
    }
  }

  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0]
    const todayTrips = trips.filter(trip => 
      trip.trip_start_time?.startsWith(today)
    )
    
    const todayRevenue = todayTrips.reduce((sum, trip) => sum + (trip.fare_amount || 0), 0)
    const todayPayout = calculatePayout(todayRevenue)
    const target = 2250
    const progress = Math.min((todayRevenue / target) * 100, 100)

    return {
      todayTrips: todayTrips.length,
      todayRevenue,
      todayPayout,
      target,
      progress,
      remaining: Math.max(0, target - todayRevenue)
    }
  }

  const getWeekStats = () => {
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    const weekStartStr = weekStart.toISOString().split('T')[0]

    const weekTrips = trips.filter(trip => 
      trip.trip_start_time && trip.trip_start_time >= weekStartStr
    )
    
    return {
      weekTrips: weekTrips.length,
      weekRevenue: weekTrips.reduce((sum, trip) => sum + (trip.fare_amount || 0), 0)
    }
  }

  if (!isDriver) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">This page is only accessible to drivers.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-md mx-auto lg:max-w-4xl">
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

  const todayStats = getTodayStats()
  const weekStats = getWeekStats()

  return (
    <div className="space-y-6 max-w-md mx-auto lg:max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
          <p className="text-gray-600">Track your daily trips and earnings</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Log Trip
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Log New Trip</DialogTitle>
              <DialogDescription>
                Enter your trip details below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault()
              handleAddTrip(new FormData(e.currentTarget))
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trip_start_time">Start Time *</Label>
                  <Input 
                    id="trip_start_time" 
                    name="trip_start_time" 
                    type="datetime-local" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trip_end_time">End Time *</Label>
                  <Input 
                    id="trip_end_time" 
                    name="trip_end_time" 
                    type="datetime-local" 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickup_location">Pickup Location *</Label>
                <Input id="pickup_location" name="pickup_location" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="drop_location">Drop Location *</Label>
                <Input id="drop_location" name="drop_location" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="distance_km">Distance (KM)</Label>
                  <Input 
                    id="distance_km" 
                    name="distance_km" 
                    type="number" 
                    step="0.1" 
                    min="0" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fare_amount">Fare Amount (₹) *</Label>
                  <Input 
                    id="fare_amount" 
                    name="fare_amount" 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    required 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="platform_commission">Commission (₹)</Label>
                  <Input 
                    id="platform_commission" 
                    name="platform_commission" 
                    type="number" 
                    step="0.01" 
                    min="0" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform_trip_id">Trip ID</Label>
                  <Input id="platform_trip_id" name="platform_trip_id" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Log Trip</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
                {formatCurrency(todayStats.todayRevenue)}
              </span>
              <Badge variant={todayStats.progress >= 100 ? 'default' : 'secondary'}>
                {todayStats.progress.toFixed(0)}%
              </Badge>
            </div>
            <Progress value={todayStats.progress} className="h-3" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>Target: {formatCurrency(todayStats.target)}</span>
              <span>Remaining: {formatCurrency(todayStats.remaining)}</span>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-700 font-medium">
                Expected Payout: {formatCurrency(todayStats.todayPayout)}
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
            <div className="text-2xl font-bold text-gray-900">{todayStats.todayTrips}</div>
            <p className="text-xs text-gray-600 mt-1">Completed today</p>
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
              {formatCurrency(todayStats.todayRevenue)}
            </div>
            <p className="text-xs text-gray-600 mt-1">Gross earnings</p>
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
              <p className="text-xl font-bold text-gray-900">{weekStats.weekTrips}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(weekStats.weekRevenue)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Trips */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trips</CardTitle>
          <CardDescription>Your latest completed trips</CardDescription>
        </CardHeader>
        <CardContent>
          {trips.length > 0 ? (
            <div className="space-y-4">
              {trips.slice(0, 5).map((trip) => (
                <div key={trip.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-1">
                      <Route className="h-3 w-3" />
                      {trip.pickup_location} → {trip.drop_location}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {trip.trip_start_time ? 
                          new Date(trip.trip_start_time).toLocaleDateString() : 'N/A'}
                      </span>
                      {trip.distance_km && (
                        <span>{trip.distance_km} km</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">
                      {formatCurrency(trip.fare_amount || 0)}
                    </div>
                    {trip.platform_commission && (
                      <div className="text-xs text-gray-500">
                        -{formatCurrency(trip.platform_commission)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {trips.length > 5 && (
                <div className="text-center pt-4">
                  <Button variant="outline" size="sm">
                    View All Trips ({trips.length})
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No trips logged yet</p>
              <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                Log Your First Trip
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button size="lg" className="h-16 text-base" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-5 w-5 mr-2" />
          Log New Trip
        </Button>
        <Button size="lg" variant="outline" className="h-16 text-base">
          <Fuel className="h-5 w-5 mr-2" />
          Add Expense
        </Button>
      </div>
    </div>
  )
}
