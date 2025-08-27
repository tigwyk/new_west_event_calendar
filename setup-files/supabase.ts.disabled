import { createClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Database types based on our schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          image: string | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          image?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          image?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
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
        }
        Insert: {
          id?: string
          title: string
          date: string
          time: string
          location: string
          description: string
          category?: string | null
          is_free?: boolean
          is_accessible?: boolean
          submitted_by?: string | null
          status?: 'approved' | 'pending' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          date?: string
          time?: string
          location?: string
          description?: string
          category?: string | null
          is_free?: boolean
          is_accessible?: boolean
          submitted_by?: string | null
          status?: 'approved' | 'pending' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          event_id: string
          user_id: string
          user_name: string
          text: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          user_name: string
          text: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          user_name?: string
          text?: string
          created_at?: string
          updated_at?: string
        }
      }
      rsvps: {
        Row: {
          id: string
          event_id: string
          user_id: string
          user_email: string
          status: 'attending' | 'not_attending' | 'maybe'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          user_email: string
          status?: 'attending' | 'not_attending' | 'maybe'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          user_email?: string
          status?: 'attending' | 'not_attending' | 'maybe'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Client-side Supabase client
export const createClientComponentClient = () =>
  createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client for App Router
export const createServerComponentClient = async () => {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

// Server-side Supabase client for API routes
export const createRouteHandlerClient = (request: NextRequest) =>
  createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

// Server-side Supabase client for middleware
export const createMiddlewareClient = (request: NextRequest, response: NextResponse) =>
  createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: Record<string, unknown>) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

// Legacy client for backward compatibility
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Type exports for use in components
export type EventRow = Database['public']['Tables']['events']['Row']
export type EventInsert = Database['public']['Tables']['events']['Insert']
export type EventUpdate = Database['public']['Tables']['events']['Update']

export type UserRow = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type CommentRow = Database['public']['Tables']['comments']['Row']
export type CommentInsert = Database['public']['Tables']['comments']['Insert']
export type CommentUpdate = Database['public']['Tables']['comments']['Update']

export type RSVPRow = Database['public']['Tables']['rsvps']['Row']
export type RSVPInsert = Database['public']['Tables']['rsvps']['Insert']
export type RSVPUpdate = Database['public']['Tables']['rsvps']['Update']