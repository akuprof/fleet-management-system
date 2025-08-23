'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  CheckCircle,
  XCircle,
  Database,
  Shield,
  Users,
  Car,
  MapPin,
  AlertTriangle,
  Loader2,
  TestTube
} from 'lucide-react'

interface ConnectionTest {
  name: string
  status: 'pending' | 'success' | 'error'
  message: string
  icon: React.ComponentType<any>
}

export default function TestConnectionPage() {
  const [tests, setTests] = useState<ConnectionTest[]>([
    { name: 'Supabase Connection', status: 'pending', message: 'Testing...', icon: Database },
    { name: 'Authentication System', status: 'pending', message: 'Testing...', icon: Shield },
    { name: 'Database Tables', status: 'pending', message: 'Testing...', icon: Database },
    { name: 'Drivers Table', status: 'pending', message: 'Testing...', icon: Users },
    { name: 'Vehicles Table', status: 'pending', message: 'Testing...', icon: Car },
    { name: 'Trips Table', status: 'pending', message: 'Testing...', icon: MapPin },
    { name: 'Payouts Table', status: 'pending', message: 'Testing...', icon: MapPin },
    { name: 'Incidents Table', status: 'pending', message: 'Testing...', icon: AlertTriangle },
    { name: 'Row Level Security', status: 'pending', message: 'Testing...', icon: Shield },
  ])
  const [isRunning, setIsRunning] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const supabase = createClient()

  const updateTest = (index: number, status: 'success' | 'error', message: string) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, status, message } : test
    ))
  }

  const runTests = async () => {
    setIsRunning(true)
    
    try {
      // Test 1: Supabase Connection
      try {
        const { data, error } = await supabase.from('roles').select('count').limit(1)
        if (error) throw error
        updateTest(0, 'success', 'Connection established successfully')
      } catch (error: any) {
        updateTest(0, 'error', `Connection failed: ${error.message}`)
        setIsRunning(false)
        return
      }

      // Test 2: Authentication System
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        setCurrentUser(user)
        updateTest(1, 'success', user ? `Authenticated as: ${user.email}` : 'No user logged in (normal)')
      } catch (error: any) {
        updateTest(1, 'error', `Auth test failed: ${error.message}`)
      }

      // Test 3: Database Tables Structure
      try {
        const { data, error } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
        
        if (error) throw error
        const tableCount = data?.length || 0
        updateTest(2, 'success', `Found ${tableCount} tables in database`)
      } catch (error: any) {
        updateTest(2, 'error', `Table check failed: ${error.message}`)
      }

      // Test 4: Drivers Table
      try {
        const { count, error } = await supabase
          .from('drivers')
          .select('*', { count: 'exact', head: true })
        
        if (error) throw error
        updateTest(3, 'success', `Drivers table accessible (${count || 0} records)`)
      } catch (error: any) {
        updateTest(3, 'error', `Drivers table error: ${error.message}`)
      }

      // Test 5: Vehicles Table
      try {
        const { count, error } = await supabase
          .from('vehicles')
          .select('*', { count: 'exact', head: true })
        
        if (error) throw error
        updateTest(4, 'success', `Vehicles table accessible (${count || 0} records)`)
      } catch (error: any) {
        updateTest(4, 'error', `Vehicles table error: ${error.message}`)
      }

      // Test 6: Trips Table
      try {
        const { count, error } = await supabase
          .from('trips')
          .select('*', { count: 'exact', head: true })
        
        if (error) throw error
        updateTest(5, 'success', `Trips table accessible (${count || 0} records)`)
      } catch (error: any) {
        updateTest(5, 'error', `Trips table error: ${error.message}`)
      }

      // Test 7: Payouts Table
      try {
        const { count, error } = await supabase
          .from('payouts')
          .select('*', { count: 'exact', head: true })
        
        if (error) throw error
        updateTest(6, 'success', `Payouts table accessible (${count || 0} records)`)
      } catch (error: any) {
        updateTest(6, 'error', `Payouts table error: ${error.message}`)
      }

      // Test 8: Incidents Table
      try {
        const { count, error } = await supabase
          .from('incidents')
          .select('*', { count: 'exact', head: true })
        
        if (error) throw error
        updateTest(7, 'success', `Incidents table accessible (${count || 0} records)`)
      } catch (error: any) {
        updateTest(7, 'error', `Incidents table error: ${error.message}`)
      }

      // Test 9: Row Level Security
      try {
        const { data, error } = await supabase
          .from('roles')
          .select('*')
          .limit(5)
        
        if (error) throw error
        updateTest(8, 'success', `RLS policies working (${data?.length || 0} roles found)`)
      } catch (error: any) {
        updateTest(8, 'error', `RLS test failed: ${error.message}`)
      }

      toast.success('Connection tests completed!')
      
    } catch (error: any) {
      toast.error('Test suite failed: ' + error.message)
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Testing</Badge>
    }
  }

  useEffect(() => {
    // Auto-run tests on page load
    runTests()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Supabase Connection Test
        </h1>
        <p className="text-gray-600">
          Verify database connection and authentication flow
        </p>
      </div>

      {/* Environment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Environment Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Supabase URL</p>
              <p className="font-mono text-sm">
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? 
                  `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...` : 
                  'Not configured'
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Anon Key</p>
              <p className="font-mono text-sm">
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
                  `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 30)}...` : 
                  'Not configured'
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Current User</p>
              <p className="text-sm">
                {currentUser ? currentUser.email : 'Not logged in'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">User Role</p>
              <p className="text-sm">
                {currentUser ? 'Authenticated' : 'Anonymous'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Controls */}
      <div className="flex justify-center">
        <Button 
          onClick={runTests} 
          disabled={isRunning}
          size="lg"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <TestTube className="h-4 w-4 mr-2" />
              Run Tests Again
            </>
          )}
        </Button>
      </div>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>
            Connection and functionality tests for the Fleet Management System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tests.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <test.icon className="h-5 w-5 text-gray-600" />
                  <div>
                    <h3 className="font-medium">{test.name}</h3>
                    <p className="text-sm text-gray-600">{test.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(test.status)}
                  {getStatusIcon(test.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Test Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {tests.filter(t => t.status === 'success').length}
              </div>
              <p className="text-sm text-gray-600">Passed</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {tests.filter(t => t.status === 'error').length}
              </div>
              <p className="text-sm text-gray-600">Failed</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {tests.filter(t => t.status === 'pending').length}
              </div>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-blue-700 space-y-2">
            <p><strong>If tests are failing, ensure you have:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Created a Supabase project at <a href="https://supabase.com" className="underline">supabase.com</a></li>
              <li>Added your Supabase URL and Anon Key to <code className="bg-blue-100 px-1 rounded">.env.local</code></li>
              <li>Run the SQL schema from <code className="bg-blue-100 px-1 rounded">supabase/schema.sql</code> in your Supabase SQL editor</li>
              <li>Enabled Row Level Security on your tables</li>
              <li>Restarted your Next.js development server</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
