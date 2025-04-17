
import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { Session } from '@supabase/supabase-js'

// Layouts
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'

// Pages
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import AvailabilityPage from './pages/AvailabilityPage'
import BookingsPage from './pages/BookingsPage'
import MeetingTypesPage from './pages/MeetingTypesPage'
import SettingsPage from './pages/SettingsPage'
import BookingPage from './pages/BookingPage'
import ConfirmationPage from './pages/ConfirmationPage'
import NotFoundPage from './pages/NotFoundPage'
import AuthPage from './pages/AuthPage'

// Context
import { AuthProvider } from './contexts/AuthContext'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <AuthProvider value={{ session }}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="book/:username/:meetingTypeId" element={<BookingPage />} />
          <Route path="confirmation/:bookingId" element={<ConfirmationPage />} />
        </Route>

        {/* Auth routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route index element={<AuthPage />} />
        </Route>

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={session ? <MainLayout /> : <Navigate to="/auth" replace />}
        >
          <Route index element={<DashboardPage />} />
          <Route path="availability" element={<AvailabilityPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="meeting-types" element={<MeetingTypesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* 404 route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}

export default App