"use client"
import React, { useState, useEffect, useCallback } from 'react'
import { subscriptions, rsvpService } from '../lib/database-dev'

interface RSVPData {
  attending: number
  not_attending: number
  maybe: number
}

interface UserRSVP {
  id: string
  event_id: string
  user_id: string
  user_email: string
  status: 'attending' | 'not_attending' | 'maybe'
  created_at: string
  updated_at: string
}

interface RealTimeRSVPProps {
  eventId: string
  currentUser?: {
    id: string
    email: string
    name: string
  } | null
  initialCounts?: RSVPData
  initialUserRSVP?: UserRSVP | null
  maxCapacity?: number | null
}

const RealTimeRSVP: React.FC<RealTimeRSVPProps> = ({
  eventId,
  currentUser,
  initialCounts = { attending: 0, not_attending: 0, maybe: 0 },
  initialUserRSVP = null,
  maxCapacity = null
}) => {
  const [rsvpCounts, setRSVPCounts] = useState<RSVPData>(initialCounts)
  const [userRSVP, setUserRSVP] = useState<UserRSVP | null>(initialUserRSVP)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showWaitingList, setShowWaitingList] = useState(false)

  // Load initial data
  useEffect(() => {
    const loadRSVPData = async () => {
      try {
        const [counts, userRsvpData] = await Promise.all([
          rsvpService.getEventRSVPCounts(eventId),
          currentUser ? rsvpService.getUserRSVP(eventId, currentUser.id) : Promise.resolve(null)
        ])
        
        setRSVPCounts(counts)
        setUserRSVP(userRsvpData)
      } catch (error) {
        console.error('Error loading RSVP data:', error)
      }
    }

    if (initialCounts.attending === 0 && initialCounts.maybe === 0 && initialCounts.not_attending === 0) {
      loadRSVPData()
    }
  }, [eventId, currentUser, initialCounts])

  // Set up real-time subscription
  useEffect(() => {
    const subscription = subscriptions.subscribeToEventRSVPs(
      eventId,
      (payload: any) => {
        console.log('RSVP change received:', payload)
        
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          // Refresh counts when any RSVP changes
          rsvpService.getEventRSVPCounts(eventId).then(counts => {
            setRSVPCounts(counts)
          })

          // Update user's RSVP if it's their change
          if (payload.new && currentUser && payload.new.user_id === currentUser.id) {
            setUserRSVP(payload.new)
          }
        } else if (payload.eventType === 'DELETE') {
          // Refresh counts when RSVP is deleted
          rsvpService.getEventRSVPCounts(eventId).then(counts => {
            setRSVPCounts(counts)
          })

          // Clear user RSVP if it's their deletion
          if (payload.old && currentUser && payload.old.user_id === currentUser.id) {
            setUserRSVP(null)
          }
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [eventId, currentUser])

  const handleRSVPUpdate = useCallback(async (status: 'attending' | 'not_attending' | 'maybe') => {
    if (!currentUser || isUpdating) return

    setIsUpdating(true)
    try {
      const updatedRSVP = await rsvpService.updateRSVP(
        eventId,
        currentUser.id,
        currentUser.email,
        status
      )

      if (updatedRSVP) {
        setUserRSVP(updatedRSVP)
        // Refresh counts
        const newCounts = await rsvpService.getEventRSVPCounts(eventId)
        setRSVPCounts(newCounts)
      }
    } catch (error) {
      console.error('Error updating RSVP:', error)
      alert('Failed to update RSVP. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }, [currentUser, eventId, isUpdating])

  const totalRSVPs = rsvpCounts.attending + rsvpCounts.maybe + rsvpCounts.not_attending
  const positiveRSVPs = rsvpCounts.attending + rsvpCounts.maybe
  const isAtCapacity = maxCapacity && rsvpCounts.attending >= maxCapacity
  const isWaitingList = maxCapacity && rsvpCounts.attending >= maxCapacity && userRSVP?.status === 'maybe'

  const getStatusButton = (status: 'attending' | 'not_attending' | 'maybe') => {
    const isSelected = userRSVP?.status === status
    let buttonText = ''
    let buttonClass = ''
    let icon = ''

    switch (status) {
      case 'attending':
        buttonText = isAtCapacity && !isSelected ? 'Join Waitlist' : 'Attending'
        buttonClass = isSelected 
          ? 'bg-green-500 text-white' 
          : 'bg-gray-200 hover:bg-green-100 dark:bg-gray-700 dark:hover:bg-green-800'
        icon = '✓'
        break
      case 'maybe':
        buttonText = 'Maybe'
        buttonClass = isSelected 
          ? 'bg-yellow-500 text-white' 
          : 'bg-gray-200 hover:bg-yellow-100 dark:bg-gray-700 dark:hover:bg-yellow-800'
        icon = '?'
        break
      case 'not_attending':
        buttonText = 'Can\'t Go'
        buttonClass = isSelected 
          ? 'bg-red-500 text-white' 
          : 'bg-gray-200 hover:bg-red-100 dark:bg-gray-700 dark:hover:bg-red-800'
        icon = '✕'
        break
    }

    return (
      <button
        key={status}
        onClick={() => handleRSVPUpdate(status)}
        disabled={isUpdating}
        className={`
          flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-all
          ${buttonClass}
          ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        `}
      >
        <span className="text-base">{icon}</span>
        {buttonText}
        {isUpdating && userRSVP?.status === status && (
          <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
      </button>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border p-4 space-y-4">
      {/* RSVP Status Display */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          🎉 RSVPs
          {totalRSVPs > 0 && (
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live updates enabled"></span>
          )}
        </h3>
        
        {maxCapacity && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {rsvpCounts.attending}/{maxCapacity} spots filled
            {isAtCapacity && <span className="text-red-500 ml-1">• Full</span>}
          </div>
        )}
      </div>

      {/* Live Counts */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 animate-pulse">
            {rsvpCounts.attending}
          </div>
          <div className="text-xs text-green-700 dark:text-green-300">Going</div>
        </div>
        
        <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 animate-pulse">
            {rsvpCounts.maybe}
          </div>
          <div className="text-xs text-yellow-700 dark:text-yellow-300">Maybe</div>
        </div>
        
        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 animate-pulse">
            {rsvpCounts.not_attending}
          </div>
          <div className="text-xs text-red-700 dark:text-red-300">Can't Go</div>
        </div>
      </div>

      {/* Capacity Warning */}
      {maxCapacity && rsvpCounts.attending >= maxCapacity * 0.8 && (
        <div className={`p-3 rounded-lg ${
          isAtCapacity 
            ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
            : 'bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200'
        }`}>
          {isAtCapacity 
            ? '🔴 This event is at capacity. New RSVPs will join the waiting list.'
            : `⚠️ Event is ${Math.round((rsvpCounts.attending / maxCapacity) * 100)}% full. Only ${maxCapacity - rsvpCounts.attending} spots remaining.`
          }
        </div>
      )}

      {/* User RSVP Actions */}
      {currentUser ? (
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {userRSVP 
              ? `Your status: ${userRSVP.status.replace('_', ' ').toLowerCase()} ${isWaitingList ? '(waitlist)' : ''}`
              : 'What\'s your status?'
            }
          </div>
          
          <div className="flex flex-wrap gap-2">
            {getStatusButton('attending')}
            {getStatusButton('maybe')}
            {getStatusButton('not_attending')}
          </div>
        </div>
      ) : (
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Please sign in to RSVP for this event
          </p>
        </div>
      )}

      {/* Waiting List Info */}
      {maxCapacity && rsvpCounts.maybe > 0 && isAtCapacity && (
        <div className="border-t pt-4">
          <button
            onClick={() => setShowWaitingList(!showWaitingList)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showWaitingList ? 'Hide' : 'Show'} waiting list ({rsvpCounts.maybe} people)
          </button>
          
          {showWaitingList && (
            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                There are {rsvpCounts.maybe} people on the waiting list. 
                If someone cancels their attendance, waiting list members will be notified.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RealTimeRSVP