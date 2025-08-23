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
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils/payout'
import {
  AlertTriangle,
  Plus,
  Search,
  Eye,
  Edit,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Shield,
  FileText,
  Car,
  Users,
  Camera,
  AlertCircle
} from 'lucide-react'
import { Database } from '@/lib/types/database'

type Incident = Database['public']['Tables']['incidents']['Row'] & {
  driver?: { name: string, phone: string | null }
  vehicle?: { registration_number: string, model: string | null, brand: string | null }
}

type Driver = Database['public']['Tables']['drivers']['Row']
type Vehicle = Database['public']['Tables']['vehicles']['Row']

export default function IncidentsPage() {
  const { profile, isAdmin, isManager, isDriver } = useAuth()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchIncidents()
    if (isAdmin || isManager) {
      fetchDriversAndVehicles()
    }
  }, [isAdmin, isManager, isDriver])

  const fetchIncidents = async () => {
    try {
      let query = supabase
        .from('incidents')
        .select(`
          *,
          driver:drivers(name, phone),
          vehicle:vehicles(registration_number, model, brand)
        `)
        .order('created_at', { ascending: false })

      // If driver, only show their incidents
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
      setIncidents(data || [])
    } catch (error) {
      console.error('Error fetching incidents:', error)
      toast.error('Failed to load incidents')
    } finally {
      setLoading(false)
    }
  }

  const fetchDriversAndVehicles = async () => {
    try {
      const [driversResult, vehiclesResult] = await Promise.all([
        supabase.from('drivers').select('*').eq('status', 'active'),
        supabase.from('vehicles').select('*')
      ])

      setDrivers(driversResult.data || [])
      setVehicles(vehiclesResult.data || [])
    } catch (error) {
      console.error('Error fetching drivers and vehicles:', error)
    }
  }

  const handleAddIncident = async (formData: FormData) => {
    try {
      const incidentData = {
        driver_id: parseInt(formData.get('driver_id') as string) || null,
        vehicle_id: parseInt(formData.get('vehicle_id') as string) || null,
        incident_date: formData.get('incident_date') as string,
        incident_time: formData.get('incident_time') as string,
        location: formData.get('location') as string,
        incident_type: formData.get('incident_type') as string,
        severity: formData.get('severity') as string,
        description: formData.get('description') as string,
        is_negligence: formData.get('is_negligence') === 'on',
        company_liable: formData.get('company_liable') === 'on',
        estimated_cost: parseFloat(formData.get('estimated_cost') as string) || null,
        status: 'open',
        reported_by: profile?.user_id,
        police_report_number: formData.get('police_report_number') as string,
        insurance_claim_number: formData.get('insurance_claim_number') as string,
      }

      const { error } = await supabase
        .from('incidents')
        .insert(incidentData)

      if (error) throw error

      toast.success('Incident reported successfully!')
      setIsAddDialogOpen(false)
      fetchIncidents()
    } catch (error) {
      console.error('Error reporting incident:', error)
      toast.error('Failed to report incident')
    }
  }

  const handleUpdateStatus = async (incidentId: number, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('incidents')
        .update({ status: newStatus })
        .eq('id', incidentId)

      if (error) throw error

      toast.success('Incident status updated!')
      fetchIncidents()
    } catch (error) {
      console.error('Error updating incident status:', error)
      toast.error('Failed to update status')
    }
  }

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = 
      incident.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.incident_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.vehicle?.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.police_report_number?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = !statusFilter || incident.status === statusFilter
    const matchesSeverity = !severityFilter || incident.severity === severityFilter

    return matchesSearch && matchesStatus && matchesSeverity
  })

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-red-100 text-red-800">Open</Badge>
      case 'investigating':
        return <Badge className="bg-yellow-100 text-yellow-800">Investigating</Badge>
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  const getSeverityBadge = (severity: string | null) => {
    switch (severity) {
      case 'minor':
        return <Badge variant="outline" className="text-green-600">Minor</Badge>
      case 'moderate':
        return <Badge variant="outline" className="text-yellow-600">Moderate</Badge>
      case 'severe':
        return <Badge variant="outline" className="text-red-600">Severe</Badge>
      case 'critical':
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getIncidentStats = () => {
    const openIncidents = incidents.filter(i => i.status === 'open').length
    const totalCost = incidents.reduce((sum, incident) => sum + (incident.estimated_cost || 0), 0)
    const negligenceIncidents = incidents.filter(i => i.is_negligence).length
    const thisMonthIncidents = incidents.filter(i => {
      const incidentDate = new Date(i.incident_date || '')
      const now = new Date()
      return incidentDate.getMonth() === now.getMonth() && incidentDate.getFullYear() === now.getFullYear()
    }).length

    return {
      total: incidents.length,
      open: openIncidents,
      totalCost,
      negligence: negligenceIncidents,
      thisMonth: thisMonthIncidents
    }
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

  const stats = getIncidentStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isDriver ? 'My Incidents' : 'Incident Management'}
          </h1>
          <p className="text-gray-600">
            {isDriver ? 'Report and track your incidents' : 'Monitor and manage fleet incidents'}
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Report Incident
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Report New Incident</DialogTitle>
              <DialogDescription>
                Provide detailed information about the incident.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault()
              handleAddIncident(new FormData(e.currentTarget))
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {(isAdmin || isManager) && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="driver_id">Driver</Label>
                      <Select name="driver_id">
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
                      <Label htmlFor="vehicle_id">Vehicle</Label>
                      <Select name="vehicle_id">
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
                  <Label htmlFor="incident_date">Incident Date *</Label>
                  <Input id="incident_date" name="incident_date" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incident_time">Incident Time *</Label>
                  <Input id="incident_time" name="incident_time" type="time" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incident_type">Incident Type *</Label>
                  <Select name="incident_type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accident">Accident</SelectItem>
                      <SelectItem value="breakdown">Breakdown</SelectItem>
                      <SelectItem value="theft">Theft</SelectItem>
                      <SelectItem value="vandalism">Vandalism</SelectItem>
                      <SelectItem value="traffic_violation">Traffic Violation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="severity">Severity *</Label>
                  <Select name="severity" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated_cost">Estimated Cost (₹)</Label>
                  <Input 
                    id="estimated_cost" 
                    name="estimated_cost" 
                    type="number" 
                    step="0.01" 
                    min="0" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="police_report_number">Police Report Number</Label>
                  <Input id="police_report_number" name="police_report_number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insurance_claim_number">Insurance Claim Number</Label>
                  <Input id="insurance_claim_number" name="insurance_claim_number" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input id="location" name="location" required placeholder="Incident location" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  required 
                  placeholder="Detailed description of the incident"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch id="is_negligence" name="is_negligence" />
                  <Label htmlFor="is_negligence">Driver Negligence</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="company_liable" name="company_liable" />
                  <Label htmlFor="company_liable">Company Liable</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Report Incident</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{stats.thisMonth} this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Cases</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.open}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalCost)}</div>
            <p className="text-xs text-muted-foreground">Total estimated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negligence Cases</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.negligence}</div>
            <p className="text-xs text-muted-foreground">Driver fault</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search incidents by location, type, driver, or vehicle..."
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
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Severities</SelectItem>
            <SelectItem value="minor">Minor</SelectItem>
            <SelectItem value="moderate">Moderate</SelectItem>
            <SelectItem value="severe">Severe</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Incidents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Incident Records</CardTitle>
          <CardDescription>
            Showing {filteredIncidents.length} of {incidents.length} incidents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Incident Details</TableHead>
                {!isDriver && <TableHead>Driver & Vehicle</TableHead>}
                <TableHead>Date & Time</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIncidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {incident.incident_type?.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {incident.location}
                      </div>
                      {incident.police_report_number && (
                        <div className="text-xs text-blue-600">
                          Police: {incident.police_report_number}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  {!isDriver && (
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {incident.driver?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Car className="h-3 w-3" />
                          {incident.vehicle?.registration_number || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <div>
                      <div className="text-sm flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {incident.incident_date ? 
                          new Date(incident.incident_date).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {incident.incident_time || 'N/A'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {getSeverityBadge(incident.severity)}
                      {incident.is_negligence && (
                        <div className="text-xs text-red-600">Negligence</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {incident.estimated_cost ? 
                      formatCurrency(incident.estimated_cost) : 'N/A'}
                  </TableCell>
                  <TableCell>{getStatusBadge(incident.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog open={isViewDialogOpen && selectedIncident?.id === incident.id} 
                              onOpenChange={(open) => {
                                setIsViewDialogOpen(open)
                                if (!open) setSelectedIncident(null)
                              }}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedIncident(incident)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Incident Details</DialogTitle>
                          </DialogHeader>
                          {selectedIncident && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Incident Type</Label>
                                  <p className="text-sm">{selectedIncident.incident_type?.replace('_', ' ')}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Severity</Label>
                                  <div>{getSeverityBadge(selectedIncident.severity)}</div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Date</Label>
                                  <p className="text-sm">
                                    {selectedIncident.incident_date ? 
                                      new Date(selectedIncident.incident_date).toLocaleDateString() : 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Time</Label>
                                  <p className="text-sm">{selectedIncident.incident_time || 'N/A'}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Location</Label>
                                  <p className="text-sm">{selectedIncident.location}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                                  <div>{getStatusBadge(selectedIncident.status)}</div>
                                </div>
                                {!isDriver && (
                                  <>
                                    <div>
                                      <Label className="text-sm font-medium text-gray-500">Driver</Label>
                                      <p className="text-sm">{selectedIncident.driver?.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium text-gray-500">Vehicle</Label>
                                      <p className="text-sm">
                                        {selectedIncident.vehicle?.registration_number || 'N/A'}
                                        {selectedIncident.vehicle?.brand && selectedIncident.vehicle?.model && 
                                          ` (${selectedIncident.vehicle.brand} ${selectedIncident.vehicle.model})`
                                        }
                                      </p>
                                    </div>
                                  </>
                                )}
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Estimated Cost</Label>
                                  <p className="text-sm">
                                    {selectedIncident.estimated_cost ? 
                                      formatCurrency(selectedIncident.estimated_cost) : 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Police Report</Label>
                                  <p className="text-sm">{selectedIncident.police_report_number || 'N/A'}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Insurance Claim</Label>
                                  <p className="text-sm">{selectedIncident.insurance_claim_number || 'N/A'}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Driver Negligence</Label>
                                  <p className="text-sm">{selectedIncident.is_negligence ? 'Yes' : 'No'}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Company Liable</Label>
                                  <p className="text-sm">{selectedIncident.company_liable ? 'Yes' : 'No'}</p>
                                </div>
                              </div>
                              {selectedIncident.description && (
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Description</Label>
                                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded">
                                    {selectedIncident.description}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {(isAdmin || isManager) && incident.status === 'open' && (
                        <Select 
                          value={incident.status || ''} 
                          onValueChange={(value) => handleUpdateStatus(incident.id, value)}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="investigating">Investigating</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredIncidents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No incidents found</p>
              <Button className="mt-4" variant="outline" onClick={() => setIsAddDialogOpen(true)}>
                Report First Incident
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
