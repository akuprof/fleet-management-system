'use client'

import { useAuth } from '@/lib/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'manager' | 'driver'
  fallback?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallback 
}: ProtectedRouteProps) {
  const { user, profile, loading, isAdmin, isManager, isDriver } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
        return
      }

      if (requiredRole) {
        const hasRole = 
          (requiredRole === 'admin' && isAdmin) ||
          (requiredRole === 'manager' && isManager) ||
          (requiredRole === 'driver' && isDriver)

        if (!hasRole) {
          router.push('/dashboard')
          return
        }
      }
    }
  }, [user, loading, requiredRole, isAdmin, isManager, isDriver, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return fallback || null
  }

  if (requiredRole) {
    const hasRole = 
      (requiredRole === 'admin' && isAdmin) ||
      (requiredRole === 'manager' && isManager) ||
      (requiredRole === 'driver' && isDriver)

    if (!hasRole) {
      return fallback || null
    }
  }

  return <>{children}</>
}
