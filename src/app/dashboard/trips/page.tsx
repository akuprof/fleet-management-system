'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils/payout'
import {
  MapPin,
  Plus,
  Search,
  Eye,
  Clock,
  DollarSign,
  Route,
  Calendar,
  AlertCircle,
  TrendingUp,
  Car,
  Users
} from 'lucide-react'
import { Database } from '@/lib/types/database'

type Trip = Database['public']['Tables']['trips']['Row'] & {
  driver?: { name: string, phone: string | null }
  vehicle?: { registration_number: string, model: string | null, brand: string | null }
}

type Driver = Database['public']['Tables']['drivers']['Row']
type Vehicle = Database['public']['Tables']['vehicles']['Row']

export default function TripsPage() {
  const { profile, isAdmin, isManager, isDriver } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [dateFilter, setDateFilter] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchTrips()
    if (isAdmin || isManager) {
      fetchDriversAndVehicles()
    }
  }, [isAdmin, isManager, isDriver])

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

      // If driver, only show their trips
      if (isDriver && profile?.username) {
        const { data: driver } = await supabase
          .from('drivers')
          .select('id')
          .eq('phone', profile.username)
          .single()

        if (driver) {
          query = query.eq('driver_id', driver.id)
        }
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

  const fetchDriversAndVehicles = async () => {
    try {
      const [driversResult, vehiclesResult] = await Promise.all([
        supabase.from('drivers').select('*').eq('status', 'active'),
        supabase.from('vehicles').select('*').in('status', ['available', 'assigned'])
      ])

      setDrivers(driversResult.data || [])
      setVehicles(vehiclesResult.data || [])
    } catch (error) {
      console.error('Error fetching drivers and vehicles:', error)
    }
  }

  const handleAddTrip = async (formData: FormData) => {
    try {
      const tripData = {
        driver_id: parseInt(formData.get('driver_id') as string),
        vehicle_id: parseInt(formData.get('vehicle_id') as string),
        trip_start_time: formData.get('trip_start_time') as string,
        trip_end_time: formData.get('trip_end_time') as string,
        pickup_location: formData.get('pickup_location') as string,
        drop_location: formData.get('drop_location') as string,
        distance_km: parseFloat(formData.get('distance_km') as string) || null,
        fare_amount: parseFloat(formData.get('fare_amount') as string) || null,
        platform_commission: parseFloat(formData.get('platform_commission') as string) || null,
        platform_trip_id: formData.get('platform_trip_id') as string,
        trip_status: formData.get('trip_status') as string || 'completed',
      }

      const { error } = await supabase
        .from('trips')
        .insert(tripData)

      if (error) throw error

      toast.success('Trip logged successfully!')
      setIsAddDialogOpen(false)
      fetchTrips()
    } catch (error) {
      console.error('Error adding trip:', error)
      toast.error('Failed to log trip')
    }
  }

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = 
      trip.pickup_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.drop_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.platform_trip_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.vehicle?.registration_number?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDate = !dateFilter || 
      (trip.trip_start_time && trip.trip_start_time.startsWith(dateFilter))

    return matchesSearch && matchesDate
  })

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

  const getTripStats = () => {
    const today = new Date().toISOString().split('T')[0]
    const todayTrips = trips.filter(trip => 
      trip.trip_start_time?.startsWith(today)
    )
    
    return {
      totalTrips: trips.length,
      todayTrips: todayTrips.length,
      totalRevenue: trips.reduce((sum, trip) => sum + (trip.fare_amount || 0), 0),
      todayRevenue: todayTrips.reduce((sum, trip) => sum + (trip.fare_amount || 0), 0),
      completedTrips: trips.filter(trip => trip.trip_status === 'completed').length,
    }
  }

  const stats = getTripStats()

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
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isDriver ? 'My Trips' : 'Trip Management'}
          </h1>
          <p className="text-gray-600">
            {isDriver ? 'View and log your trips' : 'Monitor all fleet trips'}
          </p>
        </div>
        {(isAdmin || isManager || isDriver) && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Log Trip
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Log New Trip</DialogTitle>
                <DialogDescription>
                  Enter the trip details below.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault()
                handleAddTrip(new FormData(e.currentTarget))
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="platform_commission">Platform Commission (₹)</Label>
                    <Input 
                      id="platform_commission" 
                      name="platform_commission" 
                      type="number" 
                      step="0.01" 
                      min="0" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platform_trip_id">Platform Trip ID</Label>
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
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTrips}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedTrips} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Trips</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayTrips}</div>
            <p className="text-xs text-muted-foreground">
              Active today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              All time earnings
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.todayRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Today's earnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search trips by location, trip ID, driver, or vehicle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="w-48">
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            placeholder="Filter by date"
          />
        </div>
      </div>

      {/* Trips Table */}
      <Card>
        <CardHeader>
          <CardTitle>Trip Records</CardTitle>
          <CardDescription>
            Showing {filteredTrips.length} of {trips.length} trips
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trip Details</TableHead>
                {!isDriver && <TableHead>Driver & Vehicle</TableHead>}
                <TableHead>Time</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Earnings</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center gap-1">
                        <Route className="h-3 w-3" />
                        {trip.pickup_location} → {trip.drop_location}
                      </div>
                      {trip.platform_trip_id && (
                        <div className="text-sm text-gray-500">
                          ID: {trip.platform_trip_id}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  {!isDriver && (
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {trip.driver?.name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Car className="h-3 w-3" />
                          {trip.vehicle?.registration_number}
                        </div>
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <div>
                      <div className="text-sm">
                        {trip.trip_start_time ? 
                          new Date(trip.trip_start_time).toLocaleString() : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Duration: {
                          trip.trip_start_time && trip.trip_end_time ?
                          Math.round((new Date(trip.trip_end_time).getTime() - 
                                    new Date(trip.trip_start_time).getTime()) / (1000 * 60)) + ' min'
                          : 'N/A'
                        }
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {trip.distance_km ? `${trip.distance_km} km` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {formatCurrency(trip.fare_amount || 0)}
                      </div>
                      {trip.platform_commission && (
                        <div className="text-xs text-gray-500">
                          Commission: {formatCurrency(trip.platform_commission)}
                        </div>
                      )}
                      {trip.fare_amount && trip.platform_commission && (
                        <div className="text-xs text-green-600">
                          Net: {formatCurrency((trip.fare_amount || 0) - (trip.platform_commission || 0))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(trip.trip_status)}</TableCell>
                  <TableCell>
                    <Dialog open={isViewDialogOpen && selectedTrip?.id === trip.id} 
                            onOpenChange={(open) => {
                              setIsViewDialogOpen(open)
                              if (!open) setSelectedTrip(null)
                            }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedTrip(trip)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Trip Details</DialogTitle>
                        </DialogHeader>
                        {selectedTrip && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium text-gray-500">Trip ID</Label>
                                <p className="text-sm">{selectedTrip.platform_trip_id || 'N/A'}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-500">Status</Label>
                                <div>{getStatusBadge(selectedTrip.trip_status)}</div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-500">Pickup Location</Label>
                                <p className="text-sm">{selectedTrip.pickup_location}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-500">Drop Location</Label>
                                <p className="text-sm">{selectedTrip.drop_location}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-500">Start Time</Label>
                                <p className="text-sm">
                                  {selectedTrip.trip_start_time ? 
                                    new Date(selectedTrip.trip_start_time).toLocaleString() : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-500">End Time</Label>
                                <p className="text-sm">
                                  {selectedTrip.trip_end_time ? 
                                    new Date(selectedTrip.trip_end_time).toLocaleString() : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-500">Distance</Label>
                                <p className="text-sm">{selectedTrip.distance_km ? `${selectedTrip.distance_km} km` : 'N/A'}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-500">Fare Amount</Label>
                                <p className="text-sm">{formatCurrency(selectedTrip.fare_amount || 0)}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-500">Platform Commission</Label>
                                <p className="text-sm">{formatCurrency(selectedTrip.platform_commission || 0)}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-500">Net Revenue</Label>
                                <p className="text-sm font-medium text-green-600">
                                  {formatCurrency((selectedTrip.fare_amount || 0) - (selectedTrip.platform_commission || 0))}
                                </p>
                              </div>
                              {!isDriver && (
                                <>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">Driver</Label>
                                    <p className="text-sm">{selectedTrip.driver?.name || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">Vehicle</Label>
                                    <p className="text-sm">
                                      {selectedTrip.vehicle?.registration_number || 'N/A'}
                                      {selectedTrip.vehicle?.brand && selectedTrip.vehicle?.model && 
                                        ` (${selectedTrip.vehicle.brand} ${selectedTrip.vehicle.model})`
                                      }
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredTrips.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No trips found</p>
              <Button className="mt-4" variant="outline" onClick={() => setIsAddDialogOpen(true)}>
                Log Your First Trip
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Trip Dialog */}
      {(isAdmin || isManager) && (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg">
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Log New Trip</DialogTitle>
              <DialogDescription>
                Enter the trip details below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault()
              handleLogTrip(new FormData(e.currentTarget))
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="driver_id">Driver *</Label>
                  <Select name="driver_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id.toString()}>
                          {driver.name}
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
                          {vehicle.registration_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Label htmlFor="trip_start_time">Start Time *</Label>
                  <Input id="trip_start_time" name="trip_start_time" type="datetime-local" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trip_end_time">End Time</Label>
                  <Input id="trip_end_time" name="trip_end_time" type="datetime-local" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="distance_km">Distance (km)</Label>
                  <Input id="distance_km" name="distance_km" type="number" step="0.1" min="0" />
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

                  <div className="space-y-2">

                    <Label htmlFor="platform_commission">Platform Commission (₹)</Label>

                    <Input 

                      id="platform_commission" 

                      name="platform_commission" 

                      type="number" 

                      step="0.01" 

                      min="0" 

                    />

                  </div>

                  <div className="space-y-2">

                    <Label htmlFor="platform_trip_id">Platform Trip ID</Label>

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

        )}

      </div>



      {/* Stats Cards */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <Card>

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

            <CardTitle className="text-sm font-medium">Total Trips</CardTitle>

            <MapPin className="h-4 w-4 text-muted-foreground" />

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-bold">{stats.totalTrips}</div>

            <p className="text-xs text-muted-foreground">

              {stats.completedTrips} completed

            </p>

          </CardContent>

        </Card>

        <Card>

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

            <CardTitle className="text-sm font-medium">Today's Trips</CardTitle>

            <Calendar className="h-4 w-4 text-muted-foreground" />

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-bold">{stats.todayTrips}</div>

            <p className="text-xs text-muted-foreground">

              Active today

            </p>

          </CardContent>

        </Card>

        <Card>

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>

            <DollarSign className="h-4 w-4 text-muted-foreground" />

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>

            <p className="text-xs text-muted-foreground">

              All time earnings

            </p>

          </CardContent>

        </Card>

        <Card>

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>

            <TrendingUp className="h-4 w-4 text-muted-foreground" />

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-bold">{formatCurrency(stats.todayRevenue)}</div>

            <p className="text-xs text-muted-foreground">

              Today's earnings

            </p>

          </CardContent>

        </Card>

      </div>



      {/* Filters */}

      <div className="flex gap-4">

        <div className="relative flex-1">

          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />

          <Input

            placeholder="Search trips by location, trip ID, driver, or vehicle..."

            value={searchTerm}

            onChange={(e) => setSearchTerm(e.target.value)}

            className="pl-10"

          />

        </div>

        <div className="w-48">

          <Input

            type="date"

            value={dateFilter}

            onChange={(e) => setDateFilter(e.target.value)}

            placeholder="Filter by date"

          />

        </div>

      </div>



      {/* Trips Table */}

      <Card>

        <CardHeader>

          <CardTitle>Trip Records</CardTitle>

          <CardDescription>

            Showing {filteredTrips.length} of {trips.length} trips

          </CardDescription>

        </CardHeader>

        <CardContent>

          <Table>

            <TableHeader>

              <TableRow>

                <TableHead>Trip Details</TableHead>

                {!isDriver && <TableHead>Driver & Vehicle</TableHead>}

                <TableHead>Time</TableHead>

                <TableHead>Distance</TableHead>

                <TableHead>Earnings</TableHead>

                <TableHead>Status</TableHead>

                <TableHead>Actions</TableHead>

              </TableRow>

            </TableHeader>

            <TableBody>

              {filteredTrips.map((trip) => (

                <TableRow key={trip.id}>

                  <TableCell>

                    <div>

                      <div className="font-medium flex items-center gap-1">

                        <Route className="h-3 w-3" />

                        {trip.pickup_location} → {trip.drop_location}

                      </div>

                      {trip.platform_trip_id && (

                        <div className="text-sm text-gray-500">

                          ID: {trip.platform_trip_id}

                        </div>

                      )}

                    </div>

                  </TableCell>

                  {!isDriver && (

                    <TableCell>

                      <div>

                        <div className="font-medium flex items-center gap-1">

                          <Users className="h-3 w-3" />

                          {trip.driver?.name}

                        </div>

                        <div className="text-sm text-gray-500 flex items-center gap-1">

                          <Car className="h-3 w-3" />

                          {trip.vehicle?.registration_number}

                        </div>

                      </div>

                    </TableCell>

                  )}

                  <TableCell>

                    <div>

                      <div className="text-sm">

                        {trip.trip_start_time ? 

                          new Date(trip.trip_start_time).toLocaleString() : 'N/A'}

                      </div>

                      <div className="text-xs text-gray-500">

                        Duration: {

                          trip.trip_start_time && trip.trip_end_time ?

                          Math.round((new Date(trip.trip_end_time).getTime() - 

                                    new Date(trip.trip_start_time).getTime()) / (1000 * 60)) + ' min'

                          : 'N/A'

                        }

                      </div>

                    </div>

                  </TableCell>

                  <TableCell>

                    {trip.distance_km ? `${trip.distance_km} km` : 'N/A'}

                  </TableCell>

                  <TableCell>

                    <div>

                      <div className="font-medium">

                        {formatCurrency(trip.fare_amount || 0)}

                      </div>

                      {trip.platform_commission && (

                        <div className="text-xs text-gray-500">

                          Commission: {formatCurrency(trip.platform_commission)}

                        </div>

                      )}

                      {trip.fare_amount && trip.platform_commission && (

                        <div className="text-xs text-green-600">

                          Net: {formatCurrency((trip.fare_amount || 0) - (trip.platform_commission || 0))}

                        </div>

                      )}

                    </div>

                  </TableCell>

                  <TableCell>{getStatusBadge(trip.trip_status)}</TableCell>

                  <TableCell>

                    <Dialog open={isViewDialogOpen && selectedTrip?.id === trip.id} 

                            onOpenChange={(open) => {

                              setIsViewDialogOpen(open)

                              if (!open) setSelectedTrip(null)

                            }}>

                      <DialogTrigger asChild>

                        <Button 

                          variant="outline" 

                          size="sm"

                          onClick={() => setSelectedTrip(trip)}

                        >

                          <Eye className="h-3 w-3" />

                        </Button>

                      </DialogTrigger>

                      <DialogContent>

                        <DialogHeader>

                          <DialogTitle>Trip Details</DialogTitle>

                        </DialogHeader>

                        {selectedTrip && (

                          <div className="space-y-4">

                            <div className="grid grid-cols-2 gap-4">

                              <div>

                                <Label className="text-sm font-medium text-gray-500">Trip ID</Label>

                                <p className="text-sm">{selectedTrip.platform_trip_id || 'N/A'}</p>

                              </div>

                              <div>

                                <Label className="text-sm font-medium text-gray-500">Status</Label>

                                <div>{getStatusBadge(selectedTrip.trip_status)}</div>

                              </div>

                              <div>

                                <Label className="text-sm font-medium text-gray-500">Pickup Location</Label>

                                <p className="text-sm">{selectedTrip.pickup_location}</p>

                              </div>

                              <div>

                                <Label className="text-sm font-medium text-gray-500">Drop Location</Label>

                                <p className="text-sm">{selectedTrip.drop_location}</p>

                              </div>

                              <div>

                                <Label className="text-sm font-medium text-gray-500">Start Time</Label>

                                <p className="text-sm">

                                  {selectedTrip.trip_start_time ? 

                                    new Date(selectedTrip.trip_start_time).toLocaleString() : 'N/A'}

                                </p>

                              </div>

                              <div>

                                <Label className="text-sm font-medium text-gray-500">End Time</Label>

                                <p className="text-sm">

                                  {selectedTrip.trip_end_time ? 

                                    new Date(selectedTrip.trip_end_time).toLocaleString() : 'N/A'}

                                </p>

                              </div>

                              <div>

                                <Label className="text-sm font-medium text-gray-500">Distance</Label>

                                <p className="text-sm">{selectedTrip.distance_km ? `${selectedTrip.distance_km} km` : 'N/A'}</p>

                              </div>

                              <div>

                                <Label className="text-sm font-medium text-gray-500">Fare Amount</Label>

                                <p className="text-sm">{formatCurrency(selectedTrip.fare_amount || 0)}</p>

                              </div>

                              <div>

                                <Label className="text-sm font-medium text-gray-500">Platform Commission</Label>

                                <p className="text-sm">{formatCurrency(selectedTrip.platform_commission || 0)}</p>

                              </div>

                              <div>

                                <Label className="text-sm font-medium text-gray-500">Net Revenue</Label>

                                <p className="text-sm font-medium text-green-600">

                                  {formatCurrency((selectedTrip.fare_amount || 0) - (selectedTrip.platform_commission || 0))}

                                </p>

                              </div>

                              {!isDriver && (

                                <>

                                  <div>

                                    <Label className="text-sm font-medium text-gray-500">Driver</Label>

                                    <p className="text-sm">{selectedTrip.driver?.name || 'N/A'}</p>

                                  </div>

                                  <div>

                                    <Label className="text-sm font-medium text-gray-500">Vehicle</Label>

                                    <p className="text-sm">

                                      {selectedTrip.vehicle?.registration_number || 'N/A'}

                                      {selectedTrip.vehicle?.brand && selectedTrip.vehicle?.model && 

                                        ` (${selectedTrip.vehicle.brand} ${selectedTrip.vehicle.model})`

                                      }

                                    </p>

                                  </div>

                                </>

                              )}

                            </div>

                          </div>

                        )}

                      </DialogContent>

                    </Dialog>

                  </TableCell>

                </TableRow>

              ))}

            </TableBody>

          </Table>

          {filteredTrips.length === 0 && (

            <div className="text-center py-8 text-gray-500">

              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />

              <p>No trips found</p>

              <Button className="mt-4" variant="outline" onClick={() => setIsAddDialogOpen(true)}>

                Log Your First Trip

              </Button>

            </div>

          )}

        </CardContent>

      </Card>

    </div>

  )

}


