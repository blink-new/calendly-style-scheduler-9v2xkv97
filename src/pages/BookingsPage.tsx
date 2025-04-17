
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useToast } from '../hooks/use-toast'
import { format, parseISO } from 'date-fns'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Calendar, Clock, Mail, User } from 'lucide-react'

type Booking = {
  id: string
  host_id: string
  guest_email: string
  guest_name: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  status: string
  created_at: string
}

export default function BookingsPage() {
  const { session } = useAuth()
  const { toast } = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')

  useEffect(() => {
    if (!session?.user) return

    async function fetchBookings() {
      try {
        let query = supabase
          .from('bookings')
          .select('*')
          .eq('host_id', session.user.id)
          .order('start_time', { ascending: activeTab === 'upcoming' })

        if (activeTab === 'upcoming') {
          query = query.gte('start_time', new Date().toISOString())
        } else if (activeTab === 'past') {
          query = query.lt('start_time', new Date().toISOString())
        }

        const { data, error } = await query

        if (error) {
          throw error
        }

        setBookings(data || [])
      } catch (error) {
        console.error('Error fetching bookings:', error)
        toast({
          title: 'Error',
          description: 'Failed to load your bookings',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [session, toast, activeTab])

  const handleCancelBooking = async (id: string) => {
    if (!session?.user) return

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .eq('host_id', session.user.id)

      if (error) {
        throw error
      }

      setBookings(
        bookings.map((booking) =>
          booking.id === id ? { ...booking, status: 'cancelled' } : booking
        )
      )

      toast({
        title: 'Booking cancelled',
        description: 'The booking has been cancelled successfully',
      })
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast({
        title: 'Error',
        description: 'Failed to cancel the booking',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500">Confirmed</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      case 'pending':
        return <Badge variant="outline">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
        <p className="text-muted-foreground">
          Manage your scheduled meetings and appointments.
        </p>
      </div>

      <Tabs defaultValue="upcoming" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="mt-6">
          <BookingsList 
            bookings={bookings} 
            onCancelBooking={handleCancelBooking} 
            emptyMessage="No upcoming bookings" 
          />
        </TabsContent>
        
        <TabsContent value="past" className="mt-6">
          <BookingsList 
            bookings={bookings} 
            onCancelBooking={handleCancelBooking} 
            emptyMessage="No past bookings" 
          />
        </TabsContent>
        
        <TabsContent value="all" className="mt-6">
          <BookingsList 
            bookings={bookings} 
            onCancelBooking={handleCancelBooking} 
            emptyMessage="No bookings found" 
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function BookingsList({ 
  bookings, 
  onCancelBooking, 
  emptyMessage 
}: { 
  bookings: Booking[], 
  onCancelBooking: (id: string) => void,
  emptyMessage: string
}) {
  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking.id}>
          <CardContent className="p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{booking.title}</h3>
                  {getStatusBadge(booking.status)}
                </div>
                
                <div className="flex flex-col gap-2 text-sm text-muted-foreground md:flex-row md:items-center">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(parseISO(booking.start_time), 'EEEE, MMMM d, yyyy')}
                    </span>
                  </div>
                  
                  <div className="hidden md:block">•</div>
                  
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {format(parseISO(booking.start_time), 'h:mm a')} - 
                      {format(parseISO(booking.end_time), 'h:mm a')}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 text-sm text-muted-foreground md:flex-row md:items-center">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{booking.guest_name}</span>
                  </div>
                  
                  <div className="hidden md:block">•</div>
                  
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <span>{booking.guest_email}</span>
                  </div>
                </div>
                
                {booking.description && (
                  <p className="mt-2 text-sm">{booking.description}</p>
                )}
              </div>
              
              {booking.status === 'confirmed' && new Date(booking.start_time) > new Date() && (
                <Button 
                  variant="outline" 
                  onClick={() => onCancelBooking(booking.id)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}