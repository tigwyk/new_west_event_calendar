// Simplified database service for build compatibility
// This provides the same interface but handles cases where Supabase isn't configured yet

export interface SimpleEvent {
  id: string
  title: string
  date: string
  time: string
  location: string
  description: string
  category?: string
  is_free?: boolean
  is_accessible?: boolean
  submitted_by?: string
  status: 'approved' | 'pending' | 'rejected'
  created_at: string
  updated_at: string
}

export interface SimpleComment {
  id: string
  event_id: string
  user_id: string
  user_name: string
  text: string
  created_at: string
  updated_at: string
}

export interface SimpleRSVP {
  id: string
  event_id: string
  user_id: string
  user_email: string
  status: 'attending' | 'not_attending' | 'maybe'
  created_at: string
  updated_at: string
}

export interface SimpleUser {
  id: string
  email: string
  name: string | null
  image: string | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

// Mock implementations that return empty data when Supabase isn't configured
export const eventService = {
  async getApprovedEvents(): Promise<SimpleEvent[]> {
    console.log('Supabase not configured, returning empty events')
    return []
  },

  async getPendingEvents(): Promise<SimpleEvent[]> {
    console.log('Supabase not configured, returning empty pending events')
    return []
  },

  async getUserEvents(userId: string): Promise<SimpleEvent[]> {
    console.log('Supabase not configured, returning empty user events')
    return []
  },

  async createEvent(eventData: Partial<SimpleEvent>): Promise<SimpleEvent | null> {
    console.log('Supabase not configured, cannot create event')
    return null
  },

  async updateEvent(eventId: string, updates: Partial<SimpleEvent>): Promise<SimpleEvent | null> {
    console.log('Supabase not configured, cannot update event')
    return null
  },

  async deleteEvent(eventId: string): Promise<boolean> {
    console.log('Supabase not configured, cannot delete event')
    return false
  },

  async updateEventStatus(eventId: string, status: 'approved' | 'rejected'): Promise<SimpleEvent | null> {
    console.log('Supabase not configured, cannot update event status')
    return null
  }
}

export const commentService = {
  async getEventComments(eventId: string): Promise<SimpleComment[]> {
    console.log('Supabase not configured, returning empty comments')
    return []
  },

  async createComment(commentData: Partial<SimpleComment>): Promise<SimpleComment | null> {
    console.log('Supabase not configured, cannot create comment')
    return null
  },

  async updateComment(commentId: string, text: string): Promise<SimpleComment | null> {
    console.log('Supabase not configured, cannot update comment')
    return null
  },

  async deleteComment(commentId: string): Promise<boolean> {
    console.log('Supabase not configured, cannot delete comment')
    return false
  }
}

export const rsvpService = {
  async getEventRSVPs(eventId: string): Promise<SimpleRSVP[]> {
    console.log('Supabase not configured, returning empty RSVPs')
    return []
  },

  async getEventRSVPCounts(eventId: string): Promise<{ attending: number; not_attending: number; maybe: number }> {
    console.log('Supabase not configured, returning zero RSVP counts')
    return { attending: 0, not_attending: 0, maybe: 0 }
  },

  async updateRSVP(eventId: string, userId: string, userEmail: string, status: 'attending' | 'not_attending' | 'maybe'): Promise<SimpleRSVP | null> {
    console.log('Supabase not configured, cannot update RSVP')
    return null
  },

  async getUserRSVP(eventId: string, userId: string): Promise<SimpleRSVP | null> {
    console.log('Supabase not configured, returning null user RSVP')
    return null
  }
}

export const userService = {
  async getOrCreateUser(email: string, name?: string, image?: string): Promise<SimpleUser | null> {
    console.log('Supabase not configured, cannot get/create user')
    return null
  },

  async updateUser(userId: string, updates: Partial<{ name: string; image: string }>): Promise<SimpleUser | null> {
    console.log('Supabase not configured, cannot update user')
    return null
  }
}

export const subscriptions = {
  subscribeToEvents(callback: (payload: unknown) => void) {
    console.log('Supabase not configured, mock subscription')
    return {
      unsubscribe: () => console.log('Mock unsubscribe')
    }
  },

  subscribeToEventComments(eventId: string, callback: (payload: unknown) => void) {
    console.log('Supabase not configured, mock comment subscription')
    return {
      unsubscribe: () => console.log('Mock unsubscribe')
    }
  },

  subscribeToEventRSVPs(eventId: string, callback: (payload: unknown) => void) {
    console.log('Supabase not configured, mock RSVP subscription')
    return {
      unsubscribe: () => console.log('Mock unsubscribe')
    }
  }
}