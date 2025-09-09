// Advanced content moderation system for New West Event Calendar
import { sanitizeInput } from '../utils/security'

export interface ModerationResult {
  isAppropriate: boolean
  score: number // 0-1, where 0 is completely inappropriate and 1 is completely appropriate
  flags: string[]
  suggestedAction: 'approve' | 'review' | 'reject'
  filteredContent?: string
}

export interface ModerationRule {
  name: string
  type: 'keyword' | 'pattern' | 'length' | 'custom'
  severity: 'low' | 'medium' | 'high'
  description: string
  check: (content: string) => boolean
  weight: number
}

// Profanity and inappropriate content lists
const PROHIBITED_WORDS = [
  // Basic profanity filter - in real implementation, this would be more comprehensive
  'spam', 'scam', 'fake', 'illegal', 'drugs'
]

const SUSPICIOUS_PATTERNS = [
  /\b(?:click here|free money|get rich|guaranteed|miracle|secret)\b/gi,
  /\b(?:buy now|act fast|limited time|urgent|must see)\b/gi,
  /\b(?:viagra|casino|poker|gambling)\b/gi,
  /(?:https?:\/\/)?(?:bit\.ly|tinyurl|t\.co)\/[\w-]+/gi, // Suspicious shortened URLs
  /\b[\w._%+-]+@[\w.-]+\.[A-Z]{2,}\b/gi, // Email addresses in content
  /\b(?:\d{3}[-.]?\d{3}[-.]?\d{4})\b/g // Phone numbers
]

const MODERATION_RULES: ModerationRule[] = [
  {
    name: 'Prohibited Words',
    type: 'keyword',
    severity: 'high',
    description: 'Contains prohibited or inappropriate words',
    weight: 0.8,
    check: (content: string) => {
      const lowerContent = content.toLowerCase()
      return PROHIBITED_WORDS.some(word => lowerContent.includes(word))
    }
  },
  {
    name: 'Suspicious Patterns',
    type: 'pattern',
    severity: 'medium',
    description: 'Contains suspicious marketing or spam patterns',
    weight: 0.6,
    check: (content: string) => {
      return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(content))
    }
  },
  {
    name: 'Excessive Capitalization',
    type: 'pattern',
    severity: 'low',
    description: 'Contains excessive capital letters',
    weight: 0.3,
    check: (content: string) => {
      const capsCount = (content.match(/[A-Z]/g) || []).length
      const totalLetters = (content.match(/[a-zA-Z]/g) || []).length
      return totalLetters > 10 && (capsCount / totalLetters) > 0.6
    }
  },
  {
    name: 'Excessive Length',
    type: 'length',
    severity: 'low',
    description: 'Content is excessively long',
    weight: 0.2,
    check: (content: string) => {
      return content.length > 2000
    }
  },
  {
    name: 'Minimal Content',
    type: 'length',
    severity: 'medium',
    description: 'Content is too short to be meaningful',
    weight: 0.4,
    check: (content: string) => {
      const trimmed = content.trim()
      return trimmed.length > 0 && trimmed.length < 10
    }
  },
  {
    name: 'Repetitive Content',
    type: 'custom',
    severity: 'medium',
    description: 'Contains repetitive patterns that may indicate spam',
    weight: 0.5,
    check: (content: string) => {
      const words = content.toLowerCase().split(/\s+/)
      const uniqueWords = new Set(words)
      return words.length > 20 && (uniqueWords.size / words.length) < 0.5
    }
  }
]

// Content moderation service
export const moderationService = {
  // Moderate text content (events, comments)
  moderateContent(content: string, type: 'event' | 'comment' = 'event'): ModerationResult {
    const sanitized = sanitizeInput(content)
    const flags: string[] = []
    let totalScore = 1.0 // Start with perfect score
    
    // Apply moderation rules
    for (const rule of MODERATION_RULES) {
      if (rule.check(sanitized)) {
        flags.push(rule.name)
        totalScore -= rule.weight
        
        // Early rejection for high-severity issues
        if (rule.severity === 'high') {
          return {
            isAppropriate: false,
            score: Math.max(totalScore, 0),
            flags,
            suggestedAction: 'reject',
            filteredContent: this.filterContent(sanitized)
          }
        }
      }
    }

    // Determine final score and action
    const finalScore = Math.max(totalScore, 0)
    let suggestedAction: 'approve' | 'review' | 'reject'
    
    if (finalScore >= 0.8) {
      suggestedAction = 'approve'
    } else if (finalScore >= 0.5) {
      suggestedAction = 'review'
    } else {
      suggestedAction = 'reject'
    }

    return {
      isAppropriate: finalScore >= 0.5,
      score: finalScore,
      flags,
      suggestedAction,
      filteredContent: flags.length > 0 ? this.filterContent(sanitized) : undefined
    }
  },

  // Filter content by replacing inappropriate parts
  filterContent(content: string): string {
    let filtered = content
    
    // Replace prohibited words
    for (const word of PROHIBITED_WORDS) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      filtered = filtered.replace(regex, '*'.repeat(word.length))
    }
    
    // Replace suspicious patterns
    for (const pattern of SUSPICIOUS_PATTERNS) {
      filtered = filtered.replace(pattern, '[REMOVED]')
    }
    
    return filtered
  },

  // Check if content needs human review
  needsHumanReview(content: string): boolean {
    const result = this.moderateContent(content)
    return result.suggestedAction === 'review' || result.flags.length > 2
  },

  // Moderate event data comprehensively
  moderateEvent(eventData: {
    title: string
    description: string
    location?: string
  }): {
    title: ModerationResult
    description: ModerationResult
    location?: ModerationResult
    overallAppropriate: boolean
    overallAction: 'approve' | 'review' | 'reject'
  } {
    const titleResult = this.moderateContent(eventData.title, 'event')
    const descriptionResult = this.moderateContent(eventData.description, 'event')
    const locationResult = eventData.location 
      ? this.moderateContent(eventData.location, 'event')
      : undefined

    // Determine overall appropriateness
    const results = [titleResult, descriptionResult, locationResult].filter(Boolean) as ModerationResult[]
    const overallScore = results.reduce((sum, r) => sum + r.score, 0) / results.length
    const hasHighSeverityFlags = results.some(r => 
      r.suggestedAction === 'reject'
    )

    let overallAction: 'approve' | 'review' | 'reject'
    if (hasHighSeverityFlags) {
      overallAction = 'reject'
    } else if (overallScore >= 0.8) {
      overallAction = 'approve'
    } else {
      overallAction = 'review'
    }

    return {
      title: titleResult,
      description: descriptionResult,
      location: locationResult,
      overallAppropriate: overallScore >= 0.5,
      overallAction
    }
  },

  // Generate moderation report
  generateModerationReport(results: ModerationResult[]): {
    summary: string
    recommendations: string[]
    riskLevel: 'low' | 'medium' | 'high'
  } {
    const totalFlags = results.reduce((sum, r) => sum + r.flags.length, 0)
    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length
    const rejectionCount = results.filter(r => r.suggestedAction === 'reject').length
    
    let riskLevel: 'low' | 'medium' | 'high'
    if (rejectionCount > 0 || averageScore < 0.3) {
      riskLevel = 'high'
    } else if (totalFlags > 3 || averageScore < 0.6) {
      riskLevel = 'medium'
    } else {
      riskLevel = 'low'
    }

    const recommendations: string[] = []
    if (rejectionCount > 0) {
      recommendations.push('Content contains prohibited material and should be rejected')
    }
    if (totalFlags > 2) {
      recommendations.push('Multiple moderation flags detected - requires human review')
    }
    if (averageScore < 0.5) {
      recommendations.push('Low quality content - consider requesting revisions')
    }

    return {
      summary: `Analyzed ${results.length} content pieces. Risk level: ${riskLevel}. ${totalFlags} flags detected.`,
      recommendations,
      riskLevel
    }
  }
}

// React hook for content moderation
export const useModerationTools = () => {
  const [isChecking, setIsChecking] = React.useState(false)
  const [moderationResults, setModerationResults] = React.useState<ModerationResult[]>([])

  const checkContent = React.useCallback(async (content: string) => {
    setIsChecking(true)
    
    try {
      // Simulate API delay for real-time feel
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const result = moderationService.moderateContent(content)
      setModerationResults(prev => [...prev, result])
      
      return result
    } finally {
      setIsChecking(false)
    }
  }, [])

  const checkEventData = React.useCallback(async (eventData: {
    title: string
    description: string
    location?: string
  }) => {
    setIsChecking(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 750))
      
      const result = moderationService.moderateEvent(eventData)
      const allResults = [
        result.title,
        result.description,
        result.location
      ].filter(Boolean) as ModerationResult[]
      
      setModerationResults(prev => [...prev, ...allResults])
      
      return result
    } finally {
      setIsChecking(false)
    }
  }, [])

  const clearResults = React.useCallback(() => {
    setModerationResults([])
  }, [])

  return {
    checkContent,
    checkEventData,
    clearResults,
    isChecking,
    moderationResults,
    report: moderationResults.length > 0 
      ? moderationService.generateModerationReport(moderationResults)
      : null
  }
}

// Add React import
import React from 'react'