/**
 * Security utilities for New West Event Calendar
 * Provides input validation, sanitization, and security checks
 */

// Content Security Policy helpers
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", 'https://vercel.live'],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'"],
  'connect-src': ["'self'"],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"]
};

// Input sanitization
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove other potentially dangerous tags
    .replace(/<(iframe|object|embed|link|meta|style)[^>]*>/gi, '')
    // Remove javascript: and data: URLs
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=/gi, '')
    // Limit length
    .substring(0, 1000);
};

// HTML encoding for display
export const encodeHTML = (str: string): string => {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Password strength validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Event data validation
export const validateEventData = (event: Record<string, unknown>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Required fields
  if (!event.title || typeof event.title !== 'string' || event.title.trim().length === 0) {
    errors.push('Title is required');
  }
  if (!event.date || typeof event.date !== 'string') {
    errors.push('Date is required');
  }
  if (!event.time || typeof event.time !== 'string') {
    errors.push('Time is required');
  }
  
  // Length limits
  if (event.title && typeof event.title === 'string' && event.title.length > 100) {
    errors.push('Title must be less than 100 characters');
  }
  if (event.description && typeof event.description === 'string' && event.description.length > 1000) {
    errors.push('Description must be less than 1000 characters');
  }
  if (event.location && typeof event.location === 'string' && event.location.length > 200) {
    errors.push('Location must be less than 200 characters');
  }
  
  // Date validation
  if (event.date && typeof event.date === 'string') {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(event.date)) {
      errors.push('Date must be in YYYY-MM-DD format');
    } else {
      const eventDate = new Date(event.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (eventDate < today) {
        errors.push('Event date cannot be in the past');
      }
      
      // Check if date is too far in the future (2 years)
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 2);
      if (eventDate > maxDate) {
        errors.push('Event date cannot be more than 2 years in the future');
      }
    }
  }
  
  // Time validation
  if (event.time && typeof event.time === 'string') {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(event.time)) {
      errors.push('Time must be in HH:MM format (24-hour)');
    }
  }
  
  // Category validation
  const validCategories = ['Community', 'Arts', 'Sports', 'Education', 'Business', 'Government'];
  if (event.category && typeof event.category === 'string' && !validCategories.includes(event.category)) {
    errors.push('Invalid category selected');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Rate limiting helper (client-side)
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  constructor(private maxAttempts: number = 5, private windowMs: number = 60000) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);
    
    return true;
  }
  
  getRemainingTime(identifier: string): number {
    const attempts = this.attempts.get(identifier) || [];
    if (attempts.length === 0) return 0;
    
    const oldestAttempt = Math.min(...attempts);
    const remainingTime = this.windowMs - (Date.now() - oldestAttempt);
    
    return Math.max(0, remainingTime);
  }
}

// CSRF token generation (for future backend integration)
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Secure random ID generation
export const generateSecureId = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Content filtering for user-generated content
export const filterProfanity = (text: string): string => {
  // Basic profanity filter - in production, use a more comprehensive solution
  const profanityList = ['spam', 'scam', 'fake', 'fraud'];
  let filtered = text;
  
  profanityList.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  });
  
  return filtered;
};

// URL validation
export const validateURL = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

// File upload validation (for future file upload features)
export const validateFile = (file: File): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (file.size > maxSize) {
    errors.push('File size must be less than 5MB');
  }
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('Only JPEG, PNG, GIF, and WebP images are allowed');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const securityUtils = {
  sanitizeInput,
  encodeHTML,
  validateEmail,
  validatePassword,
  validateEventData,
  RateLimiter,
  generateCSRFToken,
  generateSecureId,
  filterProfanity,
  validateURL,
  validateFile,
  CSP_DIRECTIVES
};

export default securityUtils;