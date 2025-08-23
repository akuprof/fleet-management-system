'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, calculateCommissionBreakdown } from '@/lib/utils/payout'
import {
  CreditCard,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Calculator,
  Target,
  Activity
} from 'lucide-react'
import { Database } from '@/lib/types/database'

type Payout = Database['public']['Tables']['payouts']['Row']

export default function MyPayoutsPage() {
  const { profile, isDriver } = useAuth()
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [driverId, setDriverId] = useState<number | null>(null)
  const [dateFilter, setDateFilter] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (isDriver && profile?.username) {
      fetchDriverPayouts()
    } else {
      setLoading(false)
    }
  }, [isDriver, profile])

  const fetchDriverPayouts = async () => {
    try {
      // Get driver ID first
      const { data: driver } = await supabase
        .from('drivers')
        .select('id')
        .eq('phone', profile?.username)
        .single()

      if (!driver) {
        setLoading(false)
        return
      }

      setDriverId(driver.id)

      // Fetch payouts for this driver
      const { data: payoutsData, error } = await supabase
        .from('payouts')
        .select('*')
        .eq('driver_id', driver.id)
        .order('payout_date', { ascending: false })

      if (error) throw error
      setPayouts(payoutsData || [])
    } catch (error) {
      console.error('Error fetching payouts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPayouts = payouts.filter(payout => {
    const matchesDate = !dateFilter || payout.payout_date?.startsWith(dateFilter)
    return matchesDate
  })

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>
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
        return <Badge className="bg-red-100 text-red-800">Payment Failed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getPayoutStats = () => {
    const totalEarnings = payouts.reduce((sum, payout) => sum + (payout.net_payout || 0), 0)
    const paidAmount = payouts
      .filter(p => p.payment_status === 'paid')
      .reduce((sum, payout) => sum + (payout.net_payout || 0), 0)
    const pendingAmount = payouts
      .filter(p => p.approval_status === 'pending')
      .reduce((sum, payout) => sum + (payout.net_payout || 0), 0)
    const approvedAmount = payouts
      .filter(p => p.approval_status === 'approved' && p.payment_status !== 'paid')
      .reduce((sum, payout) => sum + (payout.net_payout || 0), 0)
    
    const thisMonthPayouts = payouts.filter(p => {
      if (!p.payout_date) return false
      const payoutDate = new Date(p.payout_date)
      const now = new Date()
      return payoutDate.getMonth() === now.getMonth() && payoutDate.getFullYear() === now.getFullYear()
    })
    const thisMonthEarnings = thisMonthPayouts.reduce((sum, payout) => sum + (payout.net_payout || 0), 0)

    return {
      totalEarnings,
      paidAmount,
      pendingAmount,
      approvedAmount,
      thisMonthEarnings,
      totalPayouts: payouts.length
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

  const stats = getPayoutStats()

  return (
    <div className="space-y-6 max-w-md mx-auto lg:max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Payouts</h1>
        <p className="text-gray-600">Track your earnings and payment history</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">{stats.totalPayouts} payouts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.paidAmount)}</div>
            <p className="text-xs text-muted-foreground">Received</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.thisMonthEarnings)}</div>
            <p className="text-xs text-muted-foreground">Current month</p>
          </CardContent>
        </Card>
      </div>

      {/* Payout Formula Explanation */}
      <Card className="border-blue-100 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Calculator className="h-5 w-5" />
            How Your Payout is Calculated
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-700">
            <div className="flex items-center justify-between">
              <span>First ₹2,250 of revenue:</span>
              <span className="font-medium">30% commission</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Revenue above ₹2,250:</span>
              <span className="font-medium">70% commission</span>
            </div>
            <div className="pt-2 border-t border-blue-200">
              <p className="text-xs">
                <Target className="h-3 w-3 inline mr-1" />
                Achieve your daily target of ₹2,250 to unlock higher commission rates!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex gap-4">
        <div className="w-48">
          <Input
            type="month"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            placeholder="Filter by month"
          />
        </div>
      </div>

      {/* Payouts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>
            Your complete earnings history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPayouts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Payout</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayouts.map((payout) => {
                  const breakdown = calculateCommissionBreakdown(payout.revenue_amount || 0)
                  
                  return (
                    <TableRow key={payout.id}>
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
                          {payout.revenue_amount && payout.revenue_amount > 2250 && (
                            <div className="text-xs text-green-600">
                              Target exceeded!
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">
                            Base: {formatCurrency(breakdown.baseAmount)}
                          </div>
                          {breakdown.incentiveAmount > 0 && (
                            <div className="text-xs text-green-600">
                              Incentive: {formatCurrency(breakdown.incentiveAmount)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {payout.deduction_amount ? 
                          <span className="text-red-600">-{formatCurrency(payout.deduction_amount)}</span> 
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-green-600">
                          {formatCurrency(payout.net_payout || 0)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(payout.approval_status)}</TableCell>
                      <TableCell>{getPaymentStatusBadge(payout.payment_status)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payouts found</p>
              <p className="text-sm text-gray-400 mt-2">
                Complete trips to start earning payouts
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Earnings Insights */}
      {payouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Earnings Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Average Payout</p>
                <p className="text-xl font-bold">
                  {formatCurrency(stats.totalEarnings / stats.totalPayouts)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Best Month</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(Math.max(...payouts.map(p => p.net_payout || 0)))}
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <TrendingUp className="h-4 w-4 inline mr-1" />
                Keep completing trips to increase your earnings! Target ₹2,250 daily for maximum commission.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
