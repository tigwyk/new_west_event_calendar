-- New Westminster Event Calendar Database Schema
-- Supabase PostgreSQL implementation

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- Users table (extends NextAuth users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  image TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100),
  is_free BOOLEAN DEFAULT TRUE,
  is_accessible BOOLEAN DEFAULT FALSE,
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RSVPs table
CREATE TABLE IF NOT EXISTS rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'attending' CHECK (status IN ('attending', 'not_attending', 'maybe')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_submitted_by ON events(submitted_by);
CREATE INDEX IF NOT EXISTS idx_comments_event_id ON comments(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_user_id ON rsvps(user_id);

-- Row Level Security Policies

-- Users table policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.email() = email);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.email() = email);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE email = auth.email() AND is_admin = TRUE
    )
  );

-- Events table policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view approved events" ON events
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can view their own submitted events" ON events
  FOR SELECT USING (
    submitted_by IN (
      SELECT id FROM users WHERE email = auth.email()
    )
  );

CREATE POLICY "Admins can view all events" ON events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE email = auth.email() AND is_admin = TRUE
    )
  );

CREATE POLICY "Authenticated users can create events" ON events
  FOR INSERT WITH CHECK (
    auth.email() IS NOT NULL AND
    submitted_by IN (
      SELECT id FROM users WHERE email = auth.email()
    )
  );

CREATE POLICY "Users can update their own events" ON events
  FOR UPDATE USING (
    submitted_by IN (
      SELECT id FROM users WHERE email = auth.email()
    )
  );

CREATE POLICY "Admins can update any event" ON events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE email = auth.email() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admins can delete events" ON events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE email = auth.email() AND is_admin = TRUE
    )
  );

-- Comments table policies
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view comments on approved events" ON comments
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM events WHERE status = 'approved'
    )
  );

CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (
    auth.email() IS NOT NULL AND
    user_id IN (
      SELECT id FROM users WHERE email = auth.email()
    )
  );

CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM users WHERE email = auth.email()
    )
  );

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (
    user_id IN (
      SELECT id FROM users WHERE email = auth.email()
    )
  );

CREATE POLICY "Admins can moderate comments" ON comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE email = auth.email() AND is_admin = TRUE
    )
  );

-- RSVPs table policies
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view RSVP counts for approved events" ON rsvps
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM events WHERE status = 'approved'
    )
  );

CREATE POLICY "Authenticated users can manage their RSVPs" ON rsvps
  FOR ALL USING (
    auth.email() IS NOT NULL AND
    user_id IN (
      SELECT id FROM users WHERE email = auth.email()
    )
  );

CREATE POLICY "Admins can view all RSVPs" ON rsvps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE email = auth.email() AND is_admin = TRUE
    )
  );

-- Functions for automatic user creation on first login
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, name, image, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'picture',
    CASE WHEN NEW.email LIKE '%@newwestevents.com' THEN TRUE ELSE FALSE END
  )
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    image = EXCLUDED.image,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating timestamps
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_rsvps_updated_at
  BEFORE UPDATE ON rsvps
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();