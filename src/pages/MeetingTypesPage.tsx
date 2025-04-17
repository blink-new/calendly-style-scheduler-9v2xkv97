
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useToast } from '../hooks/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Clock, Copy, Edit, Plus, Trash2 } from 'lucide-react'
import { Switch } from '../components/ui/switch'
import { cn } from '../lib/utils'

type MeetingType = {
  id: string
  user_id: string
  name: string
  description: string | null
  duration: number
  color: string
  is_active: boolean
}

const DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '60 minutes' },
  { value: 90, label: '90 minutes' },
  { value: 120, label: '2 hours' },
]

const COLOR_OPTIONS = [
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'green', label: 'Green', class: 'bg-green-500' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { value: 'red', label: 'Red', class: 'bg-red-500' },
  { value: 'gray', label: 'Gray', class: 'bg-gray-500' },
]

export default function MeetingTypesPage() {
  const { session } = useAuth()
  const { toast } = useToast()
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentMeetingType, setCurrentMeetingType] = useState<MeetingType | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 30,
    color: 'blue',
    is_active: true,
  })

  useEffect(() => {
    if (!session?.user) return

    async function fetchMeetingTypes() {
      try {
        const { data, error } = await supabase
          .from('meeting_types')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })

        if (error) {
          throw error
        }

        setMeetingTypes(data || [])
      } catch (error) {
        console.error('Error fetching meeting types:', error)
        toast({
          title: 'Error',
          description: 'Failed to load your meeting types',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMeetingTypes()
  }, [session, toast])

  const handleOpenDialog = (meetingType?: MeetingType) => {
    if (meetingType) {
      setIsEditing(true)
      setCurrentMeetingType(meetingType)
      setFormData({
        name: meetingType.name,
        description: meetingType.description || '',
        duration: meetingType.duration,
        color: meetingType.color,
        is_active: meetingType.is_active,
      })
    } else {
      setIsEditing(false)
      setCurrentMeetingType(null)
      setFormData({
        name: '',
        description: '',
        duration: 30,
        color: 'blue',
        is_active: true,
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: name === 'duration' ? parseInt(value) : value })
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData({ ...formData, is_active: checked })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user) return

    try {
      if (isEditing && currentMeetingType) {
        // Update existing meeting type
        const { error } = await supabase
          .from('meeting_types')
          .update({
            name: formData.name,
            description: formData.description || null,
            duration: formData.duration,
            color: formData.color,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentMeetingType.id)
          .eq('user_id', session.user.id)

        if (error) throw error

        setMeetingTypes(
          meetingTypes.map((mt) =>
            mt.id === currentMeetingType.id
              ? {
                  ...mt,
                  name: formData.name,
                  description: formData.description || null,
                  duration: formData.duration,
                  color: formData.color,
                  is_active: formData.is_active,
                }
              : mt
          )
        )

        toast({
          title: 'Meeting type updated',
          description: 'Your meeting type has been updated successfully',
        })
      } else {
        // Create new meeting type
        const { data, error } = await supabase
          .from('meeting_types')
          .insert({
            user_id: session.user.id,
            name: formData.name,
            description: formData.description || null,
            duration: formData.duration,
            color: formData.color,
            is_active: formData.is_active,
          })
          .select()

        if (error) throw error

        setMeetingTypes([data[0], ...meetingTypes])

        toast({
          title: 'Meeting type created',
          description: 'Your new meeting type has been created successfully',
        })
      }

      handleCloseDialog()
    } catch (error) {
      console.error('Error saving meeting type:', error)
      toast({
        title: 'Error',
        description: 'Failed to save meeting type',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!session?.user) return

    if (!confirm('Are you sure you want to delete this meeting type?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('meeting_types')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id)

      if (error) throw error

      setMeetingTypes(meetingTypes.filter((mt) => mt.id !== id))

      toast({
        title: 'Meeting type deleted',
        description: 'The meeting type has been deleted successfully',
      })
    } catch (error) {
      console.error('Error deleting meeting type:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete meeting type',
        variant: 'destructive',
      })
    }
  }

  const handleCopyLink = (meetingType: MeetingType) => {
    if (!session?.user) return

    const link = `${window.location.origin}/book/${session.user.id}/${meetingType.id}`
    navigator.clipboard.writeText(link)

    toast({
      title: 'Link copied',
      description: 'Booking link copied to clipboard',
    })
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
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meeting Types</h1>
          <p className="text-muted-foreground">
            Create and manage your meeting types for others to book.
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          New Meeting Type
        </Button>
      </div>

      {meetingTypes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No meeting types yet</CardTitle>
            <CardDescription>
              Create your first meeting type to start accepting bookings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Create Meeting Type
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {meetingTypes.map((meetingType) => {
            const colorClass = COLOR_OPTIONS.find(c => c.value === meetingType.color)?.class || 'bg-blue-500'
            
            return (
              <Card key={meetingType.id} className={cn(
                "transition-all hover:shadow-md",
                !meetingType.is_active && "opacity-60"
              )}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-3 w-3 rounded-full", colorClass)} />
                      <CardTitle className="text-lg">{meetingType.name}</CardTitle>
                    </div>
                    {!meetingType.is_active && (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{meetingType.duration} minutes</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {meetingType.description && (
                    <p className="text-sm text-muted-foreground">
                      {meetingType.description}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCopyLink(meetingType)}
                  >
                    <Copy className="mr-2 h-3 w-3" />
                    Copy Link
                  </Button>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleOpenDialog(meetingType)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(meetingType.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Meeting Type' : 'Create Meeting Type'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update your meeting type details'
                : 'Create a new meeting type for others to book'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Quick Chat"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="A brief chat to discuss your project"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Select
                  value={formData.duration.toString()}
                  onValueChange={(value) => handleSelectChange('duration', value)}
                >
                  <SelectTrigger id="duration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => handleSelectChange('color', value)}
                >
                  <SelectTrigger id="color">
                    <SelectValue placeholder="Select color">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "h-3 w-3 rounded-full",
                          COLOR_OPTIONS.find(c => c.value === formData.color)?.class
                        )} />
                        <span>{COLOR_OPTIONS.find(c => c.value === formData.color)?.label}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn("h-3 w-3 rounded-full", option.class)} />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={handleSwitchChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}