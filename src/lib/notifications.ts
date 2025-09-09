// Real-time notifications system for New West Event Calendar
import { useEffect, useCallback, useState } from 'react'

export interface Notification {
  id: string
  type: 'event_approved' | 'event_updated' | 'new_comment' | 'new_rsvp' | 'event_reminder'
  title: string
  message: string
  timestamp: string
  read: boolean
  eventId?: string
  userId?: string
}

// Browser notification permissions
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission === 'denied') {
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

// Show browser notification
export const showBrowserNotification = (title: string, options: NotificationOptions = {}) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'nw-events',
      renotify: true,
      ...options
    })

    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close()
    }, 5000)

    return notification
  }
}

// In-app notification toast
export const useToastNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false
    }

    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]) // Keep only 5 most recent

    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id))
    }, 5000)

    return newNotification
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  return {
    notifications,
    addNotification,
    markAsRead,
    removeNotification,
    clearAll
  }
}

// Real-time event notifications
export const useEventNotifications = (currentUserId?: string, isAdmin?: boolean) => {
  const { addNotification } = useToastNotifications()

  const handleEventChange = useCallback((payload: any) => {
    if (!payload || typeof payload !== 'object') return

    const { eventType, new: newRecord, old: oldRecord } = payload

    switch (eventType) {
      case 'INSERT':
        if (newRecord?.status === 'pending' && isAdmin) {
          addNotification({
            type: 'event_updated',
            title: '📅 New Event Submitted',
            message: `"${newRecord.title}" needs approval`
          })

          // Browser notification for admins
          showBrowserNotification('New Event Submitted', {
            body: `"${newRecord.title}" is pending approval`,
            tag: `event-${newRecord.id}`
          })
        }
        break

      case 'UPDATE':
        if (oldRecord?.status === 'pending' && newRecord?.status === 'approved') {
          if (newRecord.submitted_by === currentUserId) {
            addNotification({
              type: 'event_approved',
              title: '✅ Event Approved',
              message: `"${newRecord.title}" has been approved and is now live!`,
              eventId: newRecord.id
            })

            showBrowserNotification('Event Approved!', {
              body: `"${newRecord.title}" is now live`,
              tag: `approved-${newRecord.id}`
            })
          }
        }

        if (newRecord?.title !== oldRecord?.title || newRecord?.date !== oldRecord?.date) {
          addNotification({
            type: 'event_updated',
            title: '📝 Event Updated',
            message: `"${newRecord.title}" has been updated`,
            eventId: newRecord.id
          })
        }
        break
    }
  }, [currentUserId, isAdmin, addNotification])

  const handleCommentChange = useCallback((payload: any) => {
    if (!payload || typeof payload !== 'object') return

    const { eventType, new: newRecord } = payload

    if (eventType === 'INSERT' && newRecord?.user_id !== currentUserId) {
      addNotification({
        type: 'new_comment',
        title: '💬 New Comment',
        message: `${newRecord.user_name} commented on an event`,
        eventId: newRecord.event_id
      })
    }
  }, [currentUserId, addNotification])

  const handleRSVPChange = useCallback((payload: any) => {
    if (!payload || typeof payload !== 'object') return

    const { eventType, new: newRecord } = payload

    if (eventType === 'INSERT' && newRecord?.status === 'attending') {
      addNotification({
        type: 'new_rsvp',
        title: '🎉 New RSVP',
        message: `Someone is attending your event!`,
        eventId: newRecord.event_id
      })
    }
  }, [addNotification])

  return {
    handleEventChange,
    handleCommentChange,
    handleRSVPChange
  }
}

// Event reminder system
export const useEventReminders = (events: any[], currentUserId?: string) => {
  const { addNotification } = useToastNotifications()

  useEffect(() => {
    if (!events.length || !currentUserId) return

    const checkReminders = () => {
      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      
      events.forEach(event => {
        const eventDate = new Date(`${event.date} ${event.time}`)
        const userRSVP = event.user_rsvp?.status
        
        // Remind 24 hours before for events user is attending
        if (userRSVP === 'attending' && 
            eventDate > now && 
            eventDate <= tomorrow) {
          
          const reminderKey = `reminder-${event.id}-${currentUserId}`
          const hasShownReminder = localStorage.getItem(reminderKey)
          
          if (!hasShownReminder) {
            addNotification({
              type: 'event_reminder',
              title: '⏰ Event Reminder',
              message: `"${event.title}" is tomorrow at ${event.time}`,
              eventId: event.id
            })

            showBrowserNotification('Event Reminder', {
              body: `"${event.title}" is tomorrow at ${event.time}`,
              tag: `reminder-${event.id}`
            })

            localStorage.setItem(reminderKey, 'true')
          }
        }
      })
    }

    // Check reminders every hour
    const interval = setInterval(checkReminders, 60 * 60 * 1000)
    checkReminders() // Check immediately

    return () => clearInterval(interval)
  }, [events, currentUserId, addNotification])
}

// Notification preferences (stored in localStorage)
export interface NotificationPreferences {
  browser: boolean
  events: boolean
  comments: boolean
  rsvps: boolean
  reminders: boolean
}

export const useNotificationPreferences = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notification-preferences')
      if (saved) {
        return JSON.parse(saved)
      }
    }
    return {
      browser: true,
      events: true,
      comments: true,
      rsvps: true,
      reminders: true
    }
  })

  const updatePreferences = useCallback((updates: Partial<NotificationPreferences>) => {
    const newPreferences = { ...preferences, ...updates }
    setPreferences(newPreferences)
    if (typeof window !== 'undefined') {
      localStorage.setItem('notification-preferences', JSON.stringify(newPreferences))
    }
  }, [preferences])

  return { preferences, updatePreferences }
}