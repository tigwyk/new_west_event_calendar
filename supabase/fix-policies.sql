-- Fix for infinite recursion in RLS policies
-- Run this script in your Supabase SQL editor to fix existing database

-- Drop problematic recursive policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can view all events" ON events;
DROP POLICY IF EXISTS "Admins can update any event" ON events;
DROP POLICY IF EXISTS "Admins can delete events" ON events;
DROP POLICY IF EXISTS "Admins can moderate comments" ON comments;
DROP POLICY IF EXISTS "Admins can view all RSVPs" ON rsvps;

-- Recreate admin policies with direct email check (non-recursive)
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (auth.email() LIKE '%@newwestevents.com');

CREATE POLICY "Admins can view all events" ON events
  FOR SELECT USING (auth.email() LIKE '%@newwestevents.com');

CREATE POLICY "Admins can update any event" ON events
  FOR UPDATE USING (auth.email() LIKE '%@newwestevents.com');

CREATE POLICY "Admins can delete events" ON events
  FOR DELETE USING (auth.email() LIKE '%@newwestevents.com');

CREATE POLICY "Admins can moderate comments" ON comments
  FOR ALL USING (auth.email() LIKE '%@newwestevents.com');

CREATE POLICY "Admins can view all RSVPs" ON rsvps
  FOR SELECT USING (auth.email() LIKE '%@newwestevents.com');