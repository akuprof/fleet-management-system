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
import {
  Car,
  Plus,
  Search,
  Edit,
  Eye,
  Calendar,
  AlertCircle,
  Wrench,
  Shield,
  FileText
} from 'lucide-react'
import { Database } from '@/lib/types/database'

type Vehicle = Database['public']['Tables']['vehicles']['Row']

export default function VehiclesPage() {
  const { profile, isAdmin, isManager } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (isAdmin || isManager) {
      fetchVehicles()
    } else {
      setLoading(false)
    }
  }, [isAdmin, isManager])

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setVehicles(data || [])
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      toast.error('Failed to load vehicles')
    } finally {
      setLoading(false)
    }
  }

  const handleAddVehicle = async (formData: FormData) => {
    try {
      const vehicleData = {
        registration_number: formData.get('registration_number') as string,
        model: formData.get('model') as string,
        brand: formData.get('brand') as string,
        year: parseInt(formData.get('year') as string) || null,
        color: formData.get('color') as string,
        insurance_number: formData.get('insurance_number') as string,
        insurance_expiry: formData.get('insurance_expiry') as string,
        rc_number: formData.get('rc_number') as string,
        permit_number: formData.get('permit_number') as string,
        status: formData.get('status') as string,
        purchase_date: formData.get('purchase_date') as string,
      }

      const { error } = await supabase
        .from('vehicles')
        .insert(vehicleData)

      if (error) throw error

      toast.success('Vehicle added successfully!')
      setIsAddDialogOpen(false)
      fetchVehicles()
    } catch (error) {
      console.error('Error adding vehicle:', error)
      toast.error('Failed to add vehicle')
    }
  }

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800">Available</Badge>
      case 'assigned':
        return <Badge className="bg-blue-100 text-blue-800">Assigned</Badge>
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>
      case 'out_of_service':
        return <Badge className="bg-red-100 text-red-800">Out of Service</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  const getMaintenanceStatus = (lastMaintenance: string | null, nextDue: string | null) => {
    if (!nextDue) return { status: 'unknown', color: 'gray' }
    
    const today = new Date()
    const dueDate = new Date(nextDue)
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
    
    if (daysUntilDue < 0) return { status: 'overdue', color: 'red' }
    if (daysUntilDue <= 7) return { status: 'due_soon', color: 'yellow' }
    return { status: 'up_to_date', color: 'green' }
  }

  if (!isAdmin && !isManager) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to view vehicles.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Management</h1>
          <p className="text-gray-600">Manage your fleet vehicles</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Vehicle</DialogTitle>
              <DialogDescription>
                Enter the vehicle information below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault()
              handleAddVehicle(new FormData(e.currentTarget))
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registration_number">Registration Number *</Label>
                  <Input id="registration_number" name="registration_number" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input id="brand" name="brand" placeholder="e.g., Maruti, Hyundai" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" name="model" placeholder="e.g., Swift, i20" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" name="year" type="number" min="1990" max="2030" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input id="color" name="color" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue="available">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="out_of_service">Out of Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insurance_number">Insurance Number</Label>
                  <Input id="insurance_number" name="insurance_number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insurance_expiry">Insurance Expiry</Label>
                  <Input id="insurance_expiry" name="insurance_expiry" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rc_number">RC Number</Label>
                  <Input id="rc_number" name="rc_number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="permit_number">Permit Number</Label>
                  <Input id="permit_number" name="permit_number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchase_date">Purchase Date</Label>
                  <Input id="purchase_date" name="purchase_date" type="date" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Vehicle</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vehicles.filter(v => v.status === 'available').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <div className="h-2 w-2 bg-blue-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vehicles.filter(v => v.status === 'assigned').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <div className="h-2 w-2 bg-yellow-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vehicles.filter(v => v.status === 'maintenance').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search vehicles by registration, model, or brand..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Vehicles Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Vehicles</CardTitle>
          <CardDescription>
            Showing {filteredVehicles.length} of {vehicles.length} vehicles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Registration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Insurance</TableHead>
                <TableHead>Maintenance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.map((vehicle) => {
                const maintenanceStatus = getMaintenanceStatus(
                  vehicle.last_maintenance, 
                  vehicle.next_maintenance_due
                )
                
                return (
                  <TableRow key={vehicle.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {vehicle.brand} {vehicle.model}
                        </div>
                        <div className="text-sm text-gray-500">
                          {vehicle.year} • {vehicle.color}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">
                        {vehicle.registration_number}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{vehicle.insurance_number || 'N/A'}</div>
                        {vehicle.insurance_expiry && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            Expires: {new Date(vehicle.insurance_expiry).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Wrench className={`h-3 w-3 text-${maintenanceStatus.color}-500`} />
                        <span className={`text-xs text-${maintenanceStatus.color}-600 capitalize`}>
                          {maintenanceStatus.status.replace('_', ' ')}
                        </span>
                      </div>
                      {vehicle.next_maintenance_due && (
                        <div className="text-xs text-gray-500">
                          Due: {new Date(vehicle.next_maintenance_due).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog open={isViewDialogOpen && selectedVehicle?.id === vehicle.id} 
                                onOpenChange={(open) => {
                                  setIsViewDialogOpen(open)
                                  if (!open) setSelectedVehicle(null)
                                }}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedVehicle(vehicle)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Vehicle Details</DialogTitle>
                            </DialogHeader>
                            {selectedVehicle && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">Registration Number</Label>
                                    <p className="text-sm font-mono">{selectedVehicle.registration_number}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                                    <div>{getStatusBadge(selectedVehicle.status)}</div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">Brand</Label>
                                    <p className="text-sm">{selectedVehicle.brand || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">Model</Label>
                                    <p className="text-sm">{selectedVehicle.model || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">Year</Label>
                                    <p className="text-sm">{selectedVehicle.year || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">Color</Label>
                                    <p className="text-sm">{selectedVehicle.color || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">Insurance Number</Label>
                                    <p className="text-sm">{selectedVehicle.insurance_number || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">Insurance Expiry</Label>
                                    <p className="text-sm">
                                      {selectedVehicle.insurance_expiry 
                                        ? new Date(selectedVehicle.insurance_expiry).toLocaleDateString()
                                        : 'N/A'
                                      }
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">RC Number</Label>
                                    <p className="text-sm">{selectedVehicle.rc_number || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">Permit Number</Label>
                                    <p className="text-sm">{selectedVehicle.permit_number || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">Purchase Date</Label>
                                    <p className="text-sm">
                                      {selectedVehicle.purchase_date 
                                        ? new Date(selectedVehicle.purchase_date).toLocaleDateString()
                                        : 'N/A'
                                      }
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">Last Maintenance</Label>
                                    <p className="text-sm">
                                      {selectedVehicle.last_maintenance 
                                        ? new Date(selectedVehicle.last_maintenance).toLocaleDateString()
                                        : 'N/A'
                                      }
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {filteredVehicles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No vehicles found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
