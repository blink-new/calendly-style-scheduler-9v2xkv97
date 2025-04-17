
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useToast } from '../hooks/use-toast'
import { Calendar } from '../components/ui/calendar'
import { format, addDays, parseISO, isAfter, isBefore, addMinutes, isSameDay } from 'date-fns'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { CalendarClock, Clock, User } from 'lucide-react'
import { cn } from '../lib/utils'

type MeetingType = {
  id: string
  user_id: string
  name: string
  description: string | null
  duration: number
  color: string
}

type UserProfile = {
  id: string
  name: string | null
  email: string
}

type Availability = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
}

type TimeSlot = {
  startTime: Date
  endTime: Date
}

type BookingFormData = {
  name: string
  email: string
  notes: string
}

export default function BookingPage() {
  const { username, meetingTypeId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [meetingType, setMeetingType] = useState<MeetingType | null>(null)
  const [host, setHost] = useState<UserProfile | null>(null)
  const [availabilities, setAvailabilities] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [formData, setFormData] = useState<BookingFormData>({
    name: '',
    email: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch host user
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', username)
          .single()

        if (userError) throw userError

        setHost(userData)

        // Fetch meeting type
        const { data: meetingTypeData, error: meetingTypeError } = await supabase
          .from('meeting_types')
          .select('*')
          .eq('id', meetingTypeId)
          .eq('user_id', userData.id)
          .eq('is_active', true)
          .single()

        if (meetingTypeError) throw meetingTypeError

        setMeetingType(meetingTypeData)

        // Fetch availabilities
        const { data: availabilityData, error: availabilityError } = await supabase
          .from('availability')
          .select('*')
          .eq('user_id', userData.id)

        if (availabilityError) throw availabilityError

        setAvailabilities(availabilityData)
      } catch (error) {
        console.error('Error fetching booking data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load booking information',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [username, meetingTypeId, toast])

  useEffect(() => {
    if (selectedDate && meetingType) {
      generateTimeSlots(selectedDate, meetingType.duration)
    }
  }, [selectedDate, meetingType])

  const generateTimeSlots = async (date: Date, durationMinutes: number) => {
    if (!host || !availabilities.length) return

    const dayOfWeek = date.getDay()
    const dayAvailabilities = availabilities.filter(a => a.day_of_week === dayOfWeek)

    if (!dayAvailabilities.length) {
      setAvailableSlots([])
      return
    }

    // Get existing bookings for the selected date
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const { data: existingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('host_id', host.id)
      .gte('start_time', startOfDay.toISOString())
      .lte('end_time', endOfDay.toISOString())
      .not('status', 'eq', 'cancelled')

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      return
    }

    const slots: TimeSlot[] = []

    dayAvailabilities.forEach(availability => {
      const [startHour, startMinute] = availability.start_time.split(':').map(Number)
      const [endHour, endMinute] = availability.end_time.split(':').map(Number)

      const startDateTime = new Date(date)
      startDateTime.setHours(startHour, startMinute, 0, 0)

      const endDateTime = new Date(date)
      endDateTime.setHours(endHour, endMinute, 0, 0)

      // Generate slots at 15-minute intervals
      const slotInterval = 15
      let currentSlotStart = new Date(startDateTime)

      while (addMinutes(currentSlotStart, durationMinutes) <= endDateTime) {
        const slotEnd = addMinutes(currentSlotStart, durationMinutes)
        
        // Check if slot overlaps with any existing booking
        const isOverlapping = existingBookings?.some(booking => {
          const bookingStart = new Date(booking.start_time)
          const bookingEnd = new Date(booking.end_time)
          
          return (
            (isAfter(currentSlotStart, bookingStart) && isBefore(currentSlotStart, bookingEnd)) ||
            (isAfter(slotEnd, bookingStart) && isBefore(slotEnd, bookingEnd)) ||
            (isBefore(currentSlotStart, bookingStart) && isAfter(slotEnd, bookingEnd)) ||
            (isSameDay(currentSlotStart, bookingStart) && currentSlotStart.getTime() === bookingStart.getTime()) ||
            (isSameDay(slotEnd, bookingEnd) && slotEnd.getTime() === bookingEnd.getTime())
          )
        })

        if (!isOverlapping) {
          slots.push({
            startTime: new Date(currentSlotStart),
            endTime: new Date(slotEnd),
          })
        }

        currentSlotStart = addMinutes(currentSlotStart, slotInterval)
      }
    })

    setAvailableSlots(slots)
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    setSelectedSlot(null)
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!host || !meetingType || !selectedSlot) return

    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          host_id: host.id,
          guest_name: formData.name,
          guest_email: formData.email,
          title: meetingType.name,
          description: formData.notes || null,
          start_time: selectedSlot.startTime.toISOString(),
          end_time: selectedSlot.endTime.toISOString(),
          status: 'confirmed',
        })
        .select()

      if (error) throw error

      // Redirect to confirmation page
      navigate(`/confirmation/${data[0].id}`)
    } catch (error) {
      console.error('Error creating booking:', error)
      toast({
        title: 'Error',
        description: 'Failed to create booking',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!meetingType || !host) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="flex h-40 items-center justify-center">
            <p className="text-muted-foreground">
              This meeting type is not available or does not exist.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary-800">
            {meetingType.name}
          </h1>
          <div className="mt-2 flex items-center justify-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{host.name || 'Host'}</span>
            <span>•</span>
            <Clock className="h-4 w-4" />
            <span>{meetingType.duration} minutes</span>
          </div>
          {meetingType.description && (
            <p className="mt-4 text-gray-600">{meetingType.description}</p>
          )}
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Select a Date & Time</CardTitle>
              <CardDescription>
                Choose a date and time that works for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => {
                  // Disable dates in the past
                  if (isBefore(date, new Date())) return true
                  
                  // Disable dates more than 60 days in the future
                  if (isAfter(date, addDays(new Date(), 60))) return true
                  
                  // Disable days with no availability
                  const dayOfWeek = date.getDay()
                  return !availabilities.some(a => a.day_of_week === dayOfWeek)
                }}
                className="rounded-md border"
              />

              {selectedDate && (
                <div className="mt-4">
                  <h3 className="mb-2 font-medium">
                    Available times for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </h3>
                  
                  {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {availableSlots.map((slot, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className={cn(
                            "justify-start",
                            selectedSlot && 
                            selectedSlot.startTime.getTime() === slot.startTime.getTime() && 
                            "border-primary bg-primary-50"
                          )}
                          onClick={() => handleSlotSelect(slot)}
                        >
                          <CalendarClock className="mr-2 h-4 w-4" />
                          {format(slot.startTime, 'h:mm a')}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No available time slots for this day.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
              <CardDescription>
                {selectedSlot
                  ? `Booking for ${format(selectedSlot.startTime, 'EEEE, MMMM d')} at ${format(
                      selectedSlot.startTime,
                      'h:mm a'
                    )}`
                  : 'Please select a date and time first'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your name"
                    required
                    disabled={!selectedSlot}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                    required
                    disabled={!selectedSlot}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any additional information you'd like to share"
                    rows={3}
                    disabled={!selectedSlot}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={!selectedSlot || submitting}
                >
                  {submitting ? 'Scheduling...' : 'Schedule Meeting'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}