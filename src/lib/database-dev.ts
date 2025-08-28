// Development database implementation that falls back gracefully
import { validateEventData, sanitizeInput } from '../utils/security'

// Simple types for development
export interface EventRow {
  id: string
  title: string
  date: string
  time: string
  location: string
  description: string
  category: string | null
  is_free: boolean
  is_accessible: boolean
  submitted_by: string | null
  status: 'approved' | 'pending' | 'rejected'
  created_at: string
  updated_at: string
  link?: string
}

export interface CommentRow {
  id: string
  event_id: string
  user_id: string
  user_name: string
  text: string
  created_at: string
  updated_at: string
}

export interface RSVPRow {
  id: string
  event_id: string
  user_id: string
  user_email: string
  status: 'attending' | 'not_attending' | 'maybe'
  created_at: string
  updated_at: string
}

export interface UserRow {
  id: string
  email: string
  name: string | null
  image: string | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && 
         process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://localhost:54321' &&
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && 
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-key'
}

// Get supabase client dynamically
const getSupabaseClient = async () => {
  if (!isSupabaseConfigured()) {
    return null
  }
  
  try {
    // Try to create Supabase client
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
    return createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.warn('Supabase client creation failed, falling back to mock data:', error)
    return null
  }
}

// Event service with fallback
export const eventService = {
  async getApprovedEvents(): Promise<EventRow[]> {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      console.log('Using mock data - Supabase not configured')
      return []
    }

    try {
      const { data, error: _error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'approved')
        .order('date', { ascending: true })

      if (_error) {
        console.error('Error fetching events:', _error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Database error:', error)
      return []
    }
  },

  async getPendingEvents(): Promise<EventRow[]> {
    const supabase = await getSupabaseClient()
    if (!supabase) return []

    try {
      const { data, error: _error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      return data || []
    } catch (error) {
      console.error('Database error:', error)
      return []
    }
  },

  async getUserEvents(userId: string): Promise<EventRow[]> {
    const supabase = await getSupabaseClient()
    if (!supabase) return []

    try {
      const { data, error: _error } = await supabase
        .from('events')
        .select('*')
        .eq('submitted_by', userId)
        .order('created_at', { ascending: false })

      return data || []
    } catch (error) {
      console.error('Database error:', error)
      return []
    }
  },

  async createEvent(eventData: Partial<EventRow>): Promise<EventRow | null> {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      console.log('Cannot create event - Supabase not configured')
      return null
    }

    // Validate and sanitize input
    const validationResult = validateEventData({
      title: eventData.title || '',
      date: eventData.date || '',
      time: eventData.time || '',
      location: eventData.location || '',
      description: eventData.description || '',
      category: eventData.category || '',
      isFree: eventData.is_free || false,
      isAccessible: eventData.is_accessible || false
    })

    if (!validationResult.isValid) {
      throw new Error(validationResult.errors.join(', '))
    }

    const sanitizedData = {
      ...eventData,
      title: sanitizeInput(eventData.title || ''),
      description: sanitizeInput(eventData.description || ''),
      location: sanitizeInput(eventData.location || ''),
      category: eventData.category ? sanitizeInput(eventData.category) : null,
      status: 'pending' as const
    }

    try {
      const { data, error: _error } = await supabase
        .from('events')
        .insert([sanitizedData] as unknown)
        .select()
        .single()

      if (_error) {
        console.error('Error creating event:', _error)
        throw new Error('Failed to create event')
      }

      return data
    } catch (error) {
      console.error('Database error:', error)
      throw new Error('Failed to create event')
    }
  },

  async updateEvent(eventId: string, updates: Partial<EventRow>): Promise<EventRow | null> {
    const supabase = await getSupabaseClient()
    if (!supabase) return null

    // Sanitize string updates
    const sanitizedUpdates = { ...updates }
    if (updates.title) sanitizedUpdates.title = sanitizeInput(updates.title)
    if (updates.location) sanitizedUpdates.location = sanitizeInput(updates.location)
    if (updates.description) sanitizedUpdates.description = sanitizeInput(updates.description)
    if (updates.category) sanitizedUpdates.category = sanitizeInput(updates.category)

    try {
      const { data, error: _error } = await supabase
        .from('events')
        .update(sanitizedUpdates as Record<string, unknown>)
        .eq('id', eventId)
        .select()
        .single()

      if (_error) {
        console.error('Error updating event:', _error)
        throw new Error('Failed to update event')
      }

      return data
    } catch (error) {
      console.error('Database error:', error)
      return null
    }
  },

  async deleteEvent(eventId: string): Promise<boolean> {
    const supabase = await getSupabaseClient()
    if (!supabase) return false

    try {
      const { error: _error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      if (_error) {
        console.error('Error deleting event:', _error)
        return false
      }

      return true
    } catch (error) {
      console.error('Database error:', error)
      return false
    }
  },

  async updateEventStatus(eventId: string, status: 'approved' | 'rejected'): Promise<EventRow | null> {
    return this.updateEvent(eventId, { status })
  }
}

// Comment service with fallback
export const commentService = {
  async getEventComments(eventId: string): Promise<CommentRow[]> {
    const supabase = await getSupabaseClient()
    if (!supabase) return []

    try {
      const { data, error: _error } = await supabase
        .from('comments')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })

      return data || []
    } catch (error) {
      console.error('Database error:', error)
      return []
    }
  },

  async createComment(commentData: Partial<CommentRow>): Promise<CommentRow | null> {
    const supabase = await getSupabaseClient()
    if (!supabase) return null

    const sanitizedData = {
      ...commentData,
      text: sanitizeInput(commentData.text || ''),
      user_name: sanitizeInput(commentData.user_name || '')
    }

    try {
      const { data, error: _error } = await supabase
        .from('comments')
        .insert([sanitizedData] as unknown)
        .select()
        .single()

      if (_error) {
        console.error('Error creating comment:', _error)
        throw new Error('Failed to create comment')
      }

      return data
    } catch (error) {
      console.error('Database error:', error)
      return null
    }
  },

  async updateComment(commentId: string, text: string): Promise<CommentRow | null> {
    const supabase = await getSupabaseClient()
    if (!supabase) return null

    try {
      const { data, error: _error } = await supabase
        .from('comments')
        .update({ text: sanitizeInput(text) } as Record<string, unknown>)
        .eq('id', commentId)
        .select()
        .single()

      if (_error) {
        console.error('Error updating comment:', _error)
        throw new Error('Failed to update comment')
      }

      return data
    } catch (error) {
      console.error('Database error:', error)
      return null
    }
  },

  async deleteComment(commentId: string): Promise<boolean> {
    const supabase = await getSupabaseClient()
    if (!supabase) return false

    try {
      const { error: _error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      return !_error
    } catch (error) {
      console.error('Database error:', error)
      return false
    }
  }
}

// RSVP service with fallback
export const rsvpService = {
  async getEventRSVPs(eventId: string): Promise<RSVPRow[]> {
    const supabase = await getSupabaseClient()
    if (!supabase) return []

    try {
      const { data, error: _error } = await supabase
        .from('rsvps')
        .select('*')
        .eq('event_id', eventId)

      return data || []
    } catch (error) {
      console.error('Database error:', error)
      return []
    }
  },

  async getEventRSVPCounts(eventId: string): Promise<{ attending: number; not_attending: number; maybe: number }> {
    const rsvps = await this.getEventRSVPs(eventId)
    const counts = { attending: 0, not_attending: 0, maybe: 0 }
    
    rsvps.forEach(rsvp => {
      counts[rsvp.status]++
    })

    return counts
  },

  async updateRSVP(eventId: string, userId: string, userEmail: string, status: 'attending' | 'not_attending' | 'maybe'): Promise<RSVPRow | null> {
    const supabase = await getSupabaseClient()
    if (!supabase) return null

    const rsvpData = {
      event_id: eventId,
      user_id: userId,
      user_email: userEmail,
      status
    }

    try {
      const { data, error: _error } = await supabase
        .from('rsvps')
        .upsert([rsvpData] as unknown)
        .select()
        .single()

      if (_error) {
        console.error('Error updating RSVP:', _error)
        throw new Error('Failed to update RSVP')
      }

      return data
    } catch (error) {
      console.error('Database error:', error)
      return null
    }
  },

  async getUserRSVP(eventId: string, userId: string): Promise<RSVPRow | null> {
    const supabase = await getSupabaseClient()
    if (!supabase) return null

    try {
      const { data, error: _error } = await supabase
        .from('rsvps')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single()

      if (_error && _error.code !== 'PGRST116') {
        console.error('Error fetching user RSVP:', _error)
        return null
      }

      return data || null
    } catch (error) {
      console.error('Database error:', error)
      return null
    }
  }
}

// User service with fallback
export const userService = {
  async getOrCreateUser(email: string, name?: string, image?: string): Promise<UserRow | null> {
    const supabase = await getSupabaseClient()
    if (!supabase) return null

    try {
      // First try to get existing user
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (existingUser) {
        return existingUser
      }

      // If user doesn't exist and we have required data, create them
      if (name) {
        const { data, error: _error } = await supabase
          .from('users')
          .insert([{
            email,
            name: sanitizeInput(name),
            image,
            is_admin: email.endsWith('@newwestminster.ca')
          }] as unknown)
          .select()
          .single()

        if (_error) {
          console.error('Error creating user:', _error)
          return null
        }

        return data
      }

      return null
    } catch (error) {
      console.error('Database error:', error)
      return null
    }
  },

  async updateUser(userId: string, updates: Partial<{ name: string; image: string }>): Promise<UserRow | null> {
    const supabase = await getSupabaseClient()
    if (!supabase) return null

    const sanitizedUpdates: Record<string, string> = {}
    if (updates.name) sanitizedUpdates.name = sanitizeInput(updates.name)
    if (updates.image) sanitizedUpdates.image = updates.image

    try {
      const { data, error: _error } = await supabase
        .from('users')
        .update(sanitizedUpdates as Record<string, unknown>)
        .eq('id', userId)
        .select()
        .single()

      if (_error) {
        console.error('Error updating user:', _error)
        return null
      }

      return data
    } catch (error) {
      console.error('Database error:', error)
      return null
    }
  }
}

// Real-time subscriptions with fallback
export const subscriptions = {
  subscribeToEvents(callback: (payload: unknown) => void) {
    const mockSubscription = {
      unsubscribe: () => console.log('Mock unsubscribe from events')
    }

    if (!isSupabaseConfigured()) {
      console.log('Mock subscription to events - Supabase not configured')
      return mockSubscription
    }

    getSupabaseClient().then(supabase => {
      if (!supabase) return mockSubscription

      return supabase
        .channel('events_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'events' },
          callback
        )
        .subscribe()
    }).catch(error => {
      console.error('Subscription error:', error)
      return mockSubscription
    })

    return mockSubscription
  },

  subscribeToEventComments(eventId: string, callback: (payload: unknown) => void) {
    const mockSubscription = {
      unsubscribe: () => console.log('Mock unsubscribe from comments')
    }

    if (!isSupabaseConfigured()) {
      console.log('Mock subscription to comments - Supabase not configured')
      return mockSubscription
    }

    getSupabaseClient().then(supabase => {
      if (!supabase) return mockSubscription

      return supabase
        .channel(`comments_${eventId}`)
        .on('postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'comments',
            filter: `event_id=eq.${eventId}`
          },
          callback
        )
        .subscribe()
    }).catch(error => {
      console.error('Subscription error:', error)
      return mockSubscription
    })

    return mockSubscription
  },

  subscribeToEventRSVPs(eventId: string, callback: (payload: unknown) => void) {
    const mockSubscription = {
      unsubscribe: () => console.log('Mock unsubscribe from RSVPs')
    }

    if (!isSupabaseConfigured()) {
      console.log('Mock subscription to RSVPs - Supabase not configured')
      return mockSubscription
    }

    getSupabaseClient().then(supabase => {
      if (!supabase) return mockSubscription

      return supabase
        .channel(`rsvps_${eventId}`)
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'rsvps',
            filter: `event_id=eq.${eventId}`
          },
          callback
        )
        .subscribe()
    }).catch(error => {
      console.error('Subscription error:', error)
      return mockSubscription
    })

    return mockSubscription
  }
}