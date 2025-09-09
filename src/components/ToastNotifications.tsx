"use client"
import React from 'react'
import { useToastNotifications, type Notification } from '../lib/notifications'

interface ToastNotificationProps {
  notification: Notification
  onClose: (id: string) => void
  onMarkRead: (id: string) => void
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  notification,
  onClose,
  onMarkRead
}) => {
  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'event_approved': return '✅'
      case 'event_updated': return '📅'
      case 'new_comment': return '💬'
      case 'new_rsvp': return '🎉'
      case 'event_reminder': return '⏰'
      default: return '📢'
    }
  }

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'event_approved': return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
      case 'event_updated': return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200'
      case 'new_comment': return 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-200'
      case 'new_rsvp': return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200'
      case 'event_reminder': return 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-200'
      default: return 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-200'
    }
  }

  const timeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diff = now.getTime() - time.getTime()
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }

  return (
    <div
      className={`
        relative p-4 rounded-lg border shadow-lg max-w-sm w-full
        transition-all duration-300 ease-in-out
        ${getTypeColor(notification.type)}
        ${notification.read ? 'opacity-75' : ''}
        animate-slide-in-right
      `}
      onClick={() => onMarkRead(notification.id)}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0">{getTypeIcon(notification.type)}</span>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold truncate">{notification.title}</h4>
          <p className="text-xs mt-1 break-words">{notification.message}</p>
          <p className="text-xs mt-2 opacity-60">{timeAgo(notification.timestamp)}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose(notification.id)
          }}
          className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label="Close notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {!notification.read && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></div>
      )}
    </div>
  )
}

const ToastNotifications: React.FC = () => {
  const { notifications, removeNotification, markAsRead, clearAll } = useToastNotifications()

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-h-screen overflow-y-auto">
      <div className="flex justify-end">
        {notifications.length > 1 && (
          <button
            onClick={clearAll}
            className="mb-2 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            Clear all ({notifications.length})
          </button>
        )}
      </div>
      
      {notifications.map((notification) => (
        <ToastNotification
          key={notification.id}
          notification={notification}
          onClose={removeNotification}
          onMarkRead={markAsRead}
        />
      ))}
    </div>
  )
}

export default ToastNotifications

// CSS for animations (add to globals.css)
export const toastAnimationStyles = `
  @keyframes slide-in-right {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .animate-slide-in-right {
    animation: slide-in-right 0.3s ease-out;
  }
`