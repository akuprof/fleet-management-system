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
import { formatCurrency, calculatePayout } from '@/lib/utils/payout'
import {
  CreditCard,
  Plus,
  Search,
  Eye,
  Check,
  X,
  Clock,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Users,
  Calendar,
  Calculator
} from 'lucide-react'
import { Database } from '@/lib/types/database'

type Payout = Database['public']['Tables']['payouts']['Row'] & {
  driver?: { name: string, phone: string | null }
}

type Driver = Database['public']['Tables']['drivers']['Row']

export default function PayoutsPage() {
  const { profile, isAdmin, isManager } = useAuth()
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (isAdmin || isManager) {
      fetchPayouts()
      fetchDrivers()
    } else {
      setLoading(false)
    }
  }, [isAdmin, isManager])

  const fetchPayouts = async () => {
    try {
      const { data, error } = await supabase
        .from('payouts')
        .select(`
          *,
          driver:drivers(name, phone)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPayouts(data || [])
    } catch (error) {
      console.error('Error fetching payouts:', error)
      toast.error('Failed to load payouts')
    } finally {
      setLoading(false)
    }
  }

  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setDrivers(data || [])
    } catch (error) {
      console.error('Error fetching drivers:', error)
    }
  }

  const handleGeneratePayout = async (formData: FormData) => {
    try {
      const driverId = parseInt(formData.get('driver_id') as string)
      const payoutDate = formData.get('payout_date') as string
      
      // Calculate payout based on trips for the selected date
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select('fare_amount, platform_commission')
        .eq('driver_id', driverId)
        .gte('trip_start_time', `${payoutDate}T00:00:00`)
        .lt('trip_start_time', `${payoutDate}T23:59:59`)
        .eq('trip_status', 'completed')

      if (tripsError) throw tripsError

      const totalRevenue = trips?.reduce((sum, trip) => sum + (trip.fare_amount || 0), 0) || 0
      const totalCommission = trips?.reduce((sum, trip) => sum + (trip.platform_commission || 0), 0) || 0
      
      const calculatedPayout = calculatePayout(totalRevenue)
      
      // Check for any deductions
      const { data: deductions, error: deductionsError } = await supabase
        .from('deductions')
        .select('amount')
        .eq('driver_id', driverId)
        .eq('status', 'approved')
        .is('applied_to_payout_id', null)

      if (deductionsError) throw deductionsError

      const totalDeductions = deductions?.reduce((sum, deduction) => sum + (deduction.amount || 0), 0) || 0
      const netPayout = Math.max(calculatedPayout - totalDeductions, 0)

      const payoutData = {
        driver_id: driverId,
        payout_date: payoutDate,
        revenue_amount: totalRevenue,
        commission_amount: totalCommission,
        incentive_amount: calculatedPayout - Math.min(totalRevenue, 2250) * 0.30,
        deduction_amount: totalDeductions,
        net_payout: netPayout,
        approval_status: 'pending',
        payment_status: 'pending'
      }

      const { error } = await supabase
        .from('payouts')
        .insert(payoutData)

      if (error) throw error

      toast.success('Payout generated successfully!')
      setIsAddDialogOpen(false)
      fetchPayouts()
    } catch (error) {
      console.error('Error generating payout:', error)
      toast.error('Failed to generate payout')
    }
  }

  const handleApproveReject = async (payoutId: number, action: 'approved' | 'rejected') => {
    try {
      const updateData: any = {
        approval_status: action,
        approved_by: profile?.user_id,
        approved_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('payouts')
        .update(updateData)
        .eq('id', payoutId)

      if (error) throw error

      toast.success(`Payout ${action} successfully!`)
      fetchPayouts()
    } catch (error) {
      console.error(`Error ${action} payout:`, error)
      toast.error(`Failed to ${action} payout`)
    }
  }

  const filteredPayouts = payouts.filter(payout => {
    const matchesSearch = 
      payout.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.driver?.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.id.toString().includes(searchTerm)

    const matchesStatus = !statusFilter || payout.approval_status === statusFilter
    const matchesDate = !dateFilter || payout.payout_date === dateFilter

    return matchesSearch && matchesStatus && matchesDate
  })

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600">Payment Pending</Badge>
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getPayoutStats = () => {
    const totalPayouts = payouts.reduce((sum, payout) => sum + (payout.net_payout || 0), 0)
    const pendingPayouts = payouts.filter(p => p.approval_status === 'pending').length
    const approvedPayouts = payouts.filter(p => p.approval_status === 'approved').length
    const paidAmount = payouts
      .filter(p => p.payment_status === 'paid')
      .reduce((sum, payout) => sum + (payout.net_payout || 0), 0)

    return {
      totalPayouts,
      pendingPayouts,
      approvedPayouts,
      paidAmount,
      totalCount: payouts.length
    }
  }

  if (!isAdmin && !isManager) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to manage payouts.</p>
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

  const stats = getPayoutStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payout Management</h1>
          <p className="text-gray-600">Manage driver payouts and approvals</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate Payout
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Generate New Payout</DialogTitle>
              <DialogDescription>
                Calculate and generate payout for a driver based on their trips.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault()
              handleGeneratePayout(new FormData(e.currentTarget))
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
                <Label htmlFor="payout_date">Payout Date *</Label>
                <Input 
                  id="payout_date" 
                  name="payout_date" 
                  type="date" 
                  required 
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700">
                  <Calculator className="h-4 w-4 inline mr-1" />
                  Payout will be calculated automatically based on trips for the selected date.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Generate Payout</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPayouts)}</div>
            <p className="text-xs text-muted-foreground">{stats.totalCount} records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayouts}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedPayouts}</div>
            <p className="text-xs text-muted-foreground">Ready for payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.paidAmount)}</div>
            <p className="text-xs text-muted-foreground">Completed payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by driver name, phone, or payout ID..."
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Payouts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Records</CardTitle>
          <CardDescription>
            Showing {filteredPayouts.length} of {payouts.length} payouts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Payout</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{payout.driver?.name}</div>
                      <div className="text-sm text-gray-500">{payout.driver?.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {payout.payout_date ? 
                        new Date(payout.payout_date).toLocaleDateString() : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {formatCurrency(payout.revenue_amount || 0)}
                      </div>
                      {payout.commission_amount && (
                        <div className="text-xs text-gray-500">
                          Commission: {formatCurrency(payout.commission_amount)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {payout.deduction_amount ? 
                      formatCurrency(payout.deduction_amount) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-green-600">
                      {formatCurrency(payout.net_payout || 0)}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(payout.approval_status)}</TableCell>
                  <TableCell>{getPaymentStatusBadge(payout.payment_status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog open={isViewDialogOpen && selectedPayout?.id === payout.id} 
                              onOpenChange={(open) => {
                                setIsViewDialogOpen(open)
                                if (!open) setSelectedPayout(null)
                              }}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedPayout(payout)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Payout Details</DialogTitle>
                          </DialogHeader>
                          {selectedPayout && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Driver</Label>
                                  <p className="text-sm">{selectedPayout.driver?.name}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Payout Date</Label>
                                  <p className="text-sm">
                                    {selectedPayout.payout_date ? 
                                      new Date(selectedPayout.payout_date).toLocaleDateString() : 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Revenue Amount</Label>
                                  <p className="text-sm">{formatCurrency(selectedPayout.revenue_amount || 0)}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Commission</Label>
                                  <p className="text-sm">{formatCurrency(selectedPayout.commission_amount || 0)}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Incentive</Label>
                                  <p className="text-sm">{formatCurrency(selectedPayout.incentive_amount || 0)}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Deductions</Label>
                                  <p className="text-sm">{formatCurrency(selectedPayout.deduction_amount || 0)}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Net Payout</Label>
                                  <p className="text-sm font-medium text-green-600">
                                    {formatCurrency(selectedPayout.net_payout || 0)}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                                  <div>{getStatusBadge(selectedPayout.approval_status)}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {payout.approval_status === 'pending' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => handleApproveReject(payout.id, 'approved')}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleApproveReject(payout.id, 'rejected')}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredPayouts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payouts found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
