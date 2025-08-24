'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { useAuth } from '@/lib/hooks/useAuth'
import { Database } from '@/lib/types/database'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Filter, Calendar } from 'lucide-react'

// Type definitions
type Trip = Database['public']['Tables']['trips']['Row'] & {
  driver?: Database['public']['Tables']['drivers']['Row'] | null
  vehicle?: Database['public']['Tables']['vehicles']['Row'] | null
}
type Driver = Database['public']['Tables']['drivers']['Row']
type Vehicle = Database['public']['Tables']['vehicles']['Row']

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function TripsPage() {
  const { profile, isAdmin, isManager, isDriver } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  useEffect(() => {
    fetchTrips()
    if (isAdmin || isManager) fetchDriversAndVehicles()
  }, [isAdmin, isManager, isDriver])

  // Fetch trips
  const fetchTrips = async () => {
    try {
      let query = supabase
        .from('trips')
        .select(`
          *,
          driver:drivers(name, phone),
          vehicle:vehicles(registration_number, model, brand)
        `)
        .order('created_at', { ascending: false })

      if (isDriver && profile?.username) {
        const { data: driver } = await supabase
          .from('drivers')
          .select('id')
          .eq('phone', profile.username)
          .single()
        if (driver) query = query.eq('driver_id', driver.id)
      }

      const { data, error } = await query
      if (error) throw error
      setTrips(data || [])
    } catch (error) {
      console.error('Error fetching trips:', error)
      toast.error('Failed to load trips')
    } finally {
      setLoading(false)
    }
  }

  // Fetch drivers and vehicles
  const fetchDriversAndVehicles = async () => {
    try {
      const [driversResult, vehiclesResult] = await Promise.all([
        supabase.from('drivers').select('*').eq('status', 'active'),
        supabase
          .from('vehicles')
          .select('*')
          .in('status', ['available', 'assigned'])
      ])
      setDrivers(driversResult.data || [])
      setVehicles(vehiclesResult.data || [])
    } catch (error) {
      console.error('Error fetching drivers and vehicles:', error)
    }
  }

  // Add trip
  const handleAddTrip = async (formData: FormData) => {
    try {
      const tripData: any = {
        driver_id: parseInt(formData.get('driver_id') as string),
        vehicle_id: parseInt(formData.get('vehicle_id') as string),
        trip_start_time: formData.get('trip_start_time') as string,
        trip_end_time: formData.get('trip_end_time') as string,
        pickup_location: formData.get('pickup_location') as string,
        drop_location: formData.get('drop_location') as string,
        distance_km: parseFloat(formData.get('distance_km') as string) || null,
        fare_amount: parseFloat(formData.get('fare_amount') as string) || 0,
        platform_commission:
          parseFloat(formData.get('platform_commission') as string) || 0,
        platform_trip_id: formData.get('platform_trip_id') as string,
        trip_status: (formData.get('trip_status') as string) || 'completed'
      }

      tripData.net_revenue = tripData.fare_amount - tripData.platform_commission

      const { error } = await supabase.from('trips').insert(tripData)
      if (error) throw error

      toast.success('Trip logged successfully!')
      setIsAddDialogOpen(false)
      fetchTrips()
    } catch (error) {
      console.error('Error adding trip:', error)
      toast.error('Failed to log trip')
    }
  }

  // Filter trips
  const filteredTrips = trips.filter((trip) => {
    const matchesSearch =
      trip.pickup_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.drop_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.platform_trip_id
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      trip.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.vehicle?.registration_number
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())

    const matchesDate =
      !dateFilter || (trip.trip_start_time && trip.trip_start_time.startsWith(dateFilter))

    const matchesStatus = !statusFilter || trip.trip_status === statusFilter

    return matchesSearch && matchesDate && matchesStatus
  })

  // Trip status badge
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      case 'disputed':
        return <Badge className="bg-yellow-100 text-yellow-800">Disputed</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('en-IN', {
      dateStyle: 'short',
      timeStyle: 'short'
    })
  }

  // Trip stats
  const getTripStats = () => {
    const today = new Date().toISOString().split('T')[0]
    const todayTrips = trips.filter((trip) => trip.trip_start_time?.startsWith(today))

    return {
      totalTrips: trips.length,
      todayTrips: todayTrips.length,
      totalRevenue: trips.reduce((sum, trip) => sum + (trip.fare_amount || 0), 0),
      todayRevenue: todayTrips.reduce((sum, trip) => sum + (trip.fare_amount || 0), 0),
      completedTrips: trips.filter((trip) => trip.trip_status === 'completed').length
    }
  }

  const stats = getTripStats()

  if (loading) {
    return <p className="text-center py-12 text-gray-500">Loading trips...</p>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {isDriver ? 'My Trips' : 'Trip Management'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {isDriver ? 'View and log your trips' : 'Monitor all fleet trips'}
          </p>
        </div>

        {(isAdmin || isManager || isDriver) && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Log Trip
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl mx-4">
              <DialogHeader>
                <DialogTitle>Log New Trip</DialogTitle>
                <DialogDescription>Enter the trip details below.</DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleAddTrip(new FormData(e.currentTarget))
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(isAdmin || isManager) && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="driver_id">Driver *</Label>
                        <Select name="driver_id" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select driver" />
                          </SelectTrigger>
                          <SelectContent>
                            {drivers.map((driver) => (
                              <SelectItem key={driver.id} value={driver.id.toString()}>
                                {driver.name} ({driver.phone})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="vehicle_id">Vehicle *</Label>
                        <Select name="vehicle_id" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select vehicle" />
                          </SelectTrigger>
                          <SelectContent>
                            {vehicles.map((vehicle) => (
                              <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                                {vehicle.registration_number} ({vehicle.brand} {vehicle.model})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="trip_start_time">Start Time *</Label>
                    <Input id="trip_start_time" name="trip_start_time" type="datetime-local" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trip_end_time">End Time *</Label>
                    <Input id="trip_end_time" name="trip_end_time" type="datetime-local" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pickup_location">Pickup Location *</Label>
                    <Input id="pickup_location" name="pickup_location" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="drop_location">Drop Location *</Label>
                    <Input id="drop_location" name="drop_location" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="distance_km">Distance (KM)</Label>
                    <Input id="distance_km" name="distance_km" type="number" step="0.1" min="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fare_amount">Fare Amount (₹) *</Label>
                    <Input id="fare_amount" name="fare_amount" type="number" step="0.01" min="0" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platform_commission">Platform Commission (₹)</Label>
                    <Input id="platform_commission" name="platform_commission" type="number" step="0.01" min="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platform_trip_id">Platform Trip ID</Label>
                    <Input id="platform_trip_id" name="platform_trip_id" />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Log Trip</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-50 rounded shadow">
          <p className="text-sm text-gray-600">Total Trips</p>
          <h2 className="text-lg sm:text-xl font-bold">{stats.totalTrips}</h2>
        </div>
        <div className="p-4 bg-gray-50 rounded shadow">
          <p className="text-sm text-gray-600">Today's Trips</p>
          <h2 className="text-lg sm:text-xl font-bold">{stats.todayTrips}</h2>
        </div>
        <div className="p-4 bg-gray-50 rounded shadow">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <h2 className="text-lg sm:text-xl font-bold">₹{stats.totalRevenue.toFixed(2)}</h2>
        </div>
        <div className="p-4 bg-gray-50 rounded shadow">
          <p className="text-sm text-gray-600">Today's Revenue</p>
          <h2 className="text-lg sm:text-xl font-bold">₹{stats.todayRevenue.toFixed(2)}</h2>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search trips..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-10 w-full sm:w-40"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Trips Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trip Details
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Driver
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Vehicle
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                  Timing
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Revenue
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 sm:px-6 py-12 text-center text-gray-500">
                    {searchTerm || dateFilter || statusFilter ? 'No trips match your filters' : 'No trips found'}
                  </td>
                </tr>
              ) : (
                filteredTrips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {trip.pickup_location} → {trip.drop_location}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          {trip.platform_trip_id && `ID: ${trip.platform_trip_id}`}
                        </div>
                        {trip.distance_km && (
                          <div className="text-xs sm:text-sm text-gray-500">
                            Distance: {trip.distance_km} km
                          </div>
                        )}
                        {/* Mobile driver info */}
                        <div className="sm:hidden text-xs text-gray-500 mt-2">
                          <div className="font-medium">Driver: {trip.driver?.name}</div>
                          <div>Vehicle: {trip.vehicle?.registration_number}</div>
                          <div>Fare: ₹{trip.fare_amount?.toFixed(2)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 hidden sm:table-cell">
                      <div className="text-sm text-gray-900">{trip.driver?.name}</div>
                      <div className="text-sm text-gray-500">{trip.driver?.phone}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 hidden lg:table-cell">
                      <div className="text-sm text-gray-900">{trip.vehicle?.registration_number}</div>
                      <div className="text-sm text-gray-500">
                        {trip.vehicle?.brand} {trip.vehicle?.model}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 hidden xl:table-cell">
                      <div className="text-sm text-gray-900">
                        {formatDate(trip.trip_start_time)}
                      </div>
                      <div className="text-sm text-gray-500">
                        to {formatDate(trip.trip_end_time)}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 hidden sm:table-cell">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{trip.fare_amount?.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Net: ₹{trip.net_revenue?.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      {getStatusBadge(trip.trip_status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-500 text-center">
        Showing {filteredTrips.length} of {trips.length} trips
      </div>
    </div>
  )
}
