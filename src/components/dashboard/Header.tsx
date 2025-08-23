'use client'

import { User } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

type UserProfile = Database['public']['Tables']['user_profiles']['Row'] & {
  role: Database['public']['Tables']['roles']['Row']
}

interface HeaderProps {
  user: User
  profile: UserProfile
}

export function Header({ user, profile }: HeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'manager':
        return 'bg-blue-100 text-blue-800'
      case 'driver':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome back, {profile.username || user.email?.split('@')[0]}!
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>

            {/* User Profile */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {profile.username || user.email?.split('@')[0]}
                </p>
                <Badge
                  variant="secondary"
                  className={getRoleBadgeColor(profile.role?.name || '')}
                >
                  {profile.role?.name || 'No Role'}
                </Badge>
              </div>
              <Avatar>
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback>
                  {getInitials(profile.username || user.email?.split('@')[0] || 'U')}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

