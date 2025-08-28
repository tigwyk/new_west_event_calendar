# Supabase Setup Guide

This guide will help you set up Supabase as the database backend for the New Westminster Event Calendar.

## Prerequisites

- Supabase account (sign up at [supabase.com](https://supabase.com))
- Project environment variables configured

## Step 1: Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `new-west-event-calendar`
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users (e.g., `us-west-1` for Pacific Northwest)
5. Click "Create new project"
6. Wait for the project to be fully provisioned (~2 minutes)

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://abcdefghijk.supabase.co`)
   - **Project API Keys** → **anon public** key
   - **Project API Keys** → **service_role** key (keep this secure!)

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update the Supabase environment variables in `.env.local`:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

## Step 4: Set Up the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `supabase/schema.sql` and paste it into the query editor
4. Click "Run" to execute the schema
5. Verify the tables were created by going to **Table Editor**

You should see these tables:
- `users` - User profiles and admin status
- `events` - Event data with approval workflow
- `comments` - Event comments and discussions
- `rsvps` - User RSVP responses

## Step 5: Configure Row Level Security (RLS)

The schema includes comprehensive RLS policies that:

- **Users Table**: Users can only view/edit their own profiles, admins can view all
- **Events Table**: Public can view approved events, users can manage their own, admins can manage all
- **Comments Table**: Public can view comments on approved events, users can manage their own
- **RSVPs Table**: Public can view RSVP counts, users can manage their own RSVPs

## Step 6: Enable Realtime (Optional)

For live updates when events/comments/RSVPs change:

1. Go to **Database** → **Replication**
2. Enable realtime for these tables:
   - `events`
   - `comments` 
   - `rsvps`
3. Click "Enable" for each table

## Step 7: Test the Connection

1. Start your development server:
   ```bash
   bun run dev
   ```

2. Check the browser console for any connection errors
3. Try creating an event (should appear in pending state)
4. If you have admin access (@newwestevents.com email), approve the event

## Step 8: Production Deployment

For production deployment:

1. Add the same environment variables to your Vercel/hosting platform
2. Update your Supabase project's **Authentication** → **URL Configuration**:
   - **Site URL**: `https://www.newwestevents.com`
   - **Redirect URLs**: Add your production domain

## Database Schema Overview

### Tables

**users**
- Stores user profiles from OAuth login
- Automatic admin detection for @newwestevents.com emails
- Links to NextAuth.js session data

**events**
- Complete event data with approval workflow
- Supports categories, pricing, accessibility info
- Tracks submission and approval status

**comments**
- Threaded discussions on events
- User attribution and moderation capabilities

**rsvps**
- User attendance responses
- Supports attending/not attending/maybe status
- Unique constraint per user per event

### Key Features

- **Row Level Security**: Comprehensive access control
- **Real-time Updates**: Live changes via Supabase Realtime
- **Admin Workflow**: Automatic admin privileges for city staff
- **Data Integrity**: Foreign keys and constraints
- **Performance**: Optimized indexes for common queries

## Troubleshooting

### Connection Issues
- Verify environment variables are correctly set
- Check Supabase project is fully provisioned
- Ensure API keys are valid and not expired

### Permission Errors
- Verify RLS policies are properly configured
- Check user has proper authentication state
- Confirm admin status for @newwestevents.com emails

### Real-time Not Working
- Ensure realtime is enabled for relevant tables
- Check browser network tab for WebSocket connections
- Verify subscription setup in useEvents hook

## Security Considerations

- **API Keys**: Never commit service role key to version control
- **RLS Policies**: All tables have comprehensive access control
- **Input Sanitization**: All user input is validated and sanitized
- **Admin Access**: Automatically granted to @newwestevents.com emails
- **HTTPS Only**: All connections encrypted in production

## Performance Optimization

- **Indexes**: Strategic indexes on commonly queried columns
- **Connection Pooling**: Supabase handles connection management
- **Edge Functions**: Consider for heavy computational tasks
- **Caching**: Implement client-side caching for frequently accessed data

## Backup and Recovery

Supabase provides:
- **Automatic Backups**: Daily backups for 7 days (Pro plan)
- **Point-in-time Recovery**: Recovery to any point in time
- **Database Downloads**: Export your data anytime

For production, consider upgrading to Pro plan for enhanced backup capabilities.

## Support

- **Supabase Docs**: [docs.supabase.com](https://docs.supabase.com)
- **Community**: [github.com/supabase/supabase](https://github.com/supabase/supabase)
- **Discord**: Supabase community Discord server