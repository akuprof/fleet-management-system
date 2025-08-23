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
  Users,
  Plus,
  Search,
  Edit,
  Eye,
  Phone,
  Mail,
  Calendar,
  MapPin,
  AlertCircle
} from 'lucide-react'
import { Database } from '@/lib/types/database'

type Driver = Database['public']['Tables']['drivers']['Row']

export default function DriversPage() {
  const { profile, isAdmin, isManager } = useAuth()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (isAdmin || isManager) {
      fetchDrivers()
    } else {
      setLoading(false)
    }
  }, [isAdmin, isManager])

  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          *,
          user_profile:profile_id (
            full_name,
            phone,
            user_id
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDrivers(data || [])
    } catch (error) {
      console.error('Error fetching drivers:', error)
      toast.error('Failed to load drivers')
    } finally {
      setLoading(false)
    }
  }

  const handleAddDriver = async (formData: FormData) => {
    try {
      const driverData = {
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        email: formData.get('email') as string,
        license_number: formData.get('license_number') as string,
        license_expiry: formData.get('license_expiry') as string,
        address: formData.get('address') as string,
        join_date: formData.get('join_date') as string,
        status: formData.get('status') as string,
        emergency_contact: formData.get('emergency_contact') as string,
      }

      const { error } = await supabase
        .from('drivers')
        .insert(driverData)

      if (error) throw error

      toast.success('Driver added successfully!')
      setIsAddDialogOpen(false)
      fetchDrivers()
    } catch (error) {
      console.error('Error adding driver:', error)
      toast.error('Failed to add driver')
    }
  }

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
      case 'suspended':
        return <Badge className="bg-yellow-100 text-yellow-800">Suspended</Badge>
      case 'terminated':
        return <Badge className="bg-red-100 text-red-800">Terminated</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  if (!isAdmin && !isManager) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to view drivers.</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Drivers Management</h1>
          <p className="text-gray-600">Manage your fleet drivers</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Driver
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Driver</DialogTitle>
              <DialogDescription>
                Enter the driver's information below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault()
              handleAddDriver(new FormData(e.currentTarget))
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" type="tel" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license_number">License Number</Label>
                  <Input id="license_number" name="license_number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license_expiry">License Expiry</Label>
                  <Input id="license_expiry" name="license_expiry" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="join_date">Join Date</Label>
                  <Input id="join_date" name="join_date" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue="active">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact">Emergency Contact</Label>
                  <Input id="emergency_contact" name="emergency_contact" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" name="address" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Driver</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drivers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {drivers.filter(d => d.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <div className="h-2 w-2 bg-gray-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {drivers.filter(d => d.status === 'inactive').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <div className="h-2 w-2 bg-yellow-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {drivers.filter(d => d.status === 'suspended').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search drivers by name, phone, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Drivers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Drivers</CardTitle>
          <CardDescription>
            Showing {filteredDrivers.length} of {drivers.length} drivers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>License</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDrivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{driver.name}</div>
                      {driver.email && (
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {driver.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {driver.phone && (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" />
                        {driver.phone}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">{driver.license_number || 'N/A'}</div>
                      {driver.license_expiry && (
                        <div className="text-xs text-gray-500">
                          Expires: {new Date(driver.license_expiry).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(driver.status)}</TableCell>
                  <TableCell>
                    {driver.join_date ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {new Date(driver.join_date).toLocaleDateString()}
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog open={isViewDialogOpen && selectedDriver?.id === driver.id} 
                              onOpenChange={(open) => {
                                setIsViewDialogOpen(open)
                                if (!open) setSelectedDriver(null)
                              }}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedDriver(driver)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Driver Details</DialogTitle>
                          </DialogHeader>
                          {selectedDriver && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Name</Label>
                                  <p className="text-sm">{selectedDriver.name}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Phone</Label>
                                  <p className="text-sm">{selectedDriver.phone || 'N/A'}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                                  <p className="text-sm">{selectedDriver.email || 'N/A'}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                                  <div>{getStatusBadge(selectedDriver.status)}</div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">License Number</Label>
                                  <p className="text-sm">{selectedDriver.license_number || 'N/A'}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">License Expiry</Label>
                                  <p className="text-sm">
                                    {selectedDriver.license_expiry 
                                      ? new Date(selectedDriver.license_expiry).toLocaleDateString()
                                      : 'N/A'
                                    }
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Join Date</Label>
                                  <p className="text-sm">
                                    {selectedDriver.join_date 
                                      ? new Date(selectedDriver.join_date).toLocaleDateString()
                                      : 'N/A'
                                    }
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Emergency Contact</Label>
                                  <p className="text-sm">{selectedDriver.emergency_contact || 'N/A'}</p>
                                </div>
                              </div>
                              {selectedDriver.address && (
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Address</Label>
                                  <p className="text-sm">{selectedDriver.address}</p>
                                </div>
                              )}
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
              ))}
            </TableBody>
          </Table>
          {filteredDrivers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No drivers found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}