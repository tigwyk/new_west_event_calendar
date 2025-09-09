"use client"
import React, { useState, useEffect, useCallback } from 'react'
import { subscriptions, commentService } from '../lib/database-dev'
import { sanitizeInput } from '../utils/security'

interface Comment {
  id: string
  event_id: string
  user_id: string
  user_name: string
  text: string
  created_at: string
  updated_at: string
}

interface RealTimeCommentsProps {
  eventId: string
  currentUser?: {
    id: string
    name: string
    isAdmin: boolean
  } | null
  initialComments?: Comment[]
}

const RealTimeComments: React.FC<RealTimeCommentsProps> = ({
  eventId,
  currentUser,
  initialComments = []
}) => {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load comments on mount
  useEffect(() => {
    const loadComments = async () => {
      if (initialComments.length === 0) {
        setIsLoading(true)
        try {
          const commentsData = await commentService.getEventComments(eventId)
          setComments(commentsData)
        } catch (error) {
          console.error('Error loading comments:', error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    loadComments()
  }, [eventId, initialComments.length])

  // Set up real-time subscription
  useEffect(() => {
    const subscription = subscriptions.subscribeToEventComments(
      eventId,
      (payload: any) => {
        console.log('Comment change received:', payload)
        
        if (payload.eventType === 'INSERT' && payload.new) {
          const newComment = payload.new as Comment
          setComments(prev => [...prev, newComment])
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          const updatedComment = payload.new as Comment
          setComments(prev => 
            prev.map(comment => 
              comment.id === updatedComment.id ? updatedComment : comment
            )
          )
        } else if (payload.eventType === 'DELETE' && payload.old) {
          const deletedComment = payload.old as Comment
          setComments(prev => 
            prev.filter(comment => comment.id !== deletedComment.id)
          )
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [eventId])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentUser || !newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const comment = await commentService.createComment({
        event_id: eventId,
        user_id: currentUser.id,
        user_name: currentUser.name,
        text: sanitizeInput(newComment.trim())
      })

      if (comment) {
        setNewComment('')
      }
    } catch (error) {
      console.error('Error creating comment:', error)
      alert('Failed to add comment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [currentUser, newComment, isSubmitting, eventId])

  const handleDelete = useCallback(async (commentId: string) => {
    if (!currentUser || !confirm('Are you sure you want to delete this comment?')) return

    try {
      await commentService.deleteComment(commentId)
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('Failed to delete comment. Please try again.')
    }
  }, [currentUser])

  const timeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diff = now.getTime() - time.getTime()
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }

  if (isLoading) {
    return (
      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
        <div className="text-sm text-gray-500">Loading comments...</div>
      </div>
    )
  }

  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
        💬 Comments ({comments.length})
        {comments.length > 0 && (
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live updates enabled"></span>
        )}
      </h4>

      {/* Comments list */}
      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map(comment => (
            <div
              key={comment.id}
              className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm animate-fade-in"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{comment.user_name}</span>
                  <span className="text-xs text-gray-500">
                    {timeAgo(comment.created_at)}
                  </span>
                  {comment.created_at !== comment.updated_at && (
                    <span className="text-xs text-gray-400">(edited)</span>
                  )}
                </div>
                
                {(currentUser?.id === comment.user_id || currentUser?.isAdmin) && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Delete
                  </button>
                )}
              </div>
              
              <p className="text-sm text-gray-800 dark:text-gray-200 break-words">
                {comment.text}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Add comment form */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full p-2 border rounded-md text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            maxLength={1000}
            disabled={isSubmitting}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {newComment.length}/1000 characters
            </span>
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && (
                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-sm text-gray-500 text-center py-2 border rounded-md">
          Please sign in to comment
        </div>
      )}
    </div>
  )
}

export default RealTimeComments