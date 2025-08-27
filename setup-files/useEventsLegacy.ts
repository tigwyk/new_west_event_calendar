// Legacy useEvents hook that works without Supabase for build compatibility
import { useState, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'

export interface EventWithDetails {
  id: string
  title: string
  date: string
  time: string
  location: string
  description: string
  category?: string | null
  is_free?: boolean
  is_accessible?: boolean
  submitted_by?: string | null
  status: 'approved' | 'pending' | 'rejected'
  created_at: string
  updated_at: string
  rsvps?: any[]
  comments?: any[]
  rsvp_counts?: {
    attending: number
    not_attending: number
    maybe: number
  }
  user_rsvp?: any | null
}

export const useEvents = () => {
  const { data: session } = useSession()
  const [events, setEvents] = useState<EventWithDetails[]>([])
  const [pendingEvents, setPendingEvents] = useState<EventWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentUser = useMemo(() => 
    session?.user ? {
      id: session.user.email || 'anonymous',
      email: session.user.email || '',
      name: session.user.name || '',
      isAdmin: session.user.email?.endsWith('@newwestminster.ca') || false
    } : null,
    [session?.user]
  )

  // Placeholder implementations that log when Supabase isn't configured
  const loadEvents = useCallback(async () => {
    console.log('Supabase not configured - using in-memory events')
    setLoading(false)
    setError(null)
  }, [])

  const loadPendingEvents = useCallback(async () => {
    console.log('Supabase not configured - no pending events')
  }, [])

  const createEvent = useCallback(async (eventData: any) => {
    console.log('Supabase not configured - cannot create event:', eventData)
    throw new Error('Database not configured - please set up Supabase')
  }, [])

  const updateEvent = useCallback(async (eventId: string, updates: any) => {
    console.log('Supabase not configured - cannot update event:', eventId, updates)
    throw new Error('Database not configured - please set up Supabase')
  }, [])

  const updateEventStatus = useCallback(async (eventId: string, status: 'approved' | 'rejected') => {
    console.log('Supabase not configured - cannot update event status:', eventId, status)
    throw new Error('Database not configured - please set up Supabase')
  }, [])

  const deleteEvent = useCallback(async (eventId: string) => {
    console.log('Supabase not configured - cannot delete event:', eventId)
    throw new Error('Database not configured - please set up Supabase')
  }, [])

  const updateRSVP = useCallback(async (eventId: string, status: 'attending' | 'not_attending' | 'maybe') => {
    console.log('Supabase not configured - cannot update RSVP:', eventId, status)
    throw new Error('Database not configured - please set up Supabase')
  }, [])

  const addComment = useCallback(async (eventId: string, text: string) => {
    console.log('Supabase not configured - cannot add comment:', eventId, text)
    throw new Error('Database not configured - please set up Supabase')
  }, [])

  return {
    events,
    pendingEvents,
    loading,
    error,
    createEvent,
    updateEvent,
    updateEventStatus,
    deleteEvent,
    updateRSVP,
    addComment,
    refreshEvents: loadEvents,
    refreshPendingEvents: loadPendingEvents
  }
}