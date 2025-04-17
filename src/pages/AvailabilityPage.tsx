
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useToast } from '../hooks/use-toast'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Label } from '../components/ui/label'

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

const TIME_SLOTS = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4)
  const minute = (i % 4) * 15
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return {
    value: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
    label: `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`,
  }
})

type Availability = {
  id: string
  user_id: string
  day_of_week: number
  start_time: string
  end_time: string
}

export default function AvailabilityPage() {
  const { session } = useAuth()
  const { toast } = useToast()
  const [availabilities, setAvailabilities] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newAvailability, setNewAvailability] = useState({
    day_of_week: 1, // Monday
    start_time: '09:00',
    end_time: '17:00',
  })

  useEffect(() => {
    if (!session?.user) return

    async function fetchAvailability() {
      try {
        const { data, error } = await supabase
          .from('availability')
          .select('*')
          .eq('user_id', session.user.id)
          .order('day_of_week', { ascending: true })
          .order('start_time', { ascending: true })

        if (error) {
          throw error
        }

        setAvailabilities(data || [])
      } catch (error) {
        console.error('Error fetching availability:', error)
        toast({
          title: 'Error',
          description: 'Failed to load your availability settings',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAvailability()
  }, [session, toast])

  const handleAddAvailability = async () => {
    if (!session?.user) return

    // Validate time range
    if (newAvailability.start_time >= newAvailability.end_time) {
      toast({
        title: 'Invalid time range',
        description: 'End time must be after start time',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('availability')
        .insert({
          user_id: session.user.id,
          day_of_week: newAvailability.day_of_week,
          start_time: newAvailability.start_time,
          end_time: newAvailability.end_time,
        })
        .select()

      if (error) {
        throw error
      }

      setAvailabilities([...availabilities, data[0]])
      toast({
        title: 'Availability added',
        description: 'Your availability has been updated',
      })
    } catch (error) {
      console.error('Error adding availability:', error)
      toast({
        title: 'Error',
        description: 'Failed to add availability',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAvailability = async (id: string) => {
    if (!session?.user) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('availability')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id)

      if (error) {
        throw error
      }

      setAvailabilities(availabilities.filter(a => a.id !== id))
      toast({
        title: 'Availability removed',
        description: 'Your availability has been updated',
      })
    } catch (error) {
      console.error('Error removing availability:', error)
      toast({
        title: 'Error',
        description: 'Failed to remove availability',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
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
        <h1 className="text-3xl font-bold tracking-tight">Availability</h1>
        <p className="text-muted-foreground">
          Set your weekly availability for when you can accept meetings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Hours</CardTitle>
          <CardDescription>
            Define the days and times when you're available for meetings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {availabilities.length > 0 ? (
              availabilities.map((availability) => (
                <div
                  key={availability.id}
                  className="flex items-center justify-between rounded-md border p-4"
                >
                  <div>
                    <p className="font-medium">
                      {DAYS_OF_WEEK.find(d => d.value === availability.day_of_week)?.label}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {TIME_SLOTS.find(t => t.value === availability.start_time)?.label} - 
                      {TIME_SLOTS.find(t => t.value === availability.end_time)?.label}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteAvailability(availability.id)}
                    disabled={saving}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-dashed p-6 text-center">
                <p className="text-muted-foreground">No availability set yet.</p>
                <p className="text-sm text-muted-foreground">
                  Add your available time slots below.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-md border p-4">
            <h3 className="font-medium">Add New Availability</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="day">Day</Label>
                <Select
                  value={newAvailability.day_of_week.toString()}
                  onValueChange={(value) => 
                    setNewAvailability({ ...newAvailability, day_of_week: parseInt(value) })
                  }
                >
                  <SelectTrigger id="day">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Select
                  value={newAvailability.start_time}
                  onValueChange={(value) => 
                    setNewAvailability({ ...newAvailability, start_time: value })
                  }
                >
                  <SelectTrigger id="start-time">
                    <SelectValue placeholder="Select start time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Select
                  value={newAvailability.end_time}
                  onValueChange={(value) => 
                    setNewAvailability({ ...newAvailability, end_time: value })
                  }
                >
                  <SelectTrigger id="end-time">
                    <SelectValue placeholder="Select end time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={handleAddAvailability} 
              disabled={saving}
              className="mt-2"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Plus className="mr-2 h-4 w-4" />
              Add Time Slot
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}