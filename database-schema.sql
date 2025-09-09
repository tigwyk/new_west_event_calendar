-- New Westminster Events Calendar Database Schema
-- This file contains the complete database schema for Supabase
-- Run these commands in the Supabase SQL editor to set up your database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create storage bucket for event files
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-files', 'event-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create users table (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure email is valid
  CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  link TEXT,
  category TEXT,
  is_free BOOLEAN DEFAULT FALSE,
  is_accessible BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  image_urls TEXT[], -- Array of image URLs
  max_capacity INTEGER,
  submitted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure event date is not in the past when creating
  CONSTRAINT events_date_not_past CHECK (date >= CURRENT_DATE OR status != 'pending'),
  -- Ensure title and description are not empty
  CONSTRAINT events_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
  CONSTRAINT events_description_not_empty CHECK (LENGTH(TRIM(description)) > 0),
  CONSTRAINT events_location_not_empty CHECK (LENGTH(TRIM(location)) > 0)
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure comment text is not empty
  CONSTRAINT comments_text_not_empty CHECK (LENGTH(TRIM(text)) > 0),
  -- Prevent spam: limit comment length
  CONSTRAINT comments_text_length CHECK (LENGTH(text) <= 1000)
);

-- Create RSVPs table
CREATE TABLE public.rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('attending', 'not_attending', 'maybe')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one RSVP per user per event
  UNIQUE(event_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX events_status_idx ON public.events(status);
CREATE INDEX events_date_idx ON public.events(date);
CREATE INDEX events_category_idx ON public.events(category);
CREATE INDEX events_submitted_by_idx ON public.events(submitted_by);
CREATE INDEX comments_event_id_idx ON public.comments(event_id);
CREATE INDEX comments_user_id_idx ON public.comments(user_id);
CREATE INDEX rsvps_event_id_idx ON public.rsvps(event_id);
CREATE INDEX rsvps_user_id_idx ON public.rsvps(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rsvps_updated_at BEFORE UPDATE ON public.rsvps 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Users can read all user profiles (for displaying names, etc.)
CREATE POLICY "Users can read all profiles" ON public.users
  FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- RLS Policies for events table
-- Everyone can read approved events
CREATE POLICY "Anyone can read approved events" ON public.events
  FOR SELECT USING (status = 'approved');

-- Authenticated users can read their own events (any status)
CREATE POLICY "Users can read own events" ON public.events
  FOR SELECT USING (auth.uid()::text = submitted_by::text);

-- Admins can read all events
CREATE POLICY "Admins can read all events" ON public.events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id::text = auth.uid()::text 
      AND users.is_admin = true
    )
  );

-- Authenticated users can create events (will be pending by default)
CREATE POLICY "Authenticated users can create events" ON public.events
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid()::text = submitted_by::text
  );

-- Users can update their own pending events
CREATE POLICY "Users can update own pending events" ON public.events
  FOR UPDATE USING (
    auth.uid()::text = submitted_by::text AND
    status = 'pending'
  );

-- Admins can update any event
CREATE POLICY "Admins can update any event" ON public.events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id::text = auth.uid()::text 
      AND users.is_admin = true
    )
  );

-- Users can delete their own pending events
CREATE POLICY "Users can delete own pending events" ON public.events
  FOR DELETE USING (
    auth.uid()::text = submitted_by::text AND
    status = 'pending'
  );

-- Admins can delete any event
CREATE POLICY "Admins can delete any event" ON public.events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id::text = auth.uid()::text 
      AND users.is_admin = true
    )
  );

-- RLS Policies for comments table
-- Anyone can read comments on approved events
CREATE POLICY "Anyone can read comments on approved events" ON public.comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = comments.event_id 
      AND events.status = 'approved'
    )
  );

-- Users can read comments on their own events (any status)
CREATE POLICY "Users can read comments on own events" ON public.comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = comments.event_id 
      AND events.submitted_by::text = auth.uid()::text
    )
  );

-- Authenticated users can create comments on approved events
CREATE POLICY "Authenticated users can comment on approved events" ON public.comments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid()::text = user_id::text AND
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = event_id 
      AND events.status = 'approved'
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON public.comments
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON public.comments
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Event owners can delete comments on their events
CREATE POLICY "Event owners can delete comments on their events" ON public.comments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = comments.event_id 
      AND events.submitted_by::text = auth.uid()::text
    )
  );

-- Admins can manage all comments
CREATE POLICY "Admins can manage all comments" ON public.comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id::text = auth.uid()::text 
      AND users.is_admin = true
    )
  );

-- RLS Policies for rsvps table
-- Users can read RSVPs for approved events
CREATE POLICY "Anyone can read rsvps for approved events" ON public.rsvps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = rsvps.event_id 
      AND events.status = 'approved'
    )
  );

-- Authenticated users can manage their own RSVPs for approved events
CREATE POLICY "Users can manage own rsvps for approved events" ON public.rsvps
  FOR ALL USING (
    auth.uid()::text = user_id::text AND
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = event_id 
      AND events.status = 'approved'
    )
  );

-- Event owners can read RSVPs for their events
CREATE POLICY "Event owners can read rsvps for their events" ON public.rsvps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = rsvps.event_id 
      AND events.submitted_by::text = auth.uid()::text
    )
  );

-- Admins can read all RSVPs
CREATE POLICY "Admins can read all rsvps" ON public.rsvps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id::text = auth.uid()::text 
      AND users.is_admin = true
    )
  );

-- RLS Policies for Storage
-- Allow authenticated users to upload files for their own events
CREATE POLICY "Users can upload files for their own events" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'event-files' AND
    auth.uid() IS NOT NULL AND
    (
      -- Event creators can upload files for their events
      EXISTS (
        SELECT 1 FROM public.events 
        WHERE events.id::text = (storage.foldername(name))[1]
        AND events.submitted_by::text = auth.uid()::text
      ) OR
      -- Admins can upload files for any event
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id::text = auth.uid()::text 
        AND users.is_admin = true
      )
    )
  );

-- Allow public read access to event files
CREATE POLICY "Public can view event files" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-files');

-- Allow event creators and admins to delete their files
CREATE POLICY "Users can delete their own event files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'event-files' AND
    auth.uid() IS NOT NULL AND
    (
      -- Event creators can delete files for their events
      EXISTS (
        SELECT 1 FROM public.events 
        WHERE events.id::text = (storage.foldername(name))[1]
        AND events.submitted_by::text = auth.uid()::text
      ) OR
      -- Admins can delete any event files
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id::text = auth.uid()::text 
        AND users.is_admin = true
      )
    )
  );

-- Create a function to automatically set admin status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, image, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email LIKE '%@newwestevents.com'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name),
    image = COALESCE(EXCLUDED.image, public.users.image),
    is_admin = EXCLUDED.is_admin,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data for development (optional)
-- This will be populated by the seed script

COMMENT ON TABLE public.users IS 'User profiles with admin status detection';
COMMENT ON TABLE public.events IS 'Community events with approval workflow';
COMMENT ON TABLE public.comments IS 'User comments on events';
COMMENT ON TABLE public.rsvps IS 'User RSVPs for events with status tracking';