
import { Link, useLocation } from 'react-router-dom'
import { cn } from '../lib/utils'
import { 
  CalendarDays, 
  Clock, 
  LayoutDashboard, 
  Settings, 
  CalendarClock,
  CalendarCheck
} from 'lucide-react'

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Availability',
    href: '/dashboard/availability',
    icon: Clock,
  },
  {
    title: 'Meeting Types',
    href: '/dashboard/meeting-types',
    icon: CalendarDays,
  },
  {
    title: 'Bookings',
    href: '/dashboard/bookings',
    icon: CalendarCheck,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export default function Sidebar() {
  const location = useLocation()
  
  return (
    <div className="flex h-full w-64 flex-col border-r bg-white">
      <div className="flex h-16 items-center border-b px-4">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary-600">
          <CalendarClock className="h-6 w-6" />
          <span>MeetSync</span>
        </Link>
      </div>
      
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              location.pathname === item.href
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.title}
          </Link>
        ))}
      </nav>
    </div>
  )
}