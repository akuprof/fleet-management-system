'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/types/database'

type UserProfile = Database['public']['Tables']['user_profiles']['Row'] & {
  role: Database['public']['Tables']['roles']['Row']
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Fetch user profile with role
        const { data: profile } = await supabase
          .from('user_profiles')
          .select(`
            *,
            role:roles(*)
          `)
          .eq('user_id', user.id)
          .single()
        
        setProfile(profile as UserProfile)
      }
      
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select(`
            *,
            role:roles(*)
          `)
          .eq('user_id', session.user.id)
          .single()
        
        setProfile(profile as UserProfile)
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return {
    user,
    profile,
    loading,
    signOut,
    isAdmin: profile?.role?.name === 'admin',
    isManager: profile?.role?.name === 'manager',
    isDriver: profile?.role?.name === 'driver',
  }
}

