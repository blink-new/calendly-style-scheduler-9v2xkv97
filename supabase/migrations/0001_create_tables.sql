
-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table for storing user profiles
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create schedules table for storing user's availability schedules
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- Duration in minutes
  buffer_before INTEGER DEFAULT 0, -- Buffer time before meeting in minutes
  buffer_after INTEGER DEFAULT 0, -- Buffer time after meeting in minutes
  color TEXT DEFAULT '#0284c7', -- Default blue color
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create availability table for storing recurring availability
CREATE TABLE IF NOT EXISTS availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0 = Sunday, 1 = Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table for storing actual booked meetings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  booker_email TEXT NOT NULL,
  booker_name TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'confirmed', -- confirmed, cancelled, completed
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blocked_dates table for storing dates when the user is not available
CREATE TABLE IF NOT EXISTS blocked_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read and update their own profiles
CREATE POLICY "Users can read their own profiles" ON users
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Users can update their own profiles" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Schedules policies
CREATE POLICY "Users can CRUD their own schedules" ON schedules
  FOR ALL USING (auth.uid() = user_id);

-- Availability policies
CREATE POLICY "Users can CRUD their own availability" ON availability
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM schedules 
      WHERE schedules.id = availability.schedule_id 
      AND schedules.user_id = auth.uid()
    )
  );

-- Bookings policies
CREATE POLICY "Users can read their own bookings" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM schedules 
      WHERE schedules.id = bookings.schedule_id 
      AND schedules.user_id = auth.uid()
    )
  );

-- Anyone can create a booking
CREATE POLICY "Anyone can create a booking" ON bookings
  FOR INSERT WITH CHECK (true);

-- Blocked dates policies
CREATE POLICY "Users can CRUD their own blocked dates" ON blocked_dates
  FOR ALL USING (auth.uid() = user_id);

-- Create function to check for booking conflicts
CREATE OR REPLACE FUNCTION check_booking_conflict(
  p_schedule_id UUID,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE
) RETURNS BOOLEAN AS $$
DECLARE
  conflict_exists BOOLEAN;
BEGIN
  -- Check if there's any overlap with existing bookings
  SELECT EXISTS (
    SELECT 1 FROM bookings
    WHERE schedule_id = p_schedule_id
    AND status = 'confirmed'
    AND (
      (start_time <= p_start_time AND end_time > p_start_time) OR
      (start_time < p_end_time AND end_time >= p_end_time) OR
      (start_time >= p_start_time AND end_time <= p_end_time)
    )
  ) INTO conflict_exists;
  
  RETURN conflict_exists;
END;
$$ LANGUAGE plpgsql;