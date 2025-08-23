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
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Route,
  Plus,
  Search,
  Eye,
  Edit,
  X,
  Calendar,
  Users,
  Car,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react'
import { Database } from '@/lib/types/database'

type Assignment = Database['public']['Tables']['assignments']['Row'] & {
  driver?: { name: string, phone: string | null }
  vehicle?: { registration_number: string, model: string | null, brand: string | null }
}

type Driver = Database['public']['Tables']['drivers']['Row']
type Vehicle = Database['public']['Tables']['vehicles']['Row']

export default function AssignmentsPage() {
  const { profile, isAdmin, isManager } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (isAdmin || isManager) {
      fetchAssignments()
      fetchDriversAndVehicles()
    } else {
      setLoading(false)
    }
  }, [isAdmin, isManager])

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          driver:drivers(name, phone),
          vehicle:vehicles(registration_number, model, brand)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAssignments(data || [])
    } catch (error) {
      console.error('Error fetching assignments:', error)
      toast.error('Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }

  const fetchDriversAndVehicles = async () => {
    try {
      const [driversResult, vehiclesResult] = await Promise.all([
        supabase.from('drivers').select('*').eq('status', 'active'),
        supabase.from('vehicles').select('*').eq('status', 'available')
      ])

      setDrivers(driversResult.data || [])
      setVehicles(vehiclesResult.data || [])
    } catch (error) {
      console.error('Error fetching drivers and vehicles:', error)
    }
  }

  const handleCreateAssignment = async (formData: FormData) => {
    try {
      const driverId = parseInt(formData.get('driver_id') as string)
      const vehicleId = parseInt(formData.get('vehicle_id') as string)
      
      // Check if driver or vehicle is already assigned
      const { data: existingAssignments, error: checkError } = await supabase
        .from('assignments')
        .select('*')
        .eq('status', 'active')
        .or(`driver_id.eq.${driverId},vehicle_id.eq.${vehicleId}`)

      if (checkError) throw checkError

      if (existingAssignments && existingAssignments.length > 0) {
        const driverAssigned = existingAssignments.some(a => a.driver_id === driverId)
        const vehicleAssigned = existingAssignments.some(a => a.vehicle_id === vehicleId)
        
        if (driverAssigned) {
          toast.error('Driver is already assigned to another vehicle')
          return
        }
        if (vehicleAssigned) {
          toast.error('Vehicle is already assigned to another driver')
          return
        }
      }

      const assignmentData = {
        driver_id: driverId,
        vehicle_id: vehicleId,
        start_date: formData.get('start_date') as string,
        end_date: formData.get('end_date') as string || null,
        status: 'active',
        assigned_by: profile?.user_id,
        notes: formData.get('notes') as string,
      }

      const { error } = await supabase
        .from('assignments')
        .insert(assignmentData)

      if (error) throw error

      // Update vehicle status to assigned
      await supabase
        .from('vehicles')
        .update({ status: 'assigned' })
        .eq('id', vehicleId)

      toast.success('Assignment created successfully!')
      setIsAddDialogOpen(false)
      fetchAssignments()
      fetchDriversAndVehicles()
    } catch (error) {
      console.error('Error creating assignment:', error)
      toast.error('Failed to create assignment')
    }
  }

  const handleEndAssignment = async (assignmentId: number, vehicleId: number) => {
    try {
      const { error: assignmentError } = await supabase
        .from('assignments')
        .update({ 
          status: 'ended',
          end_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', assignmentId)

      if (assignmentError) throw assignmentError

      // Update vehicle status back to available
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .update({ status: 'available' })
        .eq('id', vehicleId)

      if (vehicleError) throw vehicleError

      toast.success('Assignment ended successfully!')
      fetchAssignments()
      fetchDriversAndVehicles()
    } catch (error) {
      console.error('Error ending assignment:', error)
      toast.error('Failed to end assignment')
    }
  }

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = 
      assignment.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.driver?.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.vehicle?.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.notes?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = !statusFilter || assignment.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'ended':
        return <Badge className="bg-gray-100 text-gray-800">Ended</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  const getAssignmentStats = () => {
    const activeAssignments = assignments.filter(a => a.status === 'active').length
    const endedAssignments = assignments.filter(a => a.status === 'ended').length
    const pendingAssignments = assignments.filter(a => a.status === 'pending').length
    const availableDrivers = drivers.length
    const availableVehicles = vehicles.length

    return {
      total: assignments.length,
      active: activeAssignments,
      ended: endedAssignments,
      pending: pendingAssignments,
      availableDrivers,
      availableVehicles
    }
  }

  if (!isAdmin && !isManager) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to manage assignments.</p>
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
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const stats = getAssignmentStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignment Management</h1>
          <p className="text-gray-600">Manage driver-vehicle assignments</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={drivers.length === 0 || vehicles.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              New Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
              <DialogDescription>
                Assign a driver to a vehicle.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault()
              handleCreateAssignment(new FormData(e.currentTarget))
            }} className="space-y-4">
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input 
                    id="start_date" 
                    name="start_date" 
                    type="date" 
                    required 
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input 
                    id="end_date" 
                    name="end_date" 
                    type="date" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes" 
                  name="notes" 
                  placeholder="Assignment notes or special instructions"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Assignment</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{stats.ended} completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Drivers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableDrivers}</div>
            <p className="text-xs text-muted-foreground">Ready for assignment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableVehicles}</div>
            <p className="text-xs text-muted-foreground">Ready for assignment</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search assignments by driver, vehicle, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Records</CardTitle>
          <CardDescription>
            Showing {filteredAssignments.length} of {assignments.length} assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {assignment.driver?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {assignment.driver?.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        {assignment.vehicle?.registration_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {assignment.vehicle?.brand} {assignment.vehicle?.model}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {assignment.start_date ? 
                          new Date(assignment.start_date).toLocaleDateString() : 'N/A'}
                      </div>
                      {assignment.end_date && (
                        <div className="text-xs text-gray-500">
                          to {new Date(assignment.end_date).toLocaleDateString()}
                        </div>
                      )}
                      {assignment.status === 'active' && !assignment.end_date && (
                        <div className="text-xs text-green-600">Ongoing</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      System
                    </div>
                    <div className="text-xs text-gray-500">
                      {assignment.created_at ? 
                        new Date(assignment.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog open={isViewDialogOpen && selectedAssignment?.id === assignment.id} 
                              onOpenChange={(open) => {
                                setIsViewDialogOpen(open)
                                if (!open) setSelectedAssignment(null)
                              }}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedAssignment(assignment)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Assignment Details</DialogTitle>
                          </DialogHeader>
                          {selectedAssignment && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Driver</Label>
                                  <p className="text-sm">{selectedAssignment.driver?.name}</p>
                                  <p className="text-xs text-gray-500">{selectedAssignment.driver?.phone}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Vehicle</Label>
                                  <p className="text-sm">{selectedAssignment.vehicle?.registration_number}</p>
                                  <p className="text-xs text-gray-500">
                                    {selectedAssignment.vehicle?.brand} {selectedAssignment.vehicle?.model}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Start Date</Label>
                                  <p className="text-sm">
                                    {selectedAssignment.start_date ? 
                                      new Date(selectedAssignment.start_date).toLocaleDateString() : 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">End Date</Label>
                                  <p className="text-sm">
                                    {selectedAssignment.end_date ? 
                                      new Date(selectedAssignment.end_date).toLocaleDateString() : 'Ongoing'}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                                  <div>{getStatusBadge(selectedAssignment.status)}</div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Assigned By</Label>
                                  <p className="text-sm">
                                    System
                                  </p>
                                </div>
                              </div>
                              {selectedAssignment.notes && (
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Notes</Label>
                                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded">
                                    {selectedAssignment.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {assignment.status === 'active' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleEndAssignment(assignment.id, assignment.vehicle_id!)}
                        >
                          <X className="h-3 w-3 mr-1" />
                          End
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredAssignments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No assignments found</p>
              {drivers.length > 0 && vehicles.length > 0 && (
                <Button className="mt-4" variant="outline" onClick={() => setIsAddDialogOpen(true)}>
                  Create First Assignment
                </Button>
              )}
              {(drivers.length === 0 || vehicles.length === 0) && (
                <p className="text-sm text-gray-400 mt-2">
                  {drivers.length === 0 && 'No available drivers. '}
                  {vehicles.length === 0 && 'No available vehicles. '}
                  Add drivers and vehicles to create assignments.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
