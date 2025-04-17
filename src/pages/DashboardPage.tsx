
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { CalendarCheck, Users, Clock } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  const { session } = useAuth()
  const [stats, setStats] = useState({
    upcomingBookings: 0,
    totalBookings: 0,
    meetingTypes: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      if (!session?.user) return

      try {
        // Get upcoming bookings (bookings in the future)
        const { data: upcomingBookings, error: upcomingError } = await supabase
          .from('bookings')
          .select('*')
          .eq('host_id', session.user.id)
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })

        // Get total bookings count
        const { count: totalBookings, error: totalError } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('host_id', session.user.id)

        // Get meeting types
        const { data: meetingTypes, error: typesError } = await supabase
          .from('meeting_types')
          .select('*')
          .eq('user_id', session.user.id)

        if (upcomingError || totalError || typesError) {
          console.error('Error fetching dashboard data:', upcomingError || totalError || typesError)
        } else {
          setStats({
            upcomingBookings: upcomingBookings?.length || 0,
            totalBookings: totalBookings || 0,
            meetingTypes: meetingTypes?.length || 0,
          })
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [session])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your scheduling activity.
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/meeting-types">Create Meeting Type</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Bookings</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingBookings}</div>
            <p className="text-xs text-muted-foreground">
              {stats.upcomingBookings === 0 ? 'No upcoming meetings' : 'Scheduled meetings'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalBookings === 0 ? 'No bookings yet' : 'All-time bookings'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meeting Types</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.meetingTypes}</div>
            <p className="text-xs text-muted-foreground">
              {stats.meetingTypes === 0 ? 'No meeting types created' : 'Active meeting types'}
            </p>
          </CardContent>
        </Card>
      </div>

      {stats.meetingTypes === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Create your first meeting type to start accepting bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/dashboard/meeting-types">Create Meeting Type</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {stats.upcomingBookings > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bookings</CardTitle>
            <CardDescription>
              Your next scheduled meetings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/dashboard/bookings">View All Bookings</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}