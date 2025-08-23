'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/types/database'

type UserProfile = Database['public']['Tables']['user_profiles']['Row'] & {
  role: Database['public']['Tables']['roles']['Row']
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  isAdmin: boolean
  isManager: boolean
  isDriver: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    // Only create Supabase client on the client side
    if (typeof window !== 'undefined') {
      setSupabase(createClient())
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    if (!supabase) return
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select(`
        *,
        role:roles(*)
      `)
      .eq('user_id', userId)
      .single()
    
    setProfile(profile as UserProfile)
  }

  const refreshProfile = async () => {
    if (user && supabase) {
      await fetchProfile(user.id)
    }
  }

  useEffect(() => {
    if (!supabase) return

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        await fetchProfile(user.id)
      }
      
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
  }

  const value = {
    user,
    profile,
    loading,
    signOut,
    isAdmin: profile?.role?.name === 'admin',
    isManager: profile?.role?.name === 'manager',
    isDriver: profile?.role?.name === 'driver',
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
