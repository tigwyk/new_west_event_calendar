# Supabase Setup Guide

This guide walks you through setting up Supabase for the New Westminster Events Calendar application.

## Prerequisites

- A [Supabase](https://supabase.com) account
- Access to the Supabase dashboard
- Basic knowledge of SQL and PostgreSQL

## Step 1: Create a New Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `new-west-events-calendar`
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users (e.g., `us-west-1` for West Coast)
5. Click "Create new project"
6. Wait for the project to be provisioned (1-2 minutes)

## Step 2: Configure Environment Variables

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like `https://your-project-ref.supabase.co`)
   - **Project API Keys** → **anon** (public key)
   - **Project API Keys** → **service_role** (secret key - keep private!)

3. Create `.env.local` file in your project root:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your Supabase credentials:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

## Step 3: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `database-schema.sql` and paste it into the editor
4. Click **Run** to execute the schema
5. Verify tables were created by going to **Table Editor**

You should see the following tables:
- `users` - User profiles and admin status
- `events` - Community events with approval workflow  
- `comments` - User comments on events
- `rsvps` - User RSVPs with status tracking

## Step 4: Configure Authentication

### Enable OAuth Providers

1. Go to **Authentication** → **Providers**
2. Configure the OAuth providers you want to support:

#### Google OAuth
1. Click on **Google** provider
2. Enable the provider
3. Add your Google OAuth credentials:
   - Client ID: `your_google_client_id`
   - Client Secret: `your_google_client_secret`
4. Add authorized redirect URLs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

#### GitHub OAuth  
1. Click on **GitHub** provider
2. Enable the provider
3. Add your GitHub OAuth credentials
4. Add authorized redirect URLs

#### Facebook OAuth
1. Click on **Facebook** provider
2. Enable the provider  
3. Add your Facebook OAuth credentials
4. Add authorized redirect URLs

#### Twitter OAuth
1. Click on **Twitter** provider
2. Enable the provider
3. Add your Twitter OAuth credentials  
4. Add authorized redirect URLs

### Configure Site URL and Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `https://yourdomain.com` (production) or `http://localhost:3000` (development)
3. Add **Redirect URLs**:
   - `http://localhost:3000/**` (development)
   - `https://yourdomain.com/**` (production)

## Step 5: Verify Row Level Security (RLS)

The schema includes comprehensive RLS policies. Verify they're working:

1. Go to **Authentication** → **Policies**
2. You should see policies for all tables:
   - **users**: Read all, update/insert own profile
   - **events**: Public read for approved, authenticated create, admin manage
   - **comments**: Read on approved events, authenticated create, own manage
   - **rsvps**: Read for approved events, own manage, admin read all

## Step 6: Test the Integration

1. Start your development server:
```bash
bun run dev
```

2. Go to `http://localhost:3000`
3. Try signing in with one of your configured OAuth providers
4. Verify user profile is created in Supabase **Authentication** → **Users**
5. Try creating an event (should be pending status)
6. If you have an admin account (`@newwestevents.com` email), try approving events

## Step 7: Admin User Setup

### Automatic Admin Detection
Admin status is automatically granted to users with `@newwestevents.com` email addresses.

### Manual Admin Setup (if needed)
1. Go to **Table Editor** → **users**
2. Find the user you want to make admin
3. Set `is_admin` to `true`
4. Click **Save**

## Step 8: Production Deployment

### Vercel Deployment
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Update Supabase redirect URLs to include your production domain

### Domain Configuration
1. Update **NEXTAUTH_URL** in `.env.local` to your production domain
2. Update **Site URL** in Supabase Auth settings
3. Add production domain to **Redirect URLs**

## Monitoring and Maintenance

### Database Monitoring
- **Table Editor**: View and edit data
- **SQL Editor**: Run custom queries
- **Logs**: Monitor database activity and errors

### Authentication Monitoring  
- **Users**: View registered users and their status
- **Policies**: Monitor RLS policy effectiveness

### Performance Monitoring
- **Reports**: Database usage and performance metrics
- **Logs**: API usage and response times

## Troubleshooting

### Common Issues

#### "Invalid API key" Error
- Check that `NEXT_PUBLIC_SUPABASE_ANON_KEY` matches the anon key in your Supabase dashboard
- Ensure `.env.local` is in your project root and properly formatted

#### "Permission denied" Errors
- Verify Row Level Security policies are correctly configured
- Check that user authentication is working properly
- Use SQL Editor to test queries manually

#### OAuth Login Fails  
- Verify OAuth provider credentials are correct
- Check redirect URLs match exactly (including protocol)
- Ensure OAuth apps are configured correctly with providers

#### Events Not Appearing
- Check event status (should be 'approved' to appear publicly)
- Verify RLS policies allow reading events
- Check browser console for any JavaScript errors

### Database Queries for Debugging

```sql
-- Check all users and admin status
SELECT id, email, name, is_admin, created_at FROM public.users;

-- Check events by status
SELECT id, title, status, submitted_by, created_at FROM public.events ORDER BY created_at DESC;

-- Check comments count per event  
SELECT e.title, COUNT(c.id) as comment_count 
FROM public.events e 
LEFT JOIN public.comments c ON e.id = c.event_id 
GROUP BY e.id, e.title;

-- Check RSVP statistics
SELECT e.title, r.status, COUNT(*) as count
FROM public.events e
JOIN public.rsvps r ON e.id = r.event_id  
GROUP BY e.id, e.title, r.status;
```

## Security Best Practices

1. **Keep service role key private**: Never expose in client-side code
2. **Use RLS policies**: All tables have RLS enabled with appropriate policies
3. **Validate user input**: All inputs are sanitized using security utilities
4. **Monitor access logs**: Regularly review authentication and API logs  
5. **Regular backups**: Supabase handles automatic backups, but consider additional backup strategies

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- [Project Issues](https://github.com/your-username/new-west-events-calendar/issues)

---
*Last updated: 2025-09-05*