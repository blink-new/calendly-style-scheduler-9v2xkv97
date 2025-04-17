
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { CalendarClock, Clock, Calendar, CheckCircle } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-24">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-primary-800 md:text-5xl">
          Schedule meetings without the back-and-forth
        </h1>
        <p className="mb-8 text-xl text-gray-600">
          MeetSync makes it easy for others to book time on your calendar based on your real availability.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild size="lg" className="bg-primary-600 hover:bg-primary-700">
            <Link to="/auth">Get Started</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="#features">Learn More</Link>
          </Button>
        </div>
      </div>

      <div className="mt-24" id="features">
        <h2 className="mb-12 text-center text-3xl font-bold text-primary-800">
          Streamline your scheduling process
        </h2>
        
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <CalendarClock className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Easy Scheduling</h3>
            <p className="text-gray-600">
              Share your booking link and let others choose available times that work for them.
            </p>
          </div>
          
          <div className="rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Real Availability</h3>
            <p className="text-gray-600">
              Sync with your calendar to ensure you're only offering times when you're actually free.
            </p>
          </div>
          
          <div className="rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Automated Confirmations</h3>
            <p className="text-gray-600">
              Send automatic email confirmations and reminders to reduce no-shows.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-24 rounded-xl bg-primary-50 p-8 md:p-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-6 text-3xl font-bold text-primary-800">
            Ready to simplify your scheduling?
          </h2>
          <p className="mb-8 text-lg text-gray-600">
            Join thousands of professionals who save time and increase productivity with MeetSync.
          </p>
          <Button asChild size="lg" className="bg-primary-600 hover:bg-primary-700">
            <Link to="/auth">Get Started for Free</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}