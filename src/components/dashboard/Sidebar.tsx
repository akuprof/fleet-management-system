'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Car,
  Route,
  Calendar,
  MapPin,
  CreditCard,
  AlertTriangle,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  userRole?: string
}

const adminNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Drivers', href: '/dashboard/drivers', icon: Users },
  { name: 'Vehicles', href: '/dashboard/vehicles', icon: Car },
  { name: 'Assignments', href: '/dashboard/assignments', icon: Route },
  { name: 'Shifts', href: '/dashboard/shifts', icon: Calendar },
  { name: 'Trips', href: '/dashboard/trips', icon: MapPin },
  { name: 'Payouts', href: '/dashboard/payouts', icon: CreditCard },
  { name: 'Incidents', href: '/dashboard/incidents', icon: AlertTriangle },
  { name: 'Documents', href: '/dashboard/documents', icon: FileText },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

const managerNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Drivers', href: '/dashboard/drivers', icon: Users },
  { name: 'Vehicles', href: '/dashboard/vehicles', icon: Car },
  { name: 'Assignments', href: '/dashboard/assignments', icon: Route },
  { name: 'Shifts', href: '/dashboard/shifts', icon: Calendar },
  { name: 'Trips', href: '/dashboard/trips', icon: MapPin },
  { name: 'Payouts', href: '/dashboard/payouts', icon: CreditCard },
  { name: 'Incidents', href: '/dashboard/incidents', icon: AlertTriangle },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
]

const driverNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Trips', href: '/dashboard/my-trips', icon: MapPin },
  { name: 'My Payouts', href: '/dashboard/my-payouts', icon: CreditCard },
  { name: 'Documents', href: '/dashboard/my-documents', icon: FileText },
]

export function Sidebar({ userRole }: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { signOut } = useAuth()

  const getNavigation = () => {
    switch (userRole) {
      case 'admin':
        return adminNavigation
      case 'manager':
        return managerNavigation
      case 'driver':
        return driverNavigation
      default:
        return []
    }
  }

  const navigation = getNavigation()

  return (
    <>
      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <div className="fixed inset-0 z-50 flex">
          <div
            className={cn(
              'fixed inset-0 bg-gray-900/80',
              sidebarOpen ? 'block' : 'hidden'
            )}
            onClick={() => setSidebarOpen(false)}
          />
          <div
            className={cn(
              'relative flex w-full max-w-xs flex-1 flex-col bg-white',
              sidebarOpen ? 'translate-x-0' : '-translate-x-full',
              'transition-transform duration-300 ease-in-out'
            )}
          >
            <div className="absolute right-0 top-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent navigation={navigation} pathname={pathname} signOut={signOut} />
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 shadow-sm">
          <SidebarContent navigation={navigation} pathname={pathname} signOut={signOut} />
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">
          PLS Travels
        </div>
      </div>
    </>
  )
}

function SidebarContent({
  navigation,
  pathname,
  signOut,
}: {
  navigation: typeof adminNavigation
  pathname: string
  signOut: () => void
}) {
  return (
    <>
      <div className="flex h-16 shrink-0 items-center">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600">
            <Car className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">PLS Travels</span>
        </div>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      pathname === item.href
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-700',
                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                    )}
                  >
                    <item.icon
                      className={cn(
                        pathname === item.href
                          ? 'text-blue-700'
                          : 'text-gray-400 group-hover:text-blue-700',
                        'h-6 w-6 shrink-0'
                      )}
                    />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li className="mt-auto">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:bg-gray-50 hover:text-red-700"
              onClick={signOut}
            >
              <LogOut className="h-6 w-6 shrink-0 mr-3" />
              Sign out
            </Button>
          </li>
        </ul>
      </nav>
    </>
  )
}

