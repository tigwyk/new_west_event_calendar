import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { eventService, commentService, rsvpService, userService, subscriptions, type EventRow, type CommentRow, type RSVPRow } from '../lib/database-dev'

// Enhanced event type with related data  
export interface EventWithDetails extends EventRow {
  rsvps?: RSVPRow[]
  comments?: CommentRow[]
  rsvp_counts?: {
    attending: number
    not_attending: number
    maybe: number
  }
  user_rsvp?: RSVPRow | null
}

export const useEvents = () => {
  const { data: session } = useSession()
  const [events, setEvents] = useState<EventWithDetails[]>([])
  const [pendingEvents, setPendingEvents] = useState<EventWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const currentUser = useMemo(() => {
    const user = session?.user ? {
      id: session.user.email || 'anonymous',
      email: session.user.email || '',
      name: session.user.name || '',
      isAdmin: session.user.email?.endsWith('@newwestevents.com') || false
    } : null
    
    // Debug logging
    if (user) {
      console.log('🎣 useEvents currentUser:', {
        user,
        isAdmin: user.isAdmin,
        email: user.email,
        sessionUserEmail: session?.user?.email
      })
    }
    
    return user
  }, [session?.user])

  // Load approved events
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true)
      const eventsData = await eventService.getApprovedEvents()
      
      // Enhance events with RSVP counts and user's RSVP status
      const enhancedEvents = await Promise.all(
        eventsData.map(async (event) => {
          const [rsvpCounts, userRsvp] = await Promise.all([
            rsvpService.getEventRSVPCounts(event.id),
            currentUser ? rsvpService.getUserRSVP(event.id, currentUser.id) : Promise.resolve(null)
          ])

          return {
            ...event,
            rsvp_counts: rsvpCounts,
            user_rsvp: userRsvp
          }
        })
      )

      setEvents(enhancedEvents)
      setError(null)
    } catch (err) {
      console.error('Error loading events:', err)
      setError('Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  // Load pending events (admin only)
  const loadPendingEvents = useCallback(async () => {
    if (!currentUser?.isAdmin) return

    try {
      const pendingData = await eventService.getPendingEvents()
      setPendingEvents(pendingData)
    } catch (err) {
      console.error('Error loading pending events:', err)
    }
  }, [currentUser?.isAdmin])

  // Create a new event
  const createEvent = useCallback(async (eventData: {
    title: string
    date: string
    time: string
    location: string
    description: string
    category?: string
    isFree?: boolean
    isAccessible?: boolean
  }) => {
    if (!currentUser) throw new Error('User must be logged in to create events')

    // Ensure user exists in database
    await userService.getOrCreateUser(
      currentUser.email,
      currentUser.name,
      session?.user?.image || undefined
    )

    const newEvent = await eventService.createEvent({
      title: eventData.title,
      date: eventData.date,
      time: eventData.time,
      location: eventData.location,
      description: eventData.description,
      category: eventData.category || null,
      is_free: eventData.isFree || false,
      is_accessible: eventData.isAccessible || false,
      submitted_by: currentUser.id
    })

    // Refresh pending events for admin users
    if (currentUser.isAdmin) {
      loadPendingEvents()
    }

    return newEvent
  }, [currentUser, session?.user?.image, loadPendingEvents])

  // Update event (admin only)
  const updateEvent = useCallback(async (eventId: string, updates: Partial<EventRow>) => {
    if (!currentUser?.isAdmin) throw new Error('Only admins can update events')

    const updatedEvent = await eventService.updateEvent(eventId, updates)
    
    // Refresh events
    loadEvents()
    loadPendingEvents()
    
    return updatedEvent
  }, [currentUser?.isAdmin, loadEvents, loadPendingEvents])

  // Approve/reject event (admin only)
  const updateEventStatus = useCallback(async (eventId: string, status: 'approved' | 'rejected') => {
    if (!currentUser?.isAdmin) throw new Error('Only admins can approve/reject events')

    const updatedEvent = await eventService.updateEventStatus(eventId, status)
    
    // Refresh both lists
    loadEvents()
    loadPendingEvents()
    
    return updatedEvent
  }, [currentUser?.isAdmin, loadEvents, loadPendingEvents])

  // Delete event (admin only)
  const deleteEvent = useCallback(async (eventId: string) => {
    if (!currentUser?.isAdmin) throw new Error('Only admins can delete events')

    const success = await eventService.deleteEvent(eventId)
    
    if (success) {
      // Refresh both lists
      loadEvents()
      loadPendingEvents()
    }
    
    return success
  }, [currentUser?.isAdmin, loadEvents, loadPendingEvents])

  // Update RSVP status
  const updateRSVP = useCallback(async (eventId: string, status: 'attending' | 'not_attending' | 'maybe') => {
    if (!currentUser) throw new Error('User must be logged in to RSVP')

    const updatedRSVP = await rsvpService.updateRSVP(eventId, currentUser.id, currentUser.email, status)
    
    // Update the event in state with new RSVP data
    setEvents(prevEvents =>
      prevEvents.map(event => {
        if (event.id === eventId) {
          return {
            ...event,
            user_rsvp: updatedRSVP
          }
        }
        return event
      })
    )

    // Refresh RSVP counts
    const newCounts = await rsvpService.getEventRSVPCounts(eventId)
    setEvents(prevEvents =>
      prevEvents.map(event => {
        if (event.id === eventId) {
          return {
            ...event,
            rsvp_counts: newCounts
          }
        }
        return event
      })
    )

    return updatedRSVP
  }, [currentUser])

  // Add comment to event
  const addComment = useCallback(async (eventId: string, text: string) => {
    if (!currentUser) throw new Error('User must be logged in to comment')

    const newComment = await commentService.createComment({
      event_id: eventId,
      user_id: currentUser.id,
      user_name: currentUser.name,
      text
    })

    // Update the event in state with new comment (only if comment creation succeeded)
    if (newComment) {
      setEvents(prevEvents =>
        prevEvents.map(event => {
          if (event.id === eventId) {
            return {
              ...event,
              comments: [...(event.comments || []), newComment]
            }
          }
          return event
        })
      )
    }

    return newComment
  }, [currentUser])

  // Set up real-time subscriptions
  useEffect(() => {
    // Subscribe to event changes
    const eventSubscription = subscriptions.subscribeToEvents((payload) => {
      console.log('Event change received:', payload)
      
      // Type guard for payload structure
      if (typeof payload === 'object' && payload && 'eventType' in payload && 'new' in payload) {
        const typedPayload = payload as { eventType: string; new: { status?: string } }
        if (typedPayload.eventType === 'UPDATE' && typedPayload.new.status === 'approved') {
          // Event was approved, refresh approved events
          loadEvents()
        } else if (typedPayload.eventType === 'INSERT') {
          // New event added, refresh pending events if admin
          if (currentUser?.isAdmin) {
            loadPendingEvents()
          }
        }
      }
    })

    return () => {
      eventSubscription.unsubscribe()
    }
  }, [loadEvents, loadPendingEvents, currentUser?.isAdmin])

  // Initial load
  useEffect(() => {
    loadEvents()
    if (currentUser?.isAdmin) {
      loadPendingEvents()
    }
  }, [loadEvents, loadPendingEvents, currentUser?.isAdmin])

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