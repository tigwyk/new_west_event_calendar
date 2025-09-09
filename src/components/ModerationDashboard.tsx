"use client"
import React, { useState, useEffect } from 'react'
import { moderationService, type ModerationResult } from '../lib/moderation'

interface ModerationDashboardProps {
  isVisible: boolean
  onClose: () => void
  currentUser?: {
    isAdmin: boolean
  } | null
  pendingEvents?: Array<{
    id: string
    title: string
    description: string
    location: string
    submittedBy?: string
    created_at: string
  }>
}

interface EventModerationData {
  eventId: string
  results: {
    title: ModerationResult
    description: ModerationResult
    location?: ModerationResult
    overallAction: 'approve' | 'review' | 'reject'
    overallAppropriate: boolean
  }
}

const ModerationDashboard: React.FC<ModerationDashboardProps> = ({
  isVisible,
  onClose,
  currentUser,
  pendingEvents = []
}) => {
  const [eventModerations, setEventModerations] = useState<EventModerationData[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)

  // Analyze pending events when dashboard opens
  useEffect(() => {
    if (isVisible && pendingEvents.length > 0 && eventModerations.length === 0) {
      analyzeAllEvents()
    }
  }, [isVisible, pendingEvents])

  const analyzeAllEvents = async () => {
    if (!currentUser?.isAdmin) return
    
    setIsAnalyzing(true)
    const moderations: EventModerationData[] = []

    try {
      for (const event of pendingEvents) {
        const results = moderationService.moderateEvent({
          title: event.title,
          description: event.description,
          location: event.location
        })

        moderations.push({
          eventId: event.id,
          results
        })
      }
      
      setEventModerations(moderations)
    } catch (error) {
      console.error('Error analyzing events:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getRiskBadge = (action: string, score: number) => {
    switch (action) {
      case 'approve':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">
            ✓ Low Risk ({Math.round(score * 100)}%)
          </span>
        )
      case 'review':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200">
            ⚠ Needs Review ({Math.round(score * 100)}%)
          </span>
        )
      case 'reject':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200">
            ✕ High Risk ({Math.round(score * 100)}%)
          </span>
        )
      default:
        return null
    }
  }

  const getActionButton = (action: string, eventId: string) => {
    switch (action) {
      case 'approve':
        return (
          <button className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
            Auto-Approve
          </button>
        )
      case 'review':
        return (
          <button className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors">
            Manual Review
          </button>
        )
      case 'reject':
        return (
          <button className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
            Auto-Reject
          </button>
        )
      default:
        return null
    }
  }

  if (!isVisible || !currentUser?.isAdmin) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              🛡️ Content Moderation Dashboard
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              AI-powered content analysis and moderation tools
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Analysis Status */}
          {isAnalyzing ? (
            <div className="text-center py-12">
              <div className="animate-spin mx-auto w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Analyzing Content...
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Running AI moderation checks on {pendingEvents.length} events
              </p>
            </div>
          ) : eventModerations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Pending Events
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All events have been reviewed or there are no events pending moderation.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-green-700 dark:text-green-300">Auto-Approve</h3>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {eventModerations.filter(e => e.results.overallAction === 'approve').length}
                  </p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">Needs Review</h3>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                    {eventModerations.filter(e => e.results.overallAction === 'review').length}
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-red-700 dark:text-red-300">Auto-Reject</h3>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                    {eventModerations.filter(e => e.results.overallAction === 'reject').length}
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300">Total Events</h3>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {eventModerations.length}
                  </p>
                </div>
              </div>

              {/* Event List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Event Analysis Results</h3>
                
                {eventModerations.map((moderation) => {
                  const event = pendingEvents.find(e => e.id === moderation.eventId)
                  if (!event) return null

                  const isExpanded = selectedEvent === event.id

                  return (
                    <div
                      key={event.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            {event.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Submitted {new Date(event.created_at).toLocaleDateString()}
                            {event.submittedBy && ` by ${event.submittedBy}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {getRiskBadge(
                            moderation.results.overallAction,
                            Math.max(moderation.results.title.score, moderation.results.description.score)
                          )}
                          {getActionButton(moderation.results.overallAction, event.id)}
                        </div>
                      </div>

                      {/* Quick flags summary */}
                      {(moderation.results.title.flags.length > 0 || 
                        moderation.results.description.flags.length > 0 ||
                        moderation.results.location?.flags.length) && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Detected Issues:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {[...moderation.results.title.flags, 
                              ...moderation.results.description.flags,
                              ...(moderation.results.location?.flags || [])]
                              .filter((flag, index, self) => self.indexOf(flag) === index)
                              .map((flag) => (
                              <span
                                key={flag}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200"
                              >
                                {flag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Expand/Collapse Details */}
                      <button
                        onClick={() => setSelectedEvent(isExpanded ? null : event.id)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {isExpanded ? 'Hide Details' : 'Show Details'}
                      </button>

                      {/* Detailed Analysis */}
                      {isExpanded && (
                        <div className="mt-4 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                          {/* Title Analysis */}
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Title Analysis</h5>
                            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                              <p className="text-sm mb-2">"{event.title}"</p>
                              <div className="flex items-center gap-4 text-sm">
                                <span>Score: {Math.round(moderation.results.title.score * 100)}%</span>
                                <span>Flags: {moderation.results.title.flags.length}</span>
                                <span>Action: {moderation.results.title.suggestedAction}</span>
                              </div>
                            </div>
                          </div>

                          {/* Description Analysis */}
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Description Analysis</h5>
                            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                              <p className="text-sm mb-2 line-clamp-3">"{event.description}"</p>
                              <div className="flex items-center gap-4 text-sm">
                                <span>Score: {Math.round(moderation.results.description.score * 100)}%</span>
                                <span>Flags: {moderation.results.description.flags.length}</span>
                                <span>Action: {moderation.results.description.suggestedAction}</span>
                              </div>
                            </div>
                          </div>

                          {/* Location Analysis */}
                          {moderation.results.location && (
                            <div>
                              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Location Analysis</h5>
                              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                                <p className="text-sm mb-2">"{event.location}"</p>
                                <div className="flex items-center gap-4 text-sm">
                                  <span>Score: {Math.round(moderation.results.location.score * 100)}%</span>
                                  <span>Flags: {moderation.results.location.flags.length}</span>
                                  <span>Action: {moderation.results.location.suggestedAction}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Filtered Content Preview */}
                          {(moderation.results.title.filteredContent || 
                            moderation.results.description.filteredContent) && (
                            <div>
                              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                Filtered Content Preview
                              </h5>
                              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border-l-4 border-yellow-400">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                  This shows how the content would appear after automatic filtering.
                                </p>
                                {moderation.results.title.filteredContent && (
                                  <p className="text-sm mt-2 font-medium">
                                    Title: "{moderation.results.title.filteredContent}"
                                  </p>
                                )}
                                {moderation.results.description.filteredContent && (
                                  <p className="text-sm mt-2">
                                    Description: "{moderation.results.description.filteredContent.substring(0, 200)}..."
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Bulk Actions */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold mb-4">Bulk Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    onClick={() => {
                      const autoApprove = eventModerations.filter(e => e.results.overallAction === 'approve')
                      console.log(`Auto-approving ${autoApprove.length} events`)
                      alert(`Would auto-approve ${autoApprove.length} events`)
                    }}
                  >
                    Auto-Approve All Low Risk ({eventModerations.filter(e => e.results.overallAction === 'approve').length})
                  </button>
                  <button
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    onClick={() => {
                      const autoReject = eventModerations.filter(e => e.results.overallAction === 'reject')
                      console.log(`Auto-rejecting ${autoReject.length} events`)
                      alert(`Would auto-reject ${autoReject.length} events`)
                    }}
                  >
                    Auto-Reject All High Risk ({eventModerations.filter(e => e.results.overallAction === 'reject').length})
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    onClick={analyzeAllEvents}
                    disabled={isAnalyzing}
                  >
                    Re-Analyze All Events
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ModerationDashboard