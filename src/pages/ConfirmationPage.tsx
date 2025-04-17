
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useToast } from '../hooks/use-toast'
import { format, parseISO } from 'date-fns'
import { Calendar, Clock, Mail, User, Check, CalendarClock } from 'lucide-react'

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
}

type Host = {
  id: string
  name: string | null
  email: string
}

export default function ConfirmationPage() {
  const { bookingId } = useParams()
  const { toast } = useToast()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [host, setHost] = useState<Host | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBooking() {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single()

        if (error) throw error

        setBooking(data)

        // Fetch host information
        const { data: hostData, error: hostError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.host_id)
          .single()

        if (hostError) throw hostError

        setHost(hostData)
      } catch (error) {
        console.error('Error fetching booking:', error)
        toast({
          title: 'Error',
          description: 'Failed to load booking information',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [bookingId, toast])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!booking || !host) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="flex h-40 items-center justify-center">
            <p className="text-muted-foreground">
              Booking not found or has been cancelled.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Card className="overflow-hidden">
          <div className="bg-primary-500 p-6 text-white">
            <div className="flex items-center justify-center gap-2">
              <Check className="h-8 w-8" />
              <h1 className="text-2xl font-bold">Booking Confirmed</h1>
            </div>
          </div>
          
          <CardHeader>
            <CardTitle className="text-xl">{booking.title}</CardTitle>
            <CardDescription>
              Your meeting has been scheduled successfully
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Date</p>
                    <p className="text-muted-foreground">
                      {format(parseISO(booking.start_time), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Time</p>
                    <p className="text-muted-foreground">
                      {format(parseISO(booking.start_time), 'h:mm a')} - 
                      {format(parseISO(booking.end_time), 'h:mm a')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <User className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Host</p>
                    <p className="text-muted-foreground">
                      {host.name || 'Your Host'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Your Email</p>
                    <p className="text-muted-foreground">
                      {booking.guest_email}
                    </p>
                  </div>
                </div>
                
                {booking.description && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-5 w-5" />
                    <div>
                      <p className="font-medium">Additional Notes</p>
                      <p className="text-muted-foreground">
                        {booking.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarClock className="h-4 w-4" />
                <p>
                  A calendar invitation has been sent to your email.
                </p>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button asChild variant="outline">
              <Link to="/">Return Home</Link>
            </Button>
            <Button asChild>
              <a href={`mailto:${host.email}`}>
                Contact Host
              </a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}